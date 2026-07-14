"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BookingStatus, CourseType, LocationType, PaymentMethod, SubscriptionStatus } from "@/generated/prisma/enums";
import {
  createBlogPostInDb,
  deleteBlogPostInDb,
  updateBlogPostInDb,
} from "@/lib/blog";
import { sendBookingConfirmationEmail, sendContactEmail, sendSubscriptionActivationEmail } from "@/lib/mail";
import { defaultLandingContent, getLandingContent, isCustomUploadedImage, isStockPlaceholderImage, updateLandingContentInDb, type LandingContent } from "@/lib/landing-content";
import { resolveHomepageSectionOrder } from "@/lib/homepage-sections-config";
import { prisma } from "@/lib/prisma";
import { startOfWeekMonday } from "@/lib/db";
import { parseSiteDateTimeLocal } from "@/lib/site-timezone";
import { getBaseUrl, getStripeClient } from "@/lib/stripe";
import { resolveOrCreateSharedZoomLink } from "@/lib/booking-zoom";
import { cancelZoomMeeting, createZoomMeeting } from "@/lib/zoom";

const ADMIN_COOKIE = "yogaops_admin";

function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Crée automatiquement une réservation confirmée pour chaque créneau futur
 * du cours fixé au plan, dans la fenêtre [startsAt, endsAt] de l'abonnement.
 * Envoie un email récapitulatif unique à la cliente.
 */
export async function autoBookSubscriptionSlots(subscriptionId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { package: { include: { fixedCourse: true } } },
  });
  if (!sub) return;

  const courseId = sub.package.fixedCourseId ?? sub.fixedCourseId;
  if (!courseId) return; // plan à réservation libre — rien à faire

  const now = new Date();
  const slots = await prisma.timeSlot.findMany({
    where: {
      courseId,
      startsAt: { gt: now, lte: sub.endsAt },
      available: { gt: 0 },
    },
    orderBy: { startsAt: "asc" },
  });

  const bookedSlots: { startsAt: Date; zoomLink?: string | null }[] = [];

  for (const slot of slots) {
    await prisma.$transaction(async (tx) => {
      // Idempotence : ne pas recréer si déjà réservé
      const existing = await tx.booking.findFirst({
        where: {
          customerEmail: sub.customerEmail,
          slotId: slot.id,
          status: { not: BookingStatus.cancelled },
        },
      });
      if (existing) {
        bookedSlots.push({ startsAt: slot.startsAt, zoomLink: slot.zoomLink });
        return;
      }

      await tx.booking.create({
        data: {
          customerName: sub.customerName || sub.customerEmail,
          customerEmail: sub.customerEmail,
          slotId: slot.id,
          subscriptionId: sub.id,
          paymentMethod: PaymentMethod.subscription,
          status: BookingStatus.confirmed,
          // On attache le lien Zoom du créneau s'il existe déjà
          zoomLink: slot.zoomLink ?? null,
        },
      });
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: { available: slot.available - 1, booked: slot.booked + 1 },
      });
      bookedSlots.push({ startsAt: slot.startsAt, zoomLink: slot.zoomLink });
    });
  }

  // Email récapitulatif unique (pas un email par séance)
  if (bookedSlots.length > 0) {
    await sendSubscriptionActivationEmail({
      customerName: sub.customerName || sub.customerEmail,
      customerEmail: sub.customerEmail,
      planName: sub.package.name,
      courseTitle: sub.package.fixedCourse?.title ?? "",
      endsAt: sub.endsAt,
      bookedSlots,
    });
  }
}

/**
 * Annule toutes les réservations futures liées à l'abonnement
 * et restitue les places dans chaque créneau.
 * Exportée pour le webhook Stripe.
 */
export async function cancelFutureBookings(subscriptionId: string): Promise<void> {
  const now = new Date();
  const futureBookings = await prisma.booking.findMany({
    where: {
      subscriptionId,
      status: { not: BookingStatus.cancelled },
      slot: { startsAt: { gt: now } },
    },
    include: { slot: true },
  });

  for (const booking of futureBookings) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        // On efface aussi le lien Zoom de la résa : l'ex-cliente ne pourra pas rejoindre
        data: { status: BookingStatus.cancelled, zoomLink: null },
      });
      await tx.timeSlot.update({
        where: { id: booking.slotId },
        data: {
          available: booking.slot.available + 1,
          booked: Math.max(booking.slot.booked - 1, 0),
        },
      });
    });

    // Supprime le meeting Zoom uniquement si plus aucune autre participante confirmée
    const remaining = await prisma.booking.count({
      where: {
        slotId: booking.slotId,
        status: { not: BookingStatus.cancelled },
        id: { not: booking.id },
      },
    });
    if (remaining === 0 && booking.slot.zoomLink) {
      await cancelZoomMeeting(booking.slot.zoomLink);
      await prisma.timeSlot.update({
        where: { id: booking.slotId },
        data: { zoomLink: null },
      });
    }
  }
}

async function isAdmin(): Promise<boolean> {
  return (await cookies()).get(ADMIN_COOKIE)?.value === "1";
}

function revalidatePublicAndAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  revalidatePath("/reserver");
  revalidatePath("/tarifs");
  revalidatePath("/blog");
  revalidatePath("/ateliers");
  revalidatePath("/entreprises");
  revalidatePath("/cgv");
  revalidatePath("/cgu");
  revalidatePath("/mentions-legales");
}

