import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getLandingContent, withImageCacheBust } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Yoga en entreprise pour equipes tech | YogaOps",
  description:
    "Des seances pensees pour les equipes du digital et de la tech afin de reduire la charge mentale et ramener du calme.",
  openGraph: {
    title: "Yoga en entreprise pour equipes tech | YogaOps",
    description:
      "Reduire le stress, retrouver du focus et renforcer la cohesion d equipe.",
    type: "website",
    url: "/entreprises",
  },
};

const benefits = [
  "Reduire le stress et la charge mentale",
  "Retrouver du focus et de la clarte mentale",
  "Ameliorer la concentration au quotidien",
  "Ramener du calme dans les environnements intenses",
  "Diminuer les tensions liees au travail sur ecran",
  "Renforcer la cohesion d equipe",
];

export default async function EntreprisesPage() {
  const landing = await getLandingContent();
  const enterpriseImageSrc = withImageCacheBust(
    landing.chairYogaImageUrl,
    landing.updatedAt ?? "",
  );

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Yoga en entreprise",
    provider: { "@type": "Organization", name: "YogaOps" },
    areaServed: "France",
    description: landing.chairYogaText,
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />

        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="section-title">Yoga en entreprise</h1>
            <p className="section-subtitle mt-4">
              Des seances pensees pour les equipes du digital et de la tech afin de reduire la
              charge mentale et ramener du calme dans des environnements de travail exigeants.
            </p>
            <Link href="/#contact-form" className="brand-btn mt-8 inline-flex rounded-lg px-5 py-2.5">
              Demander un devis
            </Link>
          </div>
          <div className="hero-banner aspect-[4/3]">
            {enterpriseImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enterpriseImageSrc}
                alt="Yoga en entreprise pour equipes tech"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
        </section>

        <section className="section-block">
          <h2 className="font-display text-xl font-medium">Benefices</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {benefits.map((item) => (
              <li
                key={item}
                className="brand-card-soft rounded-xl px-4 py-3 text-sm text-[var(--muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-[var(--muted)] leading-relaxed">
            Format flexible selon vos besoins : en ligne ou sur site, avec une approche adaptee aux
            contraintes des environnements tech et digitaux.
          </p>
          <Link
            href="/#contact-form"
            className="brand-btn mt-8 inline-flex rounded-lg px-5 py-2.5"
          >
            Demander un devis
          </Link>
        </section>
      </main>
    </div>
  );
}
