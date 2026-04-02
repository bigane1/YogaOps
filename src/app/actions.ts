"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { CourseType, LocationType, PaymentMethod, SubscriptionStatus } from "@/generated/prisma/enums";
import { sendBookingConfirmationEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { startOfWeekMonday } from "@/lib/db";
import { getBaseUrl, getStripeClient } from "@/lib/stripe";
import { createZoomMeeting } from "@/lib/zoom";

const ADMIN_COOKIE = "yogaops_admin";

function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function isAdmin(): Promise<boolean> {
  return (await cookies()).get(ADMIN_COOKIE)?.value === "1";
}

function revalidatePublicAndAdmin() {
  revalidatePath("/admin");
  revalidatePath("/reserver");
  revalidatePath("/tarifs");
  revalidatePath("/");
}

export async function reserveSlot(formData: FormData) {
  const slotId = String(formData.get("slotId") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
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
          customerEmail,
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
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();

  if (!packageId || !customerEmail || !customerName) return redirect("/tarifs");

  const pkg = await prisma.packagePlan.findUnique({
    where: { id: packageId },
    select: { id: true, name: true, priceEur: true, validityDays: true, sessionCount: true },
  });
  if (!pkg || !pkg.id) return redirect("/tarifs");

  const endsAt = new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      customerEmail,
      status: SubscriptionStatus.pending,
      paymentMethod: PaymentMethod.stripe,
      packageId: pkg.id,
      endsAt,
    },
  });

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();

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

export async function adminLogin(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const expected = process.env.ADMIN_BACKOFFICE_PIN ?? "1234";
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

  await prisma.course.create({
    data: {
      title: String(formData.get("title") ?? "Nouveau cours"),
      description: String(formData.get("description") ?? ""),
      type: type === "individuel" ? CourseType.individuel : CourseType.collectif,
      location: location === "presentiel" ? LocationType.presentiel : LocationType.en_ligne,
      priceEur,
      durationMin,
      capacity,
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

  await prisma.packagePlan.create({
    data: {
      name: String(formData.get("name") ?? "Nouvel abonnement"),
      description: String(formData.get("description") ?? ""),
      priceEur: toNumber(formData.get("priceEur"), 79),
      sessionCount: toNumber(formData.get("sessionCount"), 6),
      validityDays: toNumber(formData.get("validityDays"), 30),
      allowedCourseType,
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
      startsAt: new Date(startsAt),
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

  await prisma.course.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      type: type === "individuel" ? CourseType.individuel : CourseType.collectif,
      location: location === "presentiel" ? LocationType.presentiel : LocationType.en_ligne,
      durationMin: toNumber(formData.get("durationMin"), 60),
      priceEur: toNumber(formData.get("priceEur"), 15),
      capacity: toNumber(formData.get("capacity"), 10),
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

  await prisma.packagePlan.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      priceEur: toNumber(formData.get("priceEur"), 79),
      sessionCount: toNumber(formData.get("sessionCount"), 6),
      validityDays: toNumber(formData.get("validityDays"), 30),
      allowedCourseType,
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

  await prisma.timeSlot.update({
    where: { id },
    data: {
      startsAt: startsAt ? new Date(startsAt) : undefined,
      available: Math.max(available, 0),
      booked: Math.max(booked, 0),
    },
  });
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
      let zoomLink = booking.zoomLink;
      if (booking.slot.course.location === "en_ligne" && !zoomLink) {
        zoomLink =
          (await createZoomMeeting({
            topic: `YogaOps - ${booking.slot.course.title}`,
            startTime: booking.slot.startsAt,
            durationMin: booking.slot.course.durationMin,
          })) ?? "Lien Zoom a renseigner dans le backoffice.";
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed", zoomLink },
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

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: targetStatus as SubscriptionStatus },
  });

  revalidatePath("/admin/abonnements");
  revalidatePath("/abonnement");
}
