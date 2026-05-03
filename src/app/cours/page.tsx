import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Users, Wifi, MapPin, Star } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Nos cours de yoga - YogaOps",
  description:
    "Découvrez tous nos cours de yoga pour femmes : yoga bien-être, yoga dos, yoga en ligne et sur place. Bienfaits détaillés, tarifs et réservation en ligne.",
  openGraph: {
    title: "Nos cours de yoga - YogaOps",
    description:
      "Cours de yoga pour femmes : bienfaits, formats et réservation en ligne. En ligne ou en présentiel, individuel ou collectif.",
  },
};

function parseBenefits(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default async function CoursPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true, isWorkshop: false },
    orderBy: { createdAt: "asc" },
  });

  const individual = courses.filter((c) => c.type === "individuel");
  const collective = courses.filter((c) => c.type === "collectif");

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">

        {/* Hero */}
        <section className="brand-card rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "var(--brand)" }}>
            Nos cours de yoga
          </h1>
          <p className="mx-auto mt-3 max-w-2xl opacity-90">
            Des séances pensées pour les femmes actives : réduire le stress, soulager le dos et retrouver de l&apos;énergie.
            En ligne ou sur place, en solo ou en groupe.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/reserver" className="brand-btn rounded-lg px-5 py-2.5">
              Réserver une séance
            </Link>
            <Link href="/tarifs" className="brand-btn-secondary rounded-lg px-5 py-2.5">
              Voir les tarifs & abonnements
            </Link>
          </div>
        </section>

        {/* Cours collectifs */}
        {collective.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold" style={{ color: "var(--brand)" }}>
              <Users className="h-6 w-6" />
              Cours collectifs
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {collective.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Cours individuels */}
        {individual.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold" style={{ color: "var(--brand)" }}>
              <Star className="h-6 w-6" />
              Cours individuels (suivi personnalisé)
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {individual.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className="brand-card rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--brand)" }}>
            Prête à commencer ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90">
            Première séance offerte, sans engagement. Choisissez votre créneau et réservez en quelques clics.
          </p>
          <Link href="/reserver" className="brand-btn mt-5 inline-block rounded-lg px-5 py-2.5">
            Voir les créneaux disponibles
          </Link>
        </section>

      </main>
    </div>
  );
}

function CourseCard({ course }: { course: { title: string; description: string; benefits: string; coverImage: string; location: string; durationMin: number; priceEur: number; capacity: number } }) {
  const benefits = parseBenefits(course.benefits);

  return (
    <article className="brand-card flex flex-col overflow-hidden rounded-2xl">
      {course.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold">{course.title}</h3>
        <p className="mt-2 text-sm opacity-80">{course.description}</p>

        {/* Méta */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs opacity-70">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.durationMin} min
          </span>
          <span className="flex items-center gap-1">
            {course.location === "en_ligne" ? (
              <><Wifi className="h-3.5 w-3.5" /> En ligne</>
            ) : (
              <><MapPin className="h-3.5 w-3.5" /> Présentiel</>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.capacity === 1 ? "Individuel" : `Jusqu'à ${course.capacity} personnes`}
          </span>
        </div>

        {/* Bienfaits */}
        {benefits.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-50">Bienfaits</p>
            <ul className="space-y-1.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span className="opacity-90">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prix + CTA */}
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-lg font-semibold" style={{ color: "var(--brand)" }}>
            {course.priceEur} €<span className="text-sm font-normal opacity-60"> / séance</span>
          </span>
          <Link href="/reserver" className="brand-btn brand-btn-sm rounded-lg px-4 py-2 text-sm">
            Réserver
          </Link>
        </div>
      </div>
    </article>
  );
}
