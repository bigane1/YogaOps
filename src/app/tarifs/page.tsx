export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { buySubscriptionStripe } from "@/app/actions";

export const metadata: Metadata = {
  title: "Tarifs yoga femmes et entreprise | YogaOps",
  description:
    "Decouvrez les prix des seances de yoga individuelles, collectives, en ligne, sur place et les abonnements.",
};

export default async function TarifsPage() {
  await ensureSeedData();
  const [allCourses, packages] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.packagePlan.findMany({
      where: { isActive: true },
      include: { fixedCourse: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const courses = allCourses.filter((c) => !c.isWorkshop);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Tarifs
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Liste des prix a la seance et abonnements.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Cours a la seance
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm opacity-80">{course.description}</p>
                <p className="mt-2 text-sm opacity-80">
                  Type de cours: {course.location === "en_ligne" ? "En ligne" : "Presentiel"}
                </p>
                <p className="mt-3 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                  {course.priceEur} EUR
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Abonnements
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Sans engagement · résiliable 1 mois avant le renouvellement · prelevement automatique
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((item) => (
              <article key={item.id} className="brand-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.billingIntervalMonths && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Récurrent
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm opacity-80">{item.description}</p>

                {item.fixedCourse ? (
                  <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                    📅 Cours fixe : {item.fixedCourse.title}
                    <span className="ml-1 font-normal opacity-80">
                      — 1 créneau par semaine, automatiquement réservé
                    </span>
                  </p>
                ) : (
                  <p className="mt-3 text-sm opacity-90">
                    {item.sessionCount} séance{item.sessionCount > 1 ? "s" : ""} / semaine
                  </p>
                )}

                {item.billingIntervalMonths ? (
                  <p className="mt-1 text-sm opacity-80">
                    Durée {item.billingIntervalMonths} mois · renouvellement automatique · sans engagement
                  </p>
                ) : (
                  <p className="mt-1 text-sm opacity-80">Validité {item.validityDays} jours</p>
                )}
                {!item.fixedCourse && (
                  <p className="mt-1 text-sm opacity-80">
                    Type de cours :{" "}
                    {item.allowedCourseType === "individuel"
                      ? "Individuel"
                      : item.allowedCourseType === "collectif"
                        ? "Collectif"
                        : "Individuel + Collectif"}
                  </p>
                )}
                {item.billingIntervalMonths ? (
                  <div className="mt-3">
                    <p className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                      {Math.round(item.priceEur / item.billingIntervalMonths)} EUR
                      <span className="text-base font-medium opacity-70"> / mois</span>
                    </p>
                    <p className="mt-0.5 text-xs opacity-60">
                      soit {item.priceEur} EUR prélevés tous les {item.billingIntervalMonths} mois
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                    {item.priceEur} EUR
                  </p>
                )}

                <form action={buySubscriptionStripe} className="mt-4 grid gap-2">
                  <input type="hidden" name="packageId" value={item.id} />
                  <input
                    name="customerName"
                    required
                    placeholder="Votre nom"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <input
                    name="customerEmail"
                    type="email"
                    required
                    placeholder="Votre email"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="brand-btn brand-btn-sm rounded-lg px-4 py-2"
                  >
                    {item.billingIntervalMonths ? "S'abonner via Stripe" : "Acheter via Stripe"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
              Ateliers thématiques
            </h2>
            <Link
              href="/ateliers"
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: "var(--brand)" }}
            >
              Voir tous les ateliers →
            </Link>
          </div>
          <p className="mt-1 text-sm opacity-80">
            Événements ponctuels sur un thème précis · Places limitées · Inscription en ligne
          </p>
          <div className="brand-card mt-4 rounded-xl p-5">
            <p className="opacity-80 text-sm">
              Yoga Nidra, gestion du stress, respiration, souplesse… Retrouvez tous nos prochains
              ateliers sur la page dédiée.
            </p>
            <Link
              href="/ateliers"
              className="brand-btn brand-btn-sm mt-4 inline-block rounded-lg px-4 py-2"
            >
              Voir les ateliers disponibles
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
