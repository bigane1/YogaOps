import Stripe from "stripe";
import { BookingStatus, PaymentMethod, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { resolveOrCreateSharedZoomLink } from "@/lib/booking-zoom";
import { getStripeClient } from "@/lib/stripe";
import { sendBookingConfirmationEmail } from "@/lib/mail";
import { autoBookSubscriptionSlots, cancelFutureBookings } from "@/app/actions";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Webhook Stripe non configure", { status: 400 });
  }

  const stripe = getStripeClient();
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  // ── Checkout session completed ──────────────────────────────────────────────
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    const subscriptionId = session.metadata?.subscriptionId;

    if (bookingId) {
      // Paiement séance unique → confirmer la réservation
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { slot: { include: { course: true } } },
        });
        if (!booking) return;
        if (booking.status === BookingStatus.confirmed) return;

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
          data: { status: BookingStatus.confirmed, zoomLink: zoomLink ?? undefined },
        });
      });

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { slot: { include: { course: true } } },
      });

      if (updatedBooking) {
        await sendBookingConfirmationEmail({
          bookingId: updatedBooking.id,
          customerName: updatedBooking.customerName,
          customerEmail: updatedBooking.customerEmail,
          courseTitle: updatedBooking.slot.course.title,
          startsAt: updatedBooking.slot.startsAt,
          zoomLink: updatedBooking.zoomLink,
          priceEur: updatedBooking.slot.course.priceEur,
        });
      }
    } else if (subscriptionId) {
      // Paiement unique abonnement → activer puis auto-réserver les créneaux fixes
      let alreadyActive = false;
      await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({ where: { id: subscriptionId } });
        if (!sub) return;
        if (sub.status === SubscriptionStatus.active) { alreadyActive = true; return; }
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.active },
        });
      });
      if (!alreadyActive) {
        await autoBookSubscriptionSlots(subscriptionId);
      }
    } else if (session.mode === "subscription" && session.subscription) {
      // Abonnement récurrent Stripe Billing → créer la subscription en DB
      const stripeSubId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
      const packageId = session.metadata?.packageId ?? "";
      const customerEmail = (session.metadata?.customerEmail ?? "").toLowerCase();

      if (packageId && customerEmail) {
        const pkg = await prisma.packagePlan.findUnique({
          where: { id: packageId },
          select: { billingIntervalMonths: true },
        });
        const months = pkg?.billingIntervalMonths ?? 1;
        const startsAt = new Date();
        const endsAt = addMonths(startsAt, months);

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
        });

        const customerNameMeta = session.metadata?.customerName ?? "";
        let createdId: string | null = null;

        if (!existing) {
          const pkg = await prisma.packagePlan.findUnique({
            where: { id: packageId },
            select: { fixedCourseId: true },
          });
          const created = await prisma.subscription.create({
            data: {
              customerEmail,
              customerName: customerNameMeta,
              status: SubscriptionStatus.active,
              paymentMethod: PaymentMethod.stripe,
              packageId,
              startsAt,
              endsAt,
              stripeSubscriptionId: stripeSubId,
              stripeCustomerId,
              cancelAtPeriodEnd: false,
              fixedCourseId: pkg?.fixedCourseId ?? null,
            },
          });
          createdId = created.id;
        } else {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: stripeSubId },
            data: { status: SubscriptionStatus.active, endsAt, cancelAtPeriodEnd: false },
          });
          createdId = existing.id;
        }

        if (createdId) {
          await autoBookSubscriptionSlots(createdId);
        }
      }
    }
  }

  // ── Checkout session expiré / paiement échoué ───────────────────────────────
  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    const subscriptionId = session.metadata?.subscriptionId;

    if (bookingId) {
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.status !== BookingStatus.pending) return;

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.cancelled },
        });

        const slot = await tx.timeSlot.findUnique({ where: { id: booking.slotId } });
        if (!slot) return;

        await tx.timeSlot.update({
          where: { id: slot.id },
          data: { available: slot.available + 1, booked: Math.max(slot.booked - 1, 0) },
        });
      });
    } else if (subscriptionId) {
      await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({ where: { id: subscriptionId } });
        if (!sub) return;
        if (sub.status === SubscriptionStatus.cancelled) return;
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.cancelled },
        });
      });
    }
  }

  // ── Renouvellement Stripe Billing (invoice.payment_succeeded) ───────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    // Ignorer la première facture (déjà traitée par checkout.session.completed)
    if (invoice.billing_reason === "subscription_cycle") {
      // En Stripe v21, la subscription est dans invoice.parent.subscription_details
      const stripeSubId =
        invoice.parent?.type === "subscription_details"
          ? (invoice.parent.subscription_details?.subscription as string | undefined)
          : undefined;

      if (stripeSubId) {
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
          include: { package: true },
        });
        if (sub) {
          const months = sub.package.billingIntervalMonths ?? 1;
          const endsAt = addMonths(new Date(), months);
          await prisma.subscription.update({
            where: { stripeSubscriptionId: stripeSubId },
            data: { status: SubscriptionStatus.active, endsAt, cancelAtPeriodEnd: false },
          });
        }
      }
    }
  }

  // ── Mise à jour abonnement Stripe (résiliation programmée) ──────────────────
  if (event.type === "customer.subscription.updated") {
    const stripeSub = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSub.id },
      data: { cancelAtPeriodEnd: stripeSub.cancel_at_period_end },
    });
  }

  // ── Résiliation définitive Stripe → libérer les places futures ─────────────
  if (event.type === "customer.subscription.deleted") {
    const stripeSub = event.data.object as Stripe.Subscription;
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (sub) {
      await cancelFutureBookings(sub.id);
      await prisma.subscription.update({
        where: { stripeSubscriptionId: stripeSub.id },
        data: { status: SubscriptionStatus.cancelled, cancelAtPeriodEnd: false },
      });
    }
  }

  return new Response("ok", { status: 200 });
}