export async function reserveSlot(formData: FormData) {
  const slotId = String(formData.get("slotId") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmailRaw = String(formData.get("customerEmail") ?? "").trim();
  const customerEmail = customerEmailRaw.toLowerCase();
  const paymentMethodInput = String(formData.get("paymentMethod") ?? "on_site");

  if (!slotId || !customerName || !customerEmail) return;

  const paymentMethod =
    paymentMethodInput === "stripe"
      ? PaymentMethod.stripe
      : paymentMethodInput === "subscription"
        ? PaymentMethod.subscription
        : PaymentMethod.on_site;

  const booking = await prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({
      where: { id: slotId },
      include: { course: true },
    });

    if (!slot || slot.available <= 0) {
      throw new Error("Ce creneau n'est plus disponible.");
    }

    let subscriptionId: string | undefined;

    if (paymentMethod === PaymentMethod.subscription) {
      const subscription = await tx.subscription.findFirst({
        where: {
          OR: [{ customerEmail }, { customerEmail: customerEmailRaw }],
          status: SubscriptionStatus.active,
          startsAt: { lte: slot.startsAt },
          endsAt: { gt: slot.startsAt },
          package: { isActive: true },
        },
        include: { package: true },
        orderBy: { createdAt: "desc" },
      });

      if (!subscription) {
        throw new Error("Abonnement introuvable ou invalide.");
      }

      if (
        subscription.package.allowedCourseType &&
        subscription.package.allowedCourseType !== slot.course.type
      ) {
        throw new Error(
          "Cet abonnement n'est pas valable pour ce type de cours."
        );
      }

      const weekStart = startOfWeekMonday(slot.startsAt);
      const weekRecord = await tx.subscriptionWeek.findUnique({
        where: {
          subscriptionId_weekStart: {
            subscriptionId: subscription.id,
            weekStart,
          },
        },
      });

      const sessionCountPerWeek = subscription.package.sessionCount;
      if (sessionCountPerWeek <= 0) {
        throw new Error("Abonnement sans seances disponibles.");
      }

      if (!weekRecord) {
        await tx.subscriptionWeek.create({
          data: {
            subscriptionId: subscription.id,
            weekStart,
            remainingSessions: sessionCountPerWeek - 1,
          },
        });
      } else {
        if (weekRecord.remainingSessions <= 0) {
          throw new Error("Plus de seances disponibles cette semaine.");
        }
        await tx.subscriptionWeek.update({
          where: { id: weekRecord.id },
          data: { remainingSessions: weekRecord.remainingSessions - 1 },
        });
      }

      subscriptionId = subscription.id;
    }

    await tx.timeSlot.update({
      where: { id: slotId },
      data: { available: slot.available - 1, booked: slot.booked + 1 },
    });

    return tx.booking.create({
      data: {
        customerName,
        customerEmail,
        slotId,
        subscriptionId,
        paymentMethod,
        status: "pending",
      },
      include: { slot: { include: { course: true } } },
    });
  });

  if (paymentMethod === PaymentMethod.stripe) {
    try {
      const stripe = getStripeClient();
      const baseUrl = getBaseUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        success_url: `${baseUrl}/confirmation?bookingId=${booking.id}`,
        cancel_url: `${baseUrl}/confirmation?bookingId=${booking.id}`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: booking.slot.course.priceEur * 100,
              product_data: {
                name: `${booking.slot.course.title} - YogaOps`,
              },
            },
          },
        ],
        metadata: { bookingId: booking.id, slotId },
      });

      if (!session.url) {
        throw new Error("Stripe Checkout: URL de paiement absente.");
      }
      redirect(session.url);
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "cancelled" },
        });
        const slot = await tx.timeSlot.findUnique({ where: { id: slotId } });
        if (!slot) return;
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: { available: slot.available + 1, booked: Math.max(slot.booked - 1, 0) },
        });
      });
      const slotDate = booking.slot.startsAt.toISOString().slice(0, 10);
      redirect(
        `/reserver?date=${slotDate}&slotId=${slotId}&email=${encodeURIComponent(
          customerEmail
        )}&error=stripe_checkout`
      );
    }
  }

  revalidatePath("/reserver");
  revalidatePath("/admin");
  redirect(`/confirmation?bookingId=${booking.id}`);
}

