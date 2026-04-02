import { BookingStatus } from "@/generated/prisma/enums";
import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace";
import { createZoomMeeting } from "@/lib/zoom";

const FALLBACK_ZOOM = "Lien Zoom a renseigner dans le backoffice.";

/**
 * Un seul lien Zoom partagé par créneau : slot.zoomLink, ou copie d'une résa déjà confirmée,
 * sinon création API + enregistrement sur le créneau.
 */
export async function resolveOrCreateSharedZoomLink(
  tx: TransactionClient,
  args: {
    bookingId: string;
    slotId: string;
    courseTitle: string;
    slotStartsAt: Date;
    durationMin: number;
    location: "en_ligne" | "presentiel";
    bookingZoomLink: string | null | undefined;
  }
): Promise<string | null> {
  if (args.location !== "en_ligne") {
    return args.bookingZoomLink?.trim() || null;
  }

  const existing = args.bookingZoomLink?.trim();
  if (existing) return existing;

  const slot = await tx.timeSlot.findUnique({
    where: { id: args.slotId },
    select: { zoomLink: true },
  });
  const fromSlot = slot?.zoomLink?.trim();
  if (fromSlot) return fromSlot;

  const peer = await tx.booking.findFirst({
    where: {
      slotId: args.slotId,
      status: BookingStatus.confirmed,
      NOT: { id: args.bookingId },
      zoomLink: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: { zoomLink: true },
  });
  const fromPeer = peer?.zoomLink?.trim();
  if (fromPeer) {
    await tx.timeSlot.update({
      where: { id: args.slotId },
      data: { zoomLink: fromPeer },
    });
    return fromPeer;
  }

  const created =
    (await createZoomMeeting({
      topic: `YogaOps - ${args.courseTitle}`,
      startTime: args.slotStartsAt,
      durationMin: args.durationMin,
    })) ?? FALLBACK_ZOOM;

  await tx.timeSlot.update({
    where: { id: args.slotId },
    data: { zoomLink: created },
  });

  return created;
}
