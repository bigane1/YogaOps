export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { sendContactMessage } from "@/app/actions";
import { ContactFormStartedAt } from "@/components/contact-form-started-at";
import { SiteNav } from "@/components/site-nav";
import {
  OfferCard,
  SectionLabel,
  MetaPill,
  excerptParagraphs,
} from "@/components/site-ui";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ScrollStagger } from "@/components/scroll-stagger";
import { ensureSeedData } from "@/lib/db";
import {
  getLandingContent,
  resolveHeroBannerImageUrl,
  withImageCacheBust,
} from "@/lib/landing-content";

type Props = {
  searchParams: Promise<{ contact?: string }>;
};

export const metadata: Metadata = {
  title: "Yoga doux pour les femmes actives | YogaOps",
  description:
    "Des seances en ligne pour apaiser le mental, relacher les tensions et retrouver l equilibre entre corps et esprit.",
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const contactStatus = params.contact;
  await ensureSeedData();
  const landing = await getLandingContent();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "YogaOps",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr",
    image: [landing.heroImage1Url],
    telephone: landing.footerPhone,
    email: landing.footerEmail.replace(/^Email:\s*/i, ""),
    address: landing.footerAddress.replace(/^Adresse:\s*/i, ""),
    description: landing.heroIntro,
    sameAs: [landing.facebookUrl, landing.instagramUrl, landing.linkedinUrl],
  };

  const bioExcerpt = excerptParagraphs(landing.teacherBioText, 4);
  const contactEmail = landing.footerEmail.replace(/^Email:\s*/i, "");
  const heroBannerImageUrl = resolveHeroBannerImageUrl(
    landing.heroImage1Url,
    landing.heroImage2Url,
  );
  const heroBannerSrc = withImageCacheBust(heroBannerImageUrl, landing.updatedAt ?? "");
  const enterpriseOfferSrc = withImageCacheBust(
    landing.chairYogaImageUrl,
    landing.updatedAt ?? "",
  );

  return (
    <div className="page-shell">
      <SiteNav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />

        {/* HERO */}
        <section id="accueil" className="section-block min-h-[85vh] flex items-center">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="grid w-full items-center gap-10 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <SectionLabel>YogaOps</SectionLabel>
                <h1 className="section-title mt-3">{landing.heroTitle}</h1>
                <p className="font-display mt-4 text-xl font-medium leading-snug text-[var(--foreground)] md:text-2xl">
                  {landing.heroSubtitle}
                </p>
                <p className="section-subtitle mt-4">{landing.heroIntro}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/reserver" className="brand-btn inline-flex rounded-lg px-5 py-2.5">
                    Reserver une seance decouverte
                  </Link>
                  {landing.firstSessionOffer ? (
                    <span className="text-sm font-medium text-[var(--terracotta)]">
                      {landing.firstSessionOffer}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="hero-banner aspect-[4/5] md:aspect-[3/4]">
                  {heroBannerSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={heroBannerSrc}
                      src={heroBannerSrc}
                      alt="Femme active en posture de yoga douce"
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* POURQUOI YOGAOPS */}
        <section id="pourquoi" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-3xl px-5 md:px-8">
            <SectionLabel>Pourquoi YogaOps</SectionLabel>
            <h2 className="section-title mt-3">{landing.whyTitle}</h2>
            <div className="mt-6 space-y-4 text-[var(--muted)] leading-relaxed">
              {landing.whyParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* BENEFICES */}
        <section id="benefices" className="section-block bg-[var(--beige)]">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <SectionLabel>Benefices</SectionLabel>
            <h2 className="section-title mt-3">{landing.practicalInfoTitle}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {landing.practicalInfoItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-[var(--border-soft)] bg-white/60 px-4 py-3 text-sm text-[var(--foreground)]"
                >
                  <span className="mt-0.5 text-[var(--terracotta)]" aria-hidden="true">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </section>

        {/* OFFRE / FORMAT */}
        <section id="formats" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-3xl px-5 text-center md:px-8">
            <SectionLabel>Offre / Format</SectionLabel>
            <h2 className="section-title mt-3">{landing.formatTitle}</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {landing.formatItems.map((format) => (
                <MetaPill key={format}>{format}</MetaPill>
              ))}
            </div>
            <p className="section-subtitle mx-auto mt-6">{landing.formatText}</p>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className="section-block bg-[var(--sage)]/30">
          <ScrollReveal className="mx-auto w-full max-w-3xl px-5 text-center md:px-8">
            <h2 className="font-display text-2xl font-medium md:text-3xl">{landing.finalCtaTitle}</h2>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link href="/reserver" className="brand-btn inline-flex rounded-lg px-6 py-3">
                {landing.finalCtaButtonLabel}
              </Link>
              <p className="text-sm text-[var(--muted)]">{landing.finalCtaText}</p>
            </div>
          </ScrollReveal>
        </section>

        {/* A PROPOS */}
        <section id="apropos" className="section-block bg-[var(--beige)]">
          <ScrollReveal className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 md:grid-cols-2 md:px-8">
            <div className="hero-banner aspect-square max-h-[28rem]">
              {(landing.teacherPhotoUrl || landing.heroImage2Url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={landing.teacherPhotoUrl || landing.heroImage2Url}
                  alt="Basma, fondatrice de YogaOps"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div>
              <SectionLabel>A propos</SectionLabel>
              <h2 className="section-title mt-3">{landing.teacherBioTitle}</h2>
              <div className="mt-5 space-y-4 text-[var(--muted)] leading-relaxed">
                {bioExcerpt.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* OFFRES */}
        <section id="offres" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Offres</SectionLabel>
              <h2 className="section-title mt-3">Les pratiques YogaOps</h2>
              <p className="section-subtitle mx-auto mt-3">
                Chaque seance est pensee pour s adapter a votre rythme, sans pression ni performance.
              </p>
            </div>
            <ScrollStagger className="mt-10 grid gap-6 md:grid-cols-2" staggerMs={120}>
              <OfferCard
                wide
                label="Cours collectifs en ligne"
                title="Yoga collectif en ligne"
                description="40 minutes pour respirer, bouger en douceur et relacher les tensions du quotidien."
                imageUrl={landing.collectiveOfferImageUrl}
                imageAlt="Cours de yoga collectif en ligne depuis chez soi"
                meta={["40 min", "Mardi & vendredi midi", "En ligne", "5 pers. max", "1ere seance offerte"]}
                href="/reserver"
                cta="Reserver"
                variant="primary"
              />
              <OfferCard
                label="Yoga individuel"
                title="Accompagnement individuel"
                description="Un espace personnalise pour ralentir, relacher les tensions et retrouver de la clarte mentale."
                imageUrl={landing.individualOfferImageUrl}
                imageAlt="Cours de yoga individuel en ligne avec la professeure"
                meta={["1h", "En ligne", "Sur rendez-vous"]}
                href="/reserver"
                cta="Decouvrir"
              />
              <OfferCard
                label="Yoga en entreprise"
                title="Yoga en entreprise"
                description={landing.chairYogaText}
                imageUrl={enterpriseOfferSrc}
                imageAlt="Yoga en entreprise pour equipes au bureau"
                meta={["Equipes digital & bureau", "En ligne ou sur site"]}
                href="/entreprises"
                cta="En savoir plus"
              />
              <OfferCard
                wide
                label="Ateliers YogaOps"
                title="Ateliers thematiques"
                description="Des seances autour du stress, de la charge mentale et des transitions professionnelles."
                meta={["Thematiques", "Inscription en ligne"]}
                href="/ateliers"
                cta="Voir les ateliers"
              />
            </ScrollStagger>
          </ScrollReveal>
        </section>

        {/* TEMOIGNAGES */}
        <section id="temoignages" className="section-block bg-[var(--beige)]">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Temoignages</SectionLabel>
              <h2 className="section-title mt-3">{landing.socialProofTitle}</h2>
            </div>
            <ScrollStagger className="mt-10 grid gap-5 md:grid-cols-3" staggerMs={100}>
              {landing.socialProofItems.map((item) => (
                <blockquote key={item} className="quote-block text-sm leading-relaxed">
                  &ldquo;{item}&rdquo;
                </blockquote>
              ))}
            </ScrollStagger>
          </ScrollReveal>
        </section>

        {/* COMMUNAUTE + CONTACT */}
        <section id="contact" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Communaute</SectionLabel>
              <h2 className="section-title mt-3">L univers YogaOps</h2>
              <p className="section-subtitle mx-auto mt-3">
                Instagram, LinkedIn, Facebook — suivez le quotidien de YogaOps.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={landing.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="brand-btn-secondary rounded-lg px-5 py-2.5"
              >
                Instagram
              </a>
              <a
                href={landing.linkedinUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="brand-btn-secondary rounded-lg px-5 py-2.5"
              >
                LinkedIn
              </a>
              <a
                href={landing.facebookUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="brand-btn-secondary rounded-lg px-5 py-2.5"
              >
                Facebook
              </a>
            </div>

            <div
              id="contact-form"
              className="mt-16 grid gap-8 md:grid-cols-2 md:items-start"
            >
              <div className="space-y-4">
                <h3 className="font-display text-lg font-medium">Contact</h3>
                <p className="text-sm text-[var(--muted)]">{landing.footerAddress}</p>
                <p className="text-sm text-[var(--muted)]">{landing.footerPhone}</p>
                <p className="text-sm">
                  <a href={`mailto:${contactEmail}`} className="underline decoration-[var(--brand)]">
                    {contactEmail}
                  </a>
                </p>
                <p className="text-sm text-[var(--muted)]">Sur rendez-vous</p>
              </div>

              <div className="brand-card rounded-2xl p-6">
                <h3 className="font-display text-lg font-medium">Une question ?</h3>
                {contactStatus === "ok" ? (
                  <p className="brand-alert mt-4 rounded-lg p-3 text-sm">
                    Merci, votre message a bien ete envoye.
                  </p>
                ) : null}
                {contactStatus === "error" ? (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Merci de remplir tous les champs.
                  </p>
                ) : null}
                <form action={sendContactMessage} className="mt-4 grid gap-3">
                  <ContactFormStartedAt />
                  <div className="hidden" aria-hidden="true">
                    <input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      className="brand-field px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    name="fullName"
                    required
                    placeholder="Votre nom"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Votre email"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Votre message"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
                    Envoyer
                  </button>
                </form>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
}
