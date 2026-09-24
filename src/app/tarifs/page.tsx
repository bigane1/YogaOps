export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ensureSeedData } from "@/lib/db";
import { eligibilityLabel } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tarifs yoga | YogaOps",
  description:
    "Prix des séances à l'unité et cartes de crédits YogaOps (collectif et individuel).",
};

export default async function TarifsPage() {
  await ensureSeedData();
  const [allCourses, packs] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: [{ creditCount: "asc" }, { priceEur: "asc" }],
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
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Séance à l&apos;unité ou carte de crédits (1 crédit = 1 séance, valable 1 an).
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Séance à l&apos;unité
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{course.description}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {course.type === "individuel" ? "Individuel" : "Collectif"} ·{" "}
                  {course.location === "en_ligne" ? "En ligne" : "Présentiel"}
                </p>
                <p className="mt-3 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                  {course.priceEur} €
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Cartes de crédits
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Paiement unique par carte bancaire. Connectez-vous pour acheter.
          </p>
          {packs.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Aucune carte disponible pour le moment.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack) => (
                <article key={pack.id} className="brand-card rounded-xl p-5">
                  <h3 className="font-medium">{pack.name}</h3>
                  {pack.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{pack.description}</p>
                  ) : null}
                  <p className="mt-3 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                    {pack.priceEur} €
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {pack.creditCount} crédit{pack.creditCount > 1 ? "s" : ""} ·{" "}
                    {eligibilityLabel(pack.eligibility)} · {pack.validityDays} jours
                  </p>
                </article>
              ))}
            </div>
          )}
          <Link
            href="/compte/cartes"
            className="brand-btn mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm"
          >
            Acheter une carte
          </Link>
        </section>

        <p className="mt-10 text-sm text-[var(--muted)]">
          Pour réserver une séance :{" "}
          <Link href="/reserver" className="underline underline-offset-2">
            page Réserver
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
