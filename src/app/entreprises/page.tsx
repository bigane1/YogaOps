export const dynamic = "force-dynamic";

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
    description: landing.entreprisesHeroText,
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
            <h1 className="section-title">{landing.entreprisesHeroTitle}</h1>
            <p className="section-subtitle mt-4">{landing.entreprisesHeroText}</p>
            <Link href="/#contact-form" className="brand-btn mt-8 inline-flex rounded-lg px-5 py-2.5">
              {landing.entreprisesCtaLabel}
            </Link>
          </div>
          <div className="hero-banner aspect-[4/3] min-h-[16rem] w-full">
            {enterpriseImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={enterpriseImageSrc}
                src={enterpriseImageSrc}
                alt="Yoga en entreprise pour equipes tech"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
                Image modifiable dans le backoffice (bloc « Page Entreprises »).
              </div>
            )}
          </div>
        </section>

        <section className="section-block">
          <h2 className="font-display text-xl font-medium">{landing.entreprisesWhyTitle}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {landing.entreprisesWhyItems.map((item) => (
              <li
                key={item}
                className="brand-card-soft rounded-xl px-4 py-3 text-sm text-[var(--muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="section-block">
          <h2 className="font-display text-xl font-medium">{landing.entreprisesHowTitle}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {landing.entreprisesHowItems.map((item) => (
              <li
                key={item}
                className="brand-card-soft rounded-xl px-4 py-3 text-sm text-[var(--muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/#contact-form"
            className="brand-btn mt-8 inline-flex rounded-lg px-5 py-2.5"
          >
            {landing.entreprisesCtaLabel}
          </Link>
        </section>
      </main>
    </div>
  );
}
