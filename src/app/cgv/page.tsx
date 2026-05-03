import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { getLandingContent } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente - YogaOps",
  description: "Conditions générales de vente des séances de yoga YogaOps.",
  robots: { index: false },
};

export default async function CgvPage() {
  const landing = await getLandingContent();

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <section className="brand-card rounded-xl p-6">
          <h1 className="text-3xl font-semibold" style={{ color: "var(--brand)" }}>
            Conditions Generales de Vente
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm opacity-90">{landing.cgvContent}</p>
        </section>
      </main>
    </div>
  );
}
