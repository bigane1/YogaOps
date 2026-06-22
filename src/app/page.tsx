export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { sendContactMessage } from "@/app/actions";
import { ContactFormStartedAt } from "@/components/contact-form-started-at";
import { SiteNav } from "@/components/site-nav";
import {
  OfferCard,
  SectionLabel,
  excerptParagraphs,
} from "@/components/site-ui";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ScrollStagger } from "@/components/scroll-stagger";
import { ensureSeedData } from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";

type Props = {
  searchParams: Promise<{ contact?: string }>;
};

export const metadata: Metadata = {
  title: "Yoga doux pour femmes actives du digital | YogaOps",
  description:
    "Des cours simples et accessibles pour ralentir, relacher la charge mentale et retrouver un espace pour respirer.",
};

const heroBullets = [
  { key: "fatigueMessage", label: "sortir du mode automatique" },
  { key: "specializationMessage", label: "bouger en douceur" },
  { key: "enterpriseMessage", label: "deconnecter des ecrans" },
  { key: "outdoorMessage", label: "retrouver du calme et de la clarte mentale" },
] as const;

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

  const bulletLabels = heroBullets.map((item) => landing[item.key] || item.label);
  const bioExcerpt = excerptParagraphs(landing.teacherBioText, 3);
  const [featuredQuote, ...otherQuotes] = landing.socialProofItems;
  const contactEmail = landing.footerEmail.replace(/^Email:\s*/i, "");

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
              <p className="section-subtitle mt-4">{landing.heroIntro}</p>
              <ul className="bullet-list mt-6 space-y-2 pl-5 text-sm text-[var(--muted)]">
                {bulletLabels.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/reserver" className="brand-btn inline-flex rounded-lg px-5 py-2.5">
                  Reserver une seance decouverte
                </Link>
                {landing.firstSessionOffer ? (
                  <span className="text-sm text-[var(--muted)]">{landing.firstSessionOffer}</span>
                ) : null}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="hero-banner aspect-[4/5] md:aspect-[3/4]">
                {landing.heroImage1Url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={landing.heroImage1Url}
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

        {/* POURQUOI */}
        <section id="pourquoi" className="section-block bg-[var(--beige)]">
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
              <SectionLabel>Mon histoire</SectionLabel>
              <h2 className="section-title mt-3">{landing.teacherBioTitle}</h2>
              <div className="mt-5 space-y-4 text-[var(--muted)] leading-relaxed">
                {bioExcerpt.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
              <Link
                href="/#contact-form"
                className="brand-btn-secondary brand-btn-sm mt-6 inline-flex rounded-lg px-4 py-2"
              >
                Me contacter
              </Link>
            </div>
          </ScrollReveal>
        </section>

        {/* OFFRES */}
        <section id="offres" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Accompagnements</SectionLabel>
              <h2 className="section-title mt-3">Les offres YogaOps</h2>
              <p className="section-subtitle mx-auto mt-3">
                Chaque seance est pensee pour s adapter a votre rythme, sans pression ni performance.
              </p>
            </div>
            <ScrollStagger className="mt-10 grid gap-6 md:grid-cols-2" staggerMs={120}>
              <OfferCard
                wide
                label="Cours collectifs"
                title="Yoga collectif en ligne"
                description="40 minutes pour respirer, bouger en douceur et relacher les tensions du quotidien."
                imageUrl={landing.collectiveOfferImageUrl}
                imageAlt="Eleve en cours de yoga collectif en ligne via son ordinateur"
                meta={["40 min", "Mardi & vendredi midi", "En ligne", "5 pers. max", "Presentiel Poissy", "1ere seance offerte"]}
                href="/reserver"
                cta="Reserver"
                variant="primary"
              />
              <OfferCard
                label="Individuel"
                title="Yoga individuel"
                description="Un espace personnalise pour ralentir et retrouver de la clarte mentale."
                imageUrl={landing.individualOfferImageUrl}
                imageAlt="Professeure de yoga accompagnant une eleve en visio sur son telephone"
                meta={["1h", "En ligne", "Sur rendez-vous"]}
                href="/reserver"
                cta="Decouvrir"
              />
              <OfferCard
                label="Entreprises"
                title="Yoga en entreprise"
                description={landing.chairYogaText}
                meta={["Equipes tech", "En ligne ou sur site"]}
                href="/entreprises"
                cta="En savoir plus"
              />
              <OfferCard
                wide
                label="Ateliers"
                title="Ateliers YogaOps"
                description="Stress, charge mentale et transitions professionnelles."
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
              <SectionLabel>Confiance</SectionLabel>
              <h2 className="section-title mt-3">{landing.socialProofTitle}</h2>
            </div>
            {featuredQuote ? (
              <blockquote className="quote-featured mt-10">
                &ldquo;{featuredQuote}&rdquo;
              </blockquote>
            ) : null}
            {otherQuotes.length > 0 ? (
              <ScrollStagger className="mt-8 grid gap-5 md:grid-cols-2" staggerMs={100}>
                {otherQuotes.map((item) => (
                  <blockquote key={item} className="quote-block text-sm">
                    &ldquo;{item}&rdquo;
                  </blockquote>
                ))}
              </ScrollStagger>
            ) : null}
          </ScrollReveal>
        </section>

        {/* RESEAUX + CONTACT */}
        <section id="contact" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-5xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Communaute</SectionLabel>
              <h2 className="section-title mt-3">Suivre YogaOps</h2>
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
                    <input id="website" name="website" tabIndex={-1} autoComplete="off" className="brand-field px-3 py-2 text-sm" />
                  </div>
                  <input name="fullName" required placeholder="Votre nom" className="brand-field px-3 py-2 text-sm" />
                  <input name="email" type="email" required placeholder="Votre email" className="brand-field px-3 py-2 text-sm" />
                  <textarea name="message" required rows={4} placeholder="Votre message" className="brand-field px-3 py-2 text-sm" />
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
