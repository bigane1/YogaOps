import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout } from "@/app/actions";
import { ensureSeedData, addDays, startOfDay } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";

export default async function AdminPage() {
  await ensureSeedData();
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";

  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Backoffice prof
          </h1>
          <p className="mt-2 opacity-90">
            Entrez le code admin pour gerer cours, creneaux et abonnements.
          </p>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input
              name="pin"
              type="password"
              required
              placeholder="Code admin"
              className={fieldMd + " w-full"}
            />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const [coursesCount, slotsCount, bookingsPendingCount, subscriptionsActiveCount] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.timeSlot.count({ where: { startsAt: { gte: today, lt: weekEnd } } }),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Backoffice prof
        </h1>
        <p className="mt-2 opacity-90">Gestion complete des cours YogaOps.</p>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button
            type="submit"
            className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm"
          >
            Deconnexion
          </button>
        </form>

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
              <p className="text-xs opacity-70">Abonnes actifs</p>
              <p className="mt-1 text-2xl font-semibold">{subscriptionsActiveCount}</p>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Utilisez le menu ci-dessus pour gerer separement le planning, les reservations, les
            cours/creneaux et les abonnes.
          </p>
        </section>
      </main>
    </div>
  );
}
