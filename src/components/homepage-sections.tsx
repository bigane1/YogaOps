import Link from "next/link";
import { sendContactMessage } from "@/app/actions";
import { ContactFormStartedAt } from "@/components/contact-form-started-at";
import { OfferCard, SectionLabel } from "@/components/site-ui";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ScrollStagger } from "@/components/scroll-stagger";
import type { HomepageSectionId } from "@/lib/homepage-sections-config";
import type { LandingContent } from "@/lib/landing-content";

export type HomepageSectionsProps = {
  landing: LandingContent;
  contactStatus?: string;
  heroBannerSrc: string;
  collectiveOfferSrc: string;
  techWomenOfferSrc: string;
  individualOfferSrc: string;
  bioParagraphs: string[];
  contactEmail: string;
};

export function HomepageSection({
  id,
  props,
}: {
  id: HomepageSectionId;
  props: HomepageSectionsProps;
}) {
  const {
    landing,
    contactStatus,
    heroBannerSrc,
    collectiveOfferSrc,
    techWomenOfferSrc,
    individualOfferSrc,
    bioParagraphs,
    contactEmail,
  } = props;

  switch (id) {
    case "hero":
      return (
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
                    {landing.finalCtaButtonLabel}
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
      );

    case "femmes-tech":
      return (
        <section id="femmes-tech" className="section-block bg-[var(--beige)]">
          <ScrollReveal className="mx-auto w-full max-w-3xl px-5 md:px-8">
            <SectionLabel>{landing.techWomenLabel}</SectionLabel>
            <h2 className="section-title mt-3">{landing.techWomenTitle}</h2>
            <div className="mt-6 space-y-4 text-[var(--muted)] leading-relaxed">
              {landing.techWomenParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <Link href="/reserver" className="brand-btn mt-8 inline-flex rounded-lg px-5 py-2.5">
              {landing.techWomenCtaLabel}
            </Link>
          </ScrollReveal>
        </section>
      );

    case "offres":
      return (
        <section id="offres" className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-7xl px-5 md:px-8">
            <div className="text-center">
              <SectionLabel>Offres</SectionLabel>
              <h2 className="section-title mt-3">{landing.formatTitle}</h2>
              {landing.formatText ? (
                <p className="section-subtitle mx-auto mt-3">{landing.formatText}</p>
              ) : null}
            </div>
            <ScrollStagger className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3" staggerMs={120}>
              <OfferCard
                label={landing.offerCollectiveLabel}
                title={landing.offerCollectiveTitle}
                description={landing.offerCollectiveDescription}
                imageUrl={collectiveOfferSrc}
                imageAlt="Seances collectives de yoga en ligne"
                meta={landing.offerCollectiveMeta}
                href="/reserver"
                cta="Reserver"
                variant="primary"
              />
              <OfferCard
                label={landing.offerTechLabel}
                title={landing.offerTechTitle}
                description={landing.offerTechDescription}
                imageUrl={techWomenOfferSrc}
                imageAlt="Seance Femmes Tech en ligne"
                meta={landing.offerTechMeta}
                href="/reserver"
                cta="Reserver"
                variant="primary"
              />
              <OfferCard
                label={landing.offerIndividualLabel}
                title={landing.offerIndividualTitle}
                description={landing.offerIndividualDescription}
                imageUrl={individualOfferSrc}
                imageAlt="Accompagnement individuel en yoga"
                meta={landing.offerIndividualMeta}
                href="/reserver"
                cta="Decouvrir"
              />
            </ScrollStagger>
          </ScrollReveal>
        </section>
      );

    case "pourquoi":
      return (
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
      );

    case "benefices":
      return (
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
      );

    case "cta":
      return (
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
      );

    case "apropos":
      return (
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
                {bioParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      );

    case "temoignages":
      return (
        <section id="temoignages" className="section-block">
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
      );

    case "contact":
      return (
        <section id="contact" className="section-block bg-[var(--beige)]">
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
      );

    default:
      return null;
  }
}
