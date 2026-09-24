import { BookingStatus } from "@/generated/prisma/enums";
import { activateCreditPackFromStripe } from "@/app/member-actions";
import { resolveOrCreateSharedZoomLink } from "@/lib/booking-zoom";
import { sendBookingConfirmationEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

/**
 * Active une session Checkout payée (retour success_url local sans webhook).
 * Idempotent : safe à rappeler si le webhook a déjà traité.
 */
export async function fulfillPaidCheckoutSession(sessionId: string): Promise<{
  ok: boolean;
  kind?: "credit_pack" | "booking";
  error?: string;
}> {
  if (!sessionId) return { ok: false, error: "session manquante" };

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { ok: false, error: "paiement non confirmé" };
    }

    const type = session.metadata?.type;
    const packId = session.metadata?.packId;
    const memberId = session.metadata?.memberId;
    const bookingId = session.metadata?.bookingId;

    if (type === "credit_pack" && packId && memberId) {
      await activateCreditPackFromStripe({
        packId,
        memberId,
        stripeSessionId: session.id,
      });
      return { ok: true, kind: "credit_pack" };
    }

    if (bookingId) {
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

      const updated = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { slot: { include: { course: true } } },
      });
      if (updated) {
        try {
          await sendBookingConfirmationEmail({
            bookingId: updated.id,
            customerName: updated.customerName,
            customerEmail: updated.customerEmail,
            courseTitle: updated.slot.course.title,
            startsAt: updated.slot.startsAt,
            zoomLink: updated.zoomLink,
            priceEur: updated.slot.course.priceEur,
          });
        } catch {
          // email optionnel
        }
      }
      return { ok: true, kind: "booking" };
    }

    return { ok: false, error: "session sans metadata connue" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "erreur Stripe";
    return { ok: false, error: message };
  }
}
