import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  await ensureSeedData();
  const [coursesCount, packageCount, availableSlots] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.packagePlan.count({ where: { isActive: true } }),
    prisma.timeSlot.count({ where: { available: { gt: 0 } } }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="brand-card rounded-2xl p-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Reservation de cours de yoga
          </h1>
          <p className="mt-3 max-w-3xl opacity-90">
            YogaOps propose des cours individuels et collectifs, en ligne
            (Zoom) ou en presentiel. Les offres, horaires, tarifs et abonnements
            restent parametrables depuis le backoffice.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reserver"
              className="brand-btn rounded-lg px-4 py-2"
            >
              Voir les creneaux
            </Link>
            <Link href="/tarifs" className="brand-btn-secondary rounded-lg px-4 py-2">
              Voir les tarifs
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Types de cours</p>
            <p className="mt-1 text-2xl font-semibold">{coursesCount}</p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Abonnements</p>
            <p className="mt-1 text-2xl font-semibold">{packageCount}</p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Creneaux reservables</p>
            <p className="mt-1 text-2xl font-semibold">{availableSlots}</p>
          </article>
        </section>
      </main>
    </div>
  );
}
