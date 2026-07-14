export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { HomepageSection } from "@/components/homepage-sections";
import { SiteNav } from "@/components/site-nav";
import { splitBioParagraphs } from "@/components/site-ui";
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

  const sectionProps = {
    landing,
    contactStatus,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />

        {landing.homepageSectionOrder.map((sectionId) => (
          <HomepageSection key={sectionId} id={sectionId} props={sectionProps} />
        ))}
      </main>
    </div>
  );
}
