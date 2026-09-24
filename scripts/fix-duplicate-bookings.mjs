import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma/dev.local.db")}`;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

async function main() {
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ["pending", "confirmed"] } },
    include: {
      slot: { include: { course: true } },
      member: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    "bookings",
    bookings.map((b) => ({
      id: b.id,
      memberId: b.memberId,
      email: b.customerEmail,
      status: b.status,
      payment: b.paymentMethod,
      creditCardId: b.memberCreditCardId,
      slotId: b.slotId,
      title: b.slot.course.title,
      at: b.slot.startsAt.toISOString(),
      created: b.createdAt.toISOString(),
    })),
  );

  // Deduplicate: same memberId+slotId keep oldest, cancel others + refund credit if needed
  const seen = new Map<string, string>();
  for (const b of bookings) {
    if (!b.memberId) continue;
    const key = `${b.memberId}::${b.slotId}`;
    const keepId = seen.get(key);
    if (!keepId) {
      seen.set(key, b.id);
      continue;
    }

    console.log("cancelling duplicate", b.id, "keeping", keepId);
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: b.id },
        data: { status: "cancelled" },
      });
      const slot = await tx.timeSlot.findUnique({ where: { id: b.slotId } });
      if (slot) {
        await tx.timeSlot.update({
          where: { id: slot.id },
          data: {
            available: slot.available + 1,
            booked: Math.max(slot.booked - 1, 0),
          },
        });
      }
      // Bugfix: restore the credit that was wrongly deducted for the duplicate
      if (b.memberCreditCardId) {
        const card = await tx.memberCreditCard.findUnique({
          where: { id: b.memberCreditCardId },
        });
        if (card) {
          await tx.memberCreditCard.update({
            where: { id: card.id },
            data: {
              remainingCredits: card.remainingCredits + 1,
              status: "active",
            },
          });
        }
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
