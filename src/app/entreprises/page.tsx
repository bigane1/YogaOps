import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Yoga en entreprise et yoga sur chaise | YogaOps",
  description:
    "Interventions yoga en entreprise: ateliers anti-stress, yoga sur chaise, prevention des douleurs de posture et bien-etre au travail.",
  openGraph: {
    title: "Yoga en entreprise et yoga sur chaise | YogaOps",
    description:
      "Offrez a vos equipes des seances de yoga sur chaise pour reduire le stress et soulager les tensions au bureau.",
    type: "website",
    url: "/entreprises",
  },
};

export default function EntreprisesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Yoga en entreprise",
    provider: {
      "@type": "Organization",
      name: "YogaOps",
    },
    areaServed: "Carrieres-sous-Poissy et alentours",
    description:
      "Seances de yoga sur chaise en entreprise pour reduire le stress, prevenir les douleurs de posture et ameliorer le bien-etre des equipes.",
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <section className="brand-card rounded-2xl p-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "var(--brand)" }}>
            Yoga en entreprise: bien-etre, concentration et prevention
          </h1>
          <p className="mt-3 max-w-3xl opacity-90">
            J accompagne vos equipes avec des seances de yoga sur chaise adaptees au contexte
            professionnel. Objectif: reduire le stress, detendre le dos et les epaules, et
            offrir un vrai temps de respiration dans la journee de travail.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#contact-form" className="brand-btn rounded-lg px-4 py-2">
              Demander un devis
            </Link>
            <Link href="/reserver" className="brand-btn-secondary rounded-lg px-4 py-2">
              Voir les disponibilites
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Format flexible</h2>
            <p className="mt-2 text-sm opacity-90">
              Sessions de 30 a 60 minutes, en presentiel dans vos locaux ou en visio.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Impact concret</h2>
            <p className="mt-2 text-sm opacity-90">
              Diminution du stress, relachement des tensions, meilleure energie mentale.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Accessible a tous</h2>
            <p className="mt-2 text-sm opacity-90">
              Pratique douce, inclusive, sans besoin de tenue sportive complexe.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
