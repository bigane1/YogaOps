import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Yoga pour femmes a Carrieres-sous-Poissy (78955) | YogaOps",
  description:
    "Seances de yoga pour femmes a Carrieres-sous-Poissy: en ligne, sur place, en petit groupe et en entreprise (yoga sur chaise). Premiere seance gratuite.",
  openGraph: {
    title: "Yoga pour femmes a Carrieres-sous-Poissy (78955) | YogaOps",
    description:
      "Soulager le stress, apaiser le dos et retrouver de l energie avec des seances de yoga adaptees aux femmes actives.",
    type: "website",
    url: "/yoga-femme-carrieres-sous-poissy",
  },
};

export default function YogaFemmesCarrieresSousPoissyPage() {
  const localSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "YogaOps",
    areaServed: "Carrieres-sous-Poissy 78955",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr"}/yoga-femme-carrieres-sous-poissy`,
    description:
      "Seances de yoga pour femmes a Carrieres-sous-Poissy: stress, mal de dos, bien-etre, yoga sur chaise en entreprise.",
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
        />

        <section className="brand-card rounded-2xl p-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "var(--brand)" }}>
            Yoga pour femmes a Carrieres-sous-Poissy (78955)
          </h1>
          <p className="mt-3 max-w-3xl opacity-90">
            Vous cherchez des seances de yoga a Carrieres-sous-Poissy pour reduire le stress,
            soulager les douleurs du dos et retrouver un vrai moment de bien-etre ? YogaOps
            propose des cours adaptes aux femmes actives, en ligne et sur place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/reserver" className="brand-btn rounded-lg px-4 py-2">
              Reserver ma seance
            </Link>
            <Link href="/tarifs" className="brand-btn-secondary rounded-lg px-4 py-2">
              Voir les tarifs
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Stress et charge mentale</h2>
            <p className="mt-2 text-sm opacity-90">
              Exercices de respiration, mobilite douce et relaxation pour mieux gerer la pression du quotidien.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Mal de dos et posture</h2>
            <p className="mt-2 text-sm opacity-90">
              Seances progressives pour relacher les tensions du dos, de la nuque et des epaules.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Entreprise et yoga sur chaise</h2>
            <p className="mt-2 text-sm opacity-90">
              Interventions en entreprise a Carrieres-sous-Poissy et alentours pour prevenir la fatigue au bureau.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5 md:col-span-3">
            <h2 className="text-lg font-semibold">Specialisation stress metiers IT</h2>
            <p className="mt-2 text-sm opacity-90">
              Avec une experience en recrutement IT, je connais bien la pression de ce secteur,
              notamment pour les femmes. Les seances sont pensees pour aider a sortir du stress,
              respirer, retrouver de la clarte et mieux affronter les difficultes du quotidien
              professionnel, tout en restant ouvertes a toutes les femmes, quel que soit leur metier.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
