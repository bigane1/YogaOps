import Stripe from "stripe";
import { BookingStatus, SubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { createZoomMeeting } from "@/lib/zoom";
import { sendBookingConfirmationEmail } from "@/lib/mail";

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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    const subscriptionId = session.metadata?.subscriptionId;

    if (bookingId) {
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { slot: { include: { course: true } } },
        });
        if (!booking) return;
        if (booking.status === BookingStatus.confirmed) return;

        let zoomLink = booking.zoomLink;
        if (booking.slot.course.location === "en_ligne") {
          const isCollective = booking.slot.course.type === "collectif";

          if (isCollective) {
            const slotWithLink = await tx.timeSlot.findUnique({
              where: { id: booking.slotId },
              select: { zoomLink: true },
            });

            if (slotWithLink?.zoomLink) {
              zoomLink = slotWithLink.zoomLink;
            } else {
              zoomLink =
                (await createZoomMeeting({
                  topic: `YogaOps - ${booking.slot.course.title}`,
                  startTime: booking.slot.startsAt,
                  durationMin: booking.slot.course.durationMin,
                })) ?? "Lien Zoom a renseigner dans le backoffice.";

              await tx.timeSlot.update({
                where: { id: booking.slotId },
                data: { zoomLink },
              });
            }
          } else {
            zoomLink =
              (await createZoomMeeting({
                topic: `YogaOps - ${booking.slot.course.title}`,
                startTime: booking.slot.startsAt,
                durationMin: booking.slot.course.durationMin,
              })) ?? "Lien Zoom a renseigner dans le backoffice.";
          }
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.confirmed, zoomLink },
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
      await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({
          where: { id: subscriptionId },
        });
        if (!sub) return;
        if (sub.status === SubscriptionStatus.active) return;

        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.active },
        });
      });
    }
  }

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

  return new Response("ok", { status: 200 });
}
