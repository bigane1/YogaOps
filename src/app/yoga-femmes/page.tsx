export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { HomepageSection } from "@/components/homepage-sections";
import { SiteNav } from "@/components/site-nav";
import { SectionLabel, splitBioParagraphs } from "@/components/site-ui";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ensureSeedData } from "@/lib/db";
import { YOGA_FEMMES_SECTION_ORDER } from "@/lib/homepage-sections-config";
import {
  getLandingContent,
  resolveHeroBannerImageUrl,
  withImageCacheBust,
} from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Yoga pour femmes actives | YogaOps",
  description:
    "Séances de yoga douces pour les femmes derrière un écran : collectif, Femmes Tech et accompagnement individuel.",
};

export default async function YogaFemmesPage() {
  await ensureSeedData();
  const landing = await getLandingContent();

  const sectionProps = {
    landing,
    heroBannerSrc: withImageCacheBust(
      resolveHeroBannerImageUrl(landing.heroImage1Url, landing.heroImage2Url),
      landing.updatedAt ?? "",
    ),
    collectiveOfferSrc: withImageCacheBust(
      landing.collectiveOfferImageUrl,
      landing.updatedAt ?? "",
    ),
    techWomenOfferSrc: withImageCacheBust(
      landing.techWomenOfferImageUrl,
      landing.updatedAt ?? "",
    ),
    individualOfferSrc: withImageCacheBust(
      landing.individualOfferImageUrl,
      landing.updatedAt ?? "",
    ),
    bioParagraphs: splitBioParagraphs(landing.teacherBioText),
    contactEmail: landing.footerEmail.replace(/^Email:\s*/i, ""),
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main>
        <section className="section-block">
          <ScrollReveal className="mx-auto w-full max-w-3xl px-5 md:px-8">
            <SectionLabel>Yoga femmes</SectionLabel>
            <h1 className="section-title mt-3">
              YogaOps pour femmes derrière un écran
            </h1>
            <p className="section-subtitle mt-4">
              Des séances douces pour respirer, relâcher les tensions et retrouver de
              l&apos;énergie — collectives, Femmes Tech ou individuelles.
            </p>
          </ScrollReveal>
        </section>

        {YOGA_FEMMES_SECTION_ORDER.map((sectionId) => (
          <HomepageSection key={sectionId} id={sectionId} props={sectionProps} />
        ))}
      </main>
    </div>
  );
}