export async function buySubscriptionStripe(formData: FormData) {
  const packageId = String(formData.get("packageId") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim().toLowerCase();

  if (!packageId || !customerEmail || !customerName) return redirect("/tarifs");

  const pkg = await prisma.packagePlan.findUnique({
    where: { id: packageId },
    select: {
      id: true, name: true, priceEur: true, validityDays: true,
      sessionCount: true, stripePriceId: true, billingIntervalMonths: true,
      fixedCourseId: true,
    },
  });
  if (!pkg || !pkg.id) return redirect("/tarifs");

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();

  // Abonnement récurrent Stripe Billing
  if (pkg.stripePriceId && pkg.billingIntervalMonths) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: customerEmail,
      line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
      metadata: { packageId: pkg.id, customerEmail, customerName },
      success_url: `${baseUrl}/abonnement?email=${encodeURIComponent(customerEmail)}&success=1`,
      cancel_url: `${baseUrl}/tarifs`,
    });
    if (session.url) redirect(session.url);
    return redirect("/tarifs");
  }

  // Paiement unique (ancien comportement)
  const endsAt = new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      customerEmail,
      customerName,
      status: SubscriptionStatus.pending,
      paymentMethod: PaymentMethod.stripe,
      packageId: pkg.id,
      fixedCourseId: pkg.fixedCourseId ?? null,
      endsAt,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    success_url: `${baseUrl}/reserver?subscriptionId=${subscription.id}&email=${encodeURIComponent(
      customerEmail
    )}`,
    cancel_url: `${baseUrl}/reserver?subscriptionId=${subscription.id}&email=${encodeURIComponent(
      customerEmail
    )}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pkg.priceEur * 100,
          product_data: { name: `${pkg.name} - YogaOps` },
        },
      },
    ],
    metadata: { subscriptionId: subscription.id },
  });

  if (session.url) redirect(session.url);
  redirect("/tarifs");
}

export async function cancelSubscription(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const customerEmail = String(formData.get("customerEmail") ?? "").trim().toLowerCase();
  if (!subscriptionId || !customerEmail) return;

  const sub = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      OR: [{ customerEmail }, { customerEmail: customerEmail }],
      status: SubscriptionStatus.active,
    },
  });
  if (!sub) return;

  // Si abonnement Stripe récurrent → programmer la résiliation en fin de période
  if (sub.stripeSubscriptionId) {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: true },
    });
    // Les places restent réservées jusqu'à la fin de la période
  } else {
    // Annulation immédiate (paiement unique) → libérer les places futures
    await cancelFutureBookings(subscriptionId);
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.cancelled },
    });
  }

  revalidatePath("/abonnement");
  revalidatePath("/admin/abonnements");
}

export async function adminLogin(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const expected = process.env.ADMIN_BACKOFFICE_PIN;
  if (!expected) throw new Error("ADMIN_BACKOFFICE_PIN non configuré");
  if (pin !== expected) return;
  (await cookies()).set(ADMIN_COOKIE, "1", { httpOnly: true, sameSite: "lax" });
  revalidatePath("/admin");
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

export async function createCourse(formData: FormData) {
  if (!(await isAdmin())) return;

  const type = String(formData.get("type") ?? "collectif");
  const location = String(formData.get("location") ?? "en_ligne");
  const priceEur = toNumber(formData.get("priceEur"), 15);
  const durationMin = toNumber(formData.get("durationMin"), 60);
  const capacity = toNumber(formData.get("capacity"), type === "individuel" ? 1 : 10);
  const isWorkshop = formData.get("isWorkshop") === "1";

  await prisma.course.create({
    data: {
      title: String(formData.get("title") ?? "Nouveau cours"),
      description: String(formData.get("description") ?? ""),
      benefits: String(formData.get("benefits") ?? ""),
      coverImage: String(formData.get("coverImage") ?? ""),
      type: type === "individuel" ? CourseType.individuel : CourseType.collectif,
      location: location === "presentiel" ? LocationType.presentiel : LocationType.en_ligne,
      priceEur,
      durationMin,
      capacity,
      isWorkshop,
    },
  });

  revalidatePublicAndAdmin();
}

export async function createPackage(formData: FormData) {
  if (!(await isAdmin())) return;

  const allowedCourseTypeRaw = String(formData.get("allowedCourseType") ?? "");
  const allowedCourseType =
    allowedCourseTypeRaw === "individuel"
      ? CourseType.individuel
      : allowedCourseTypeRaw === "collectif"
        ? CourseType.collectif
        : null;

  const name = String(formData.get("name") ?? "Nouvel abonnement");
  const description = String(formData.get("description") ?? "");
  const priceEur = toNumber(formData.get("priceEur"), 79);
  const sessionCount = toNumber(formData.get("sessionCount"), 1);
  const billingIntervalMonthsRaw = toNumber(formData.get("billingIntervalMonths"), 0);
  const billingIntervalMonths = [3, 6, 12].includes(billingIntervalMonthsRaw)
    ? billingIntervalMonthsRaw
    : null;
  const validityDays = billingIntervalMonths
    ? billingIntervalMonths * 30
    : toNumber(formData.get("validityDays"), 30);

  let stripePriceId: string | null = null;
  if (billingIntervalMonths) {
    const stripe = getStripeClient();
    const product = await stripe.products.create({
      name: `${name} - YogaOps`,
      description: description || undefined,
    });
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: priceEur * 100,
      recurring: { interval: "month", interval_count: billingIntervalMonths },
    });
    stripePriceId = price.id;
  }

  const fixedCourseIdRaw = String(formData.get("fixedCourseId") ?? "").trim();
  let fixedCourseId = fixedCourseIdRaw || null;

  // ── Auto-planification : crée le cours + les créneaux hebdomadaires ──────────
  const scheduleDayRaw = toNumber(formData.get("scheduleDayOfWeek"), -1);
  const scheduleTime = String(formData.get("scheduleTime") ?? "").trim();   // "HH:MM"
  const scheduleCapacity = toNumber(formData.get("scheduleCapacity"), 10);
  const scheduleLocation = String(formData.get("scheduleLocation") ?? "en_ligne");
  const scheduleDurationMin = toNumber(formData.get("scheduleDurationMin"), 60);
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  if (scheduleDayRaw >= 0 && scheduleDayRaw <= 6 && scheduleTime) {
    const [hh, mm] = scheduleTime.split(":").map(Number);
    const isOnline = scheduleLocation !== "presentiel";

    // Crée un cours dédié à ce plan
    const course = await prisma.course.create({
      data: {
        title: `${name} — ${dayNames[scheduleDayRaw]} ${scheduleTime}`,
        description,
        type: allowedCourseType ?? CourseType.collectif,
        location: isOnline ? LocationType.en_ligne : LocationType.presentiel,
        durationMin: scheduleDurationMin,
        priceEur,
        capacity: scheduleCapacity,
        isWorkshop: false,
      },
    });
    fixedCourseId = course.id;

    // Génère tous les créneaux hebdomadaires sur la durée du plan
    const horizonDays = validityDays + 14; // un peu de marge
    const now = new Date();
    const slotDates: Date[] = [];

    const cursor = new Date(now);
    cursor.setHours(hh, mm, 0, 0);
    while (cursor.getDay() !== scheduleDayRaw) {
      cursor.setDate(cursor.getDate() + 1);
    }
    if (cursor <= now) cursor.setDate(cursor.getDate() + 7);

    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + horizonDays);

    while (cursor <= horizon) {
      slotDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }

    // Crée chaque créneau et génère le lien Zoom si en ligne
    for (const startsAt of slotDates) {
      let zoomLink: string | null = null;
      if (isOnline) {
        zoomLink = await createZoomMeeting({
          topic: `${course.title}`,
          startTime: startsAt,
          durationMin: scheduleDurationMin,
        });
      }
      await prisma.timeSlot.create({
        data: {
          courseId: course.id,
          startsAt,
          available: scheduleCapacity,
          zoomLink,
        },
      });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  await prisma.packagePlan.create({
    data: {
      name,
      description,
      priceEur,
      sessionCount,
      validityDays,
      allowedCourseType,
      billingIntervalMonths,
      stripePriceId,
      fixedCourseId,
    },
  });

  revalidatePublicAndAdmin();
}

export async function createSlot(formData: FormData) {
  if (!(await isAdmin())) return;

  const courseId = String(formData.get("courseId") ?? "");
  const startsAt = String(formData.get("startsAt") ?? "");
  const available = toNumber(formData.get("available"), 1);
  if (!courseId || !startsAt) return;

  await prisma.timeSlot.create({
    data: {
      courseId,
      startsAt: parseSiteDateTimeLocal(startsAt),
      available,
      booked: 0,
    },
  });

  revalidatePublicAndAdmin();
}

export async function updateCourse(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const type = String(formData.get("type") ?? "collectif");
  const location = String(formData.get("location") ?? "en_ligne");
  const isWorkshop = formData.get("isWorkshop") === "1";

  await prisma.course.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      benefits: String(formData.get("benefits") ?? "").trim(),
      coverImage: String(formData.get("coverImage") ?? "").trim(),
      type: type === "individuel" ? CourseType.individuel : CourseType.collectif,
      location: location === "presentiel" ? LocationType.presentiel : LocationType.en_ligne,
      durationMin: toNumber(formData.get("durationMin"), 60),
      priceEur: toNumber(formData.get("priceEur"), 15),
      capacity: toNumber(formData.get("capacity"), 10),
      isWorkshop,
    },
  });

  revalidatePublicAndAdmin();
}

export async function deleteCourse(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const slotCount = await prisma.timeSlot.count({ where: { courseId: id } });
  if (slotCount > 0) {
    await prisma.course.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.course.delete({ where: { id } });
  }
  revalidatePublicAndAdmin();
}

export async function updatePackage(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const allowedCourseTypeRaw = String(formData.get("allowedCourseType") ?? "");
  const allowedCourseType =
    allowedCourseTypeRaw === "individuel"
      ? CourseType.individuel
      : allowedCourseTypeRaw === "collectif"
        ? CourseType.collectif
        : null;

  const fixedCourseIdRaw = String(formData.get("fixedCourseId") ?? "").trim();

  await prisma.packagePlan.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      priceEur: toNumber(formData.get("priceEur"), 79),
      sessionCount: toNumber(formData.get("sessionCount"), 1),
      validityDays: toNumber(formData.get("validityDays"), 30),
      allowedCourseType,
      fixedCourseId: fixedCourseIdRaw || null,
    },
  });
  revalidatePublicAndAdmin();
}

export async function deletePackage(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.packagePlan.delete({ where: { id } });
  revalidatePublicAndAdmin();
}

export async function updateSlot(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const startsAt = String(formData.get("startsAt") ?? "");
  const available = toNumber(formData.get("available"), 0);
  const booked = toNumber(formData.get("booked"), 0);
  const zoomLinkRaw = formData.has("zoomLink")
    ? String(formData.get("zoomLink") ?? "").trim()
    : undefined;

  await prisma.timeSlot.update({
    where: { id },
    data: {
      startsAt: startsAt ? parseSiteDateTimeLocal(startsAt) : undefined,
      available: Math.max(available, 0),
      booked: Math.max(booked, 0),
      ...(zoomLinkRaw !== undefined ? { zoomLink: zoomLinkRaw || null } : {}),
    },
  });

  // Propager le lien Zoom à toutes les réservations confirmées du créneau
  if (zoomLinkRaw) {
    await prisma.booking.updateMany({
      where: { slotId: id, status: BookingStatus.confirmed },
      data: { zoomLink: zoomLinkRaw },
    });
  }

  revalidatePublicAndAdmin();
}

export async function deleteSlot(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.timeSlot.delete({ where: { id } });
  revalidatePublicAndAdmin();
}

export async function updateBookingStatus(formData: FormData) {
  if (!(await isAdmin())) return;
  const bookingId = String(formData.get("bookingId") ?? "");
  const targetStatus = String(formData.get("targetStatus") ?? "");
  if (!bookingId || !targetStatus) return;

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { slot: { include: { course: true } } },
    });
    if (!booking) return;

    if (targetStatus === "cancelled" && booking.status !== "cancelled") {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      });
      await tx.timeSlot.update({
        where: { id: booking.slotId },
        data: { available: booking.slot.available + 1, booked: Math.max(booking.slot.booked - 1, 0) },
      });

      if (
        booking.paymentMethod === PaymentMethod.subscription &&
        booking.subscriptionId
      ) {
        const weekStart = startOfWeekMonday(booking.slot.startsAt);
        const weekRecord = await tx.subscriptionWeek.findUnique({
          where: {
            subscriptionId_weekStart: {
              subscriptionId: booking.subscriptionId,
              weekStart,
            },
          },
        });

        if (!weekRecord) {
          await tx.subscriptionWeek.create({
            data: {
              subscriptionId: booking.subscriptionId,
              weekStart,
              remainingSessions: 1,
            },
          });
        } else {
          await tx.subscriptionWeek.update({
            where: { id: weekRecord.id },
            data: { remainingSessions: weekRecord.remainingSessions + 1 },
          });
        }
      }

      return;
    }

    if (targetStatus === "confirmed" && booking.status !== "confirmed") {
      const zoomLink = await resolveOrCreateSharedZoomLink(tx, {
        bookingId,
        slotId: booking.slotId,
        courseTitle: booking.slot.course.title,
        slotStartsAt: booking.slot.startsAt,
        durationMin: booking.slot.course.durationMin,
        location: booking.slot.course.location,
        bookingZoomLink: booking.zoomLink,
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed", zoomLink: zoomLink ?? undefined },
      });

      await sendBookingConfirmationEmail({
        bookingId: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        courseTitle: booking.slot.course.title,
        startsAt: booking.slot.startsAt,
        zoomLink,
        priceEur: booking.slot.course.priceEur,
      });
    }
  });

  revalidatePublicAndAdmin();
}

export async function updateBookingZoomLink(formData: FormData) {
  if (!(await isAdmin())) return;

  const bookingId = String(formData.get("bookingId") ?? "");
  const zoomLinkRaw = String(formData.get("zoomLink") ?? "").trim();
  if (!bookingId) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { zoomLink: zoomLinkRaw || null },
  });

  revalidatePublicAndAdmin();
  revalidatePath("/confirmation");
}

export async function updateSubscriptionStatus(formData: FormData) {
  if (!(await isAdmin())) return;
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const targetStatus = String(formData.get("targetStatus") ?? "");
  if (!subscriptionId || !targetStatus) return;

  if (
    targetStatus !== SubscriptionStatus.pending &&
    targetStatus !== SubscriptionStatus.active &&
    targetStatus !== SubscriptionStatus.cancelled
  ) {
    return;
  }

  // Annulation admin → libérer toutes les places futures
  if (targetStatus === SubscriptionStatus.cancelled) {
    await cancelFutureBookings(subscriptionId);
  }

  // Activation admin → auto-réserver les créneaux fixes si applicable
  if (targetStatus === SubscriptionStatus.active) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.active, cancelAtPeriodEnd: false },
    });
    await autoBookSubscriptionSlots(subscriptionId);
    revalidatePath("/admin/abonnements");
    revalidatePath("/abonnement");
    return;
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: targetStatus as SubscriptionStatus },
  });

  revalidatePath("/admin/abonnements");
  revalidatePath("/abonnement");
}

function toText(value: FormDataEntryValue | null, fallback: string): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toItems(value: FormDataEntryValue | null, fallback: string[]): string[] {
  const text = String(value ?? "");
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

const LANDING_BLOCK_FIELDS: Record<string, readonly (keyof LandingContent)[]> = {
  hero: [
    "heroTitle",
    "heroSubtitle",
    "heroIntro",
    "firstSessionOffer",
    "finalCtaButtonLabel",
    "heroImage1Url",
    "heroImage2Url",
  ],
  offerImages: [
    "collectiveOfferImageUrl",
    "individualOfferImageUrl",
    "presentielOfferImageUrl",
    "techWomenOfferImageUrl",
  ],
  techWomen: [
    "techWomenLabel",
    "techWomenTitle",
    "techWomenParagraphs",
    "techWomenCtaLabel",
  ],
  offers: [
    "formatTitle",
    "formatText",
    "offerCollectiveLabel",
    "offerCollectiveTitle",
    "offerCollectiveDescription",
    "offerCollectiveMeta",
    "offerTechLabel",
    "offerTechTitle",
    "offerTechDescription",
    "offerTechMeta",
    "offerIndividualLabel",
    "offerIndividualTitle",
    "offerIndividualDescription",
    "offerIndividualMeta",
  ],
  why: ["whyTitle", "whyParagraphs"],
  benefits: ["practicalInfoTitle", "practicalInfoItems"],
  testimonials: ["socialProofTitle", "socialProofItems"],
  entreprises: [
    "entreprisesHeroTitle",
    "entreprisesHeroText",
    "entreprisesWhyTitle",
    "entreprisesWhyItems",
    "entreprisesHowTitle",
    "entreprisesHowItems",
    "entreprisesCtaLabel",
    "chairYogaImageUrl",
  ],
  ateliers: [
    "ateliersPageTitle",
    "ateliersPageIntro",
    "ateliersWorkshops",
    "ateliersAnnounceText",
    "ateliersSignupTitle",
    "ateliersSignupButtonLabel",
    "ateliersBlogTitle",
    "ateliersBlogIntro",
  ],
  homepageLayout: ["homepageSectionOrder"],
  reserver: [
    "reserverCollectiveWeekdays",
    "reserverTechWomenWeekdays",
    "reserverIndividualWeekdays",
    "reserverTechWomenMatch",
  ],
  teacherBio: ["teacherBioTitle", "teacherBioText", "teacherPhotoUrl"],
  ctaFooter: [
    "finalCtaTitle",
    "finalCtaText",
    "finalCtaButtonLabel",
    "footerAddress",
    "footerPhone",
    "footerEmail",
    "facebookUrl",
    "instagramUrl",
    "tiktokUrl",
    "linkedinUrl",
    "cgvContent",
    "cguContent",
    "legalNoticeContent",
  ],
};

const LANDING_ARRAY_FIELDS = new Set<keyof LandingContent>([
  "whyParagraphs",
  "formatItems",
  "socialProofItems",
  "chairYogaItems",
  "practicalInfoItems",
  "techWomenParagraphs",
  "offerCollectiveMeta",
  "offerTechMeta",
  "offerIndividualMeta",
  "entreprisesWhyItems",
  "entreprisesHowItems",
  "homepageSectionOrder",
  "reserverCollectiveWeekdays",
  "reserverTechWomenWeekdays",
  "reserverIndividualWeekdays",
]);

const LANDING_IMAGE_FIELDS = new Set<keyof LandingContent>([
  "heroImage1Url",
  "heroImage2Url",
  "collectiveOfferImageUrl",
  "individualOfferImageUrl",
  "presentielOfferImageUrl",
  "techWomenOfferImageUrl",
  "chairYogaImageUrl",
  "teacherPhotoUrl",
]);

function textFromForm(
  formData: FormData,
  field: keyof LandingContent,
  current: string,
): string {
  if (!formData.has(field)) return current;
  const value = String(formData.get(field) ?? "").trim();
  if (LANDING_IMAGE_FIELDS.has(field)) {
    if (isCustomUploadedImage(value)) return value;
    if (isCustomUploadedImage(current) && isStockPlaceholderImage(value)) return current;
    if (!value && isCustomUploadedImage(current)) return current;
  }
  return value;
}

function itemsFromForm(
  formData: FormData,
  field: keyof LandingContent,
  current: string[],
): string[] {
  if (!formData.has(field)) return current;
  const text = String(formData.get(field) ?? "");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function mergeLandingBlock(
  current: LandingContent,
  formData: FormData,
  fields: readonly (keyof LandingContent)[],
): LandingContent {
  const next = { ...current };
  for (const field of fields) {
    if (LANDING_ARRAY_FIELDS.has(field)) {
      const value = itemsFromForm(formData, field, current[field] as string[]);
      (next as Record<string, unknown>)[field] = value;
    } else {
      const value = textFromForm(formData, field, current[field] as string);
      (next as Record<string, unknown>)[field] = value;
    }
  }
  return next;
}

export type LandingBlockResult = { ok: true } | { ok: false; error: string };

export async function updateLandingBlock(formData: FormData): Promise<LandingBlockResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Session expiree. Reconnectez-vous au backoffice." };
  }

  const blockId = String(formData.get("blockId") ?? "").trim();
  const fields = LANDING_BLOCK_FIELDS[blockId];
  if (!fields) {
    return { ok: false, error: "Bloc inconnu. Rechargez la page et reessayez." };
  }

  try {
    const current = await getLandingContent();
    const merged = mergeLandingBlock(current, formData, fields);
    if (blockId === "homepageLayout") {
      merged.homepageSectionOrder = resolveHomepageSectionOrder(merged.homepageSectionOrder);
    }
    await updateLandingContentInDb(merged);
    revalidatePublicAndAdmin();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d enregistrer ce bloc. Verifiez vos donnees et reessayez." };
  }
}

export async function updateLandingContent(formData: FormData) {
  if (!(await isAdmin())) {
    redirect("/admin");
  }

  await updateLandingContentInDb({
    heroTitle: toText(formData.get("heroTitle"), defaultLandingContent.heroTitle),
    heroSubtitle: toText(formData.get("heroSubtitle"), defaultLandingContent.heroSubtitle),
    heroIntro: toText(formData.get("heroIntro"), defaultLandingContent.heroIntro),
    heroImage1Url: toText(formData.get("heroImage1Url"), defaultLandingContent.heroImage1Url),
    heroImage2Url: toText(formData.get("heroImage2Url"), defaultLandingContent.heroImage2Url),
    collectiveOfferImageUrl: toText(
      formData.get("collectiveOfferImageUrl"),
      defaultLandingContent.collectiveOfferImageUrl,
    ),
    individualOfferImageUrl: toText(
      formData.get("individualOfferImageUrl"),
      defaultLandingContent.individualOfferImageUrl,
    ),
    presentielOfferImageUrl: toText(
      formData.get("presentielOfferImageUrl"),
      defaultLandingContent.presentielOfferImageUrl,
    ),
    techWomenOfferImageUrl: toText(
      formData.get("techWomenOfferImageUrl"),
      defaultLandingContent.techWomenOfferImageUrl,
    ),
    whyTitle: toText(formData.get("whyTitle"), defaultLandingContent.whyTitle),
    whyParagraphs: toItems(formData.get("whyParagraphs"), defaultLandingContent.whyParagraphs),
    formatTitle: toText(formData.get("formatTitle"), defaultLandingContent.formatTitle),
    formatText: toText(formData.get("formatText"), defaultLandingContent.formatText),
    formatItems: toItems(formData.get("formatItems"), defaultLandingContent.formatItems),
    techWomenLabel: toText(formData.get("techWomenLabel"), defaultLandingContent.techWomenLabel),
    techWomenTitle: toText(formData.get("techWomenTitle"), defaultLandingContent.techWomenTitle),
    techWomenParagraphs: toItems(
      formData.get("techWomenParagraphs"),
      defaultLandingContent.techWomenParagraphs,
    ),
    techWomenCtaLabel: toText(
      formData.get("techWomenCtaLabel"),
      defaultLandingContent.techWomenCtaLabel,
    ),
    offerCollectiveLabel: toText(
      formData.get("offerCollectiveLabel"),
      defaultLandingContent.offerCollectiveLabel,
    ),
    offerCollectiveTitle: toText(
      formData.get("offerCollectiveTitle"),
      defaultLandingContent.offerCollectiveTitle,
    ),
    offerCollectiveDescription: toText(
      formData.get("offerCollectiveDescription"),
      defaultLandingContent.offerCollectiveDescription,
    ),
    offerCollectiveMeta: toItems(
      formData.get("offerCollectiveMeta"),
      defaultLandingContent.offerCollectiveMeta,
    ),
    offerTechLabel: toText(formData.get("offerTechLabel"), defaultLandingContent.offerTechLabel),
    offerTechTitle: toText(formData.get("offerTechTitle"), defaultLandingContent.offerTechTitle),
    offerTechDescription: toText(
      formData.get("offerTechDescription"),
      defaultLandingContent.offerTechDescription,
    ),
    offerTechMeta: toItems(formData.get("offerTechMeta"), defaultLandingContent.offerTechMeta),
    offerIndividualLabel: toText(
      formData.get("offerIndividualLabel"),
      defaultLandingContent.offerIndividualLabel,
    ),
    offerIndividualTitle: toText(
      formData.get("offerIndividualTitle"),
      defaultLandingContent.offerIndividualTitle,
    ),
    offerIndividualDescription: toText(
      formData.get("offerIndividualDescription"),
      defaultLandingContent.offerIndividualDescription,
    ),
    offerIndividualMeta: toItems(
      formData.get("offerIndividualMeta"),
      defaultLandingContent.offerIndividualMeta,
    ),
    specializationMessage: toText(
      formData.get("specializationMessage"),
      defaultLandingContent.specializationMessage,
    ),
    fatigueMessage: toText(formData.get("fatigueMessage"), defaultLandingContent.fatigueMessage),
    enterpriseMessage: toText(
      formData.get("enterpriseMessage"),
      defaultLandingContent.enterpriseMessage,
    ),
    outdoorMessage: toText(formData.get("outdoorMessage"), defaultLandingContent.outdoorMessage),
    firstSessionOffer: toText(
      formData.get("firstSessionOffer"),
      defaultLandingContent.firstSessionOffer,
    ),
    socialProofTitle: toText(
      formData.get("socialProofTitle"),
      defaultLandingContent.socialProofTitle,
    ),
    socialProofItems: toItems(
      formData.get("socialProofItems"),
      defaultLandingContent.socialProofItems,
    ),
    chairYogaTitle: toText(formData.get("chairYogaTitle"), defaultLandingContent.chairYogaTitle),
    chairYogaText: toText(formData.get("chairYogaText"), defaultLandingContent.chairYogaText),
    chairYogaItems: toItems(formData.get("chairYogaItems"), defaultLandingContent.chairYogaItems),
    chairYogaImageUrl: toText(
      formData.get("chairYogaImageUrl"),
      defaultLandingContent.chairYogaImageUrl,
    ),
    entreprisesHeroTitle: toText(
      formData.get("entreprisesHeroTitle"),
      defaultLandingContent.entreprisesHeroTitle,
    ),
    entreprisesHeroText: toText(
      formData.get("entreprisesHeroText"),
      defaultLandingContent.entreprisesHeroText,
    ),
    entreprisesWhyTitle: toText(
      formData.get("entreprisesWhyTitle"),
      defaultLandingContent.entreprisesWhyTitle,
    ),
    entreprisesWhyItems: toItems(
      formData.get("entreprisesWhyItems"),
      defaultLandingContent.entreprisesWhyItems,
    ),
    entreprisesHowTitle: toText(
      formData.get("entreprisesHowTitle"),
      defaultLandingContent.entreprisesHowTitle,
    ),
    entreprisesHowItems: toItems(
      formData.get("entreprisesHowItems"),
      defaultLandingContent.entreprisesHowItems,
    ),
    entreprisesCtaLabel: toText(
      formData.get("entreprisesCtaLabel"),
      defaultLandingContent.entreprisesCtaLabel,
    ),
    ateliersPageTitle: toText(
      formData.get("ateliersPageTitle"),
      defaultLandingContent.ateliersPageTitle,
    ),
    ateliersPageIntro: toText(
      formData.get("ateliersPageIntro"),
      defaultLandingContent.ateliersPageIntro,
    ),
    ateliersWorkshops: toText(
      formData.get("ateliersWorkshops"),
      defaultLandingContent.ateliersWorkshops,
    ),
    ateliersAnnounceText: toText(
      formData.get("ateliersAnnounceText"),
      defaultLandingContent.ateliersAnnounceText,
    ),
    ateliersSignupTitle: toText(
      formData.get("ateliersSignupTitle"),
      defaultLandingContent.ateliersSignupTitle,
    ),
    ateliersSignupButtonLabel: toText(
      formData.get("ateliersSignupButtonLabel"),
      defaultLandingContent.ateliersSignupButtonLabel,
    ),
    ateliersBlogTitle: toText(
      formData.get("ateliersBlogTitle"),
      defaultLandingContent.ateliersBlogTitle,
    ),
    ateliersBlogIntro: toText(
      formData.get("ateliersBlogIntro"),
      defaultLandingContent.ateliersBlogIntro,
    ),
    homepageSectionOrder: resolveHomepageSectionOrder(
      toItems(formData.get("homepageSectionOrder"), defaultLandingContent.homepageSectionOrder),
    ),
    reserverCollectiveWeekdays: toItems(formData.get("reserverCollectiveWeekdays"), []),
    reserverTechWomenWeekdays: toItems(formData.get("reserverTechWomenWeekdays"), []),
    reserverIndividualWeekdays: toItems(formData.get("reserverIndividualWeekdays"), []),
    reserverTechWomenMatch: toText(
      formData.get("reserverTechWomenMatch"),
      defaultLandingContent.reserverTechWomenMatch,
    ),
    teacherBioTitle: toText(formData.get("teacherBioTitle"), defaultLandingContent.teacherBioTitle),
    teacherBioText: toText(formData.get("teacherBioText"), defaultLandingContent.teacherBioText),
    teacherPhotoUrl: toText(formData.get("teacherPhotoUrl"), ""),
    practicalInfoTitle: toText(
      formData.get("practicalInfoTitle"),
      defaultLandingContent.practicalInfoTitle,
    ),
    practicalInfoItems: toItems(
      formData.get("practicalInfoItems"),
      defaultLandingContent.practicalInfoItems,
    ),
    finalCtaTitle: toText(formData.get("finalCtaTitle"), defaultLandingContent.finalCtaTitle),
    finalCtaText: toText(formData.get("finalCtaText"), defaultLandingContent.finalCtaText),
    finalCtaButtonLabel: toText(
      formData.get("finalCtaButtonLabel"),
      defaultLandingContent.finalCtaButtonLabel,
    ),
    footerAddress: toText(formData.get("footerAddress"), defaultLandingContent.footerAddress),
    footerPhone: toText(formData.get("footerPhone"), defaultLandingContent.footerPhone),
    footerEmail: toText(formData.get("footerEmail"), defaultLandingContent.footerEmail),
    facebookUrl: toText(formData.get("facebookUrl"), defaultLandingContent.facebookUrl),
    instagramUrl: toText(formData.get("instagramUrl"), defaultLandingContent.instagramUrl),
    tiktokUrl: toText(formData.get("tiktokUrl"), defaultLandingContent.tiktokUrl),
    linkedinUrl: toText(formData.get("linkedinUrl"), defaultLandingContent.linkedinUrl),
    cgvContent: toText(formData.get("cgvContent"), defaultLandingContent.cgvContent),
    cguContent: toText(formData.get("cguContent"), defaultLandingContent.cguContent),
    legalNoticeContent: toText(
      formData.get("legalNoticeContent"),
      defaultLandingContent.legalNoticeContent,
    ),
  });

  revalidatePublicAndAdmin();
}

export async function sendContactMessage(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const startedAtRaw = String(formData.get("startedAt") ?? "").trim();

  if (website) {
    redirect("/?contact=ok#contact-form");
  }

  const startedAt = Number(startedAtRaw);
  const elapsedMs = Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
  if (elapsedMs > 0 && elapsedMs < 1500) {
    redirect("/?contact=error#contact-form");
  }

  if (!fullName || !email || !message) {
    redirect("/?contact=error#contact-form");
  }

  try {
    await sendContactEmail({ fullName, email, message });
  } catch {
    redirect("/?contact=error#contact-form");
  }

  redirect("/?contact=ok#contact-form");
}

export async function notifyAtelierInterest(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    redirect("/ateliers?signup=ok#atelier-signup");
  }

  if (!firstName || !email) {
    redirect("/ateliers?signup=error#atelier-signup");
  }

  try {
    await sendContactEmail({
      fullName: firstName,
      email,
      message:
        "Inscription a la liste d attente des prochains ateliers YogaOps (prenom + email).",
    });
  } catch {
    redirect("/ateliers?signup=error#atelier-signup");
  }

  redirect("/ateliers?signup=ok#atelier-signup");
}

export type BlogPostResult = { ok: true } | { ok: false; error: string };

function revalidateBlogSlug(slug: string | null | undefined) {
  if (!slug) return;
  revalidatePath(`/blog/${slug}`);
}

export async function createBlogPost(formData: FormData): Promise<BlogPostResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Session expiree. Reconnectez-vous au backoffice." };
  }
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const isPublished = String(formData.get("isPublished") ?? "1") === "1";
  if (!title || !excerpt || !content) {
    return { ok: false, error: "Titre, resume et contenu sont obligatoires." };
  }

  try {
    const slug = await createBlogPostInDb({ title, excerpt, content, coverImage, isPublished });
    revalidatePublicAndAdmin();
    revalidateBlogSlug(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de creer l article. Reessayez." };
  }
}

export async function updateBlogPost(formData: FormData): Promise<BlogPostResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Session expiree. Reconnectez-vous au backoffice." };
  }
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const isPublished = String(formData.get("isPublished") ?? "1") === "1";
  if (!id || !title || !excerpt || !content) {
    return { ok: false, error: "Titre, resume et contenu sont obligatoires." };
  }

  try {
    const slug = await updateBlogPostInDb({ id, title, excerpt, content, coverImage, isPublished });
    revalidatePublicAndAdmin();
    revalidateBlogSlug(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre a jour l article. Reessayez." };
  }
}

export async function deleteBlogPost(id: number): Promise<BlogPostResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Session expiree. Reconnectez-vous au backoffice." };
  }
  if (!id) {
    return { ok: false, error: "Article introuvable." };
  }

  try {
    const rows = (await prisma.$queryRawUnsafe<{ slug: string }[]>(
      "SELECT slug FROM BlogPost WHERE id = ? LIMIT 1",
      id,
    )) as { slug: string }[];
    const slug = rows?.[0]?.slug;
    await deleteBlogPostInDb(id);
    revalidatePublicAndAdmin();
    revalidateBlogSlug(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer l article." };
  }
}
