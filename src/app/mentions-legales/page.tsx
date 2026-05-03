import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { getLandingContent } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Mentions Légales - YogaOps",
  description: "Mentions légales du site YogaOps.",
  robots: { index: false },
};

export default async function MentionsLegalesPage() {
  const landing = await getLandingContent();

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <section className="brand-card rounded-xl p-6">
          <h1 className="text-3xl font-semibold" style={{ color: "var(--brand)" }}>
            Mentions legales
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm opacity-90">
            {landing.legalNoticeContent}
          </p>
        </section>
      </main>
    </div>
  );
}
