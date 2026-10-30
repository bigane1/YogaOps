export const dynamic = "force-dynamic";

import { AdminPageFrame, isAdminLoggedIn } from "@/components/admin-page-frame";
import { ensureSeedData, addDays, startOfDay } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await ensureSeedData();
  const isLogged = await isAdminLoggedIn();

  if (!isLogged) {
    return (
      <AdminPageFrame title="Backoffice prof">
        {null}
      </AdminPageFrame>
    );
  }

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const [coursesCount, slotsCount, bookingsPendingCount, membersCount] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.timeSlot.count({ where: { startsAt: { gte: today, lt: weekEnd } } }),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.member.count(),
  ]);

  return (
    <AdminPageFrame
      title="Backoffice prof"
      intro="Les pages du site se modifient une par une. L onglet Admin garde la gestion des cours, cartes et reservations."
    >
      <section className="brand-card mt-6 rounded-xl p-6">
        <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
          Tableau de bord
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
            <p className="text-xs opacity-70">Cours actifs</p>
            <p className="mt-1 text-2xl font-semibold">{coursesCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
            <p className="text-xs opacity-70">Creneaux (7 jours)</p>
            <p className="mt-1 text-2xl font-semibold">{slotsCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
            <p className="text-xs opacity-70">Reservations en attente</p>
            <p className="mt-1 text-2xl font-semibold">{bookingsPendingCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
            <p className="text-xs opacity-70">Membres inscrits</p>
            <p className="mt-1 text-2xl font-semibold">{membersCount}</p>
          </div>
        </div>
      </section>
    </AdminPageFrame>
  );
}
