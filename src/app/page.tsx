import type { Metadata } from "next";
import Link from "next/link";
import { sendContactMessage } from "@/app/actions";
import { ContactFormStartedAt } from "@/components/contact-form-started-at";
import { SiteNav } from "@/components/site-nav";
import { ensureSeedData } from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ contact?: string }>;
};

export const metadata: Metadata = {
  title: "Yoga pour femmes - Stress, dos et bien-etre | YogaOps",
  description:
    "Cours de yoga pour femmes en ligne et sur place, yoga sur chaise en entreprise, reduction du stress et soulagement du dos. Premiere seance gratuite.",
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const contactStatus = params.contact;
  await ensureSeedData();
  const [coursesCount, packageCount, availableSlots, landing] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.packagePlan.count({ where: { isActive: true } }),
    prisma.timeSlot.count({ where: { available: { gt: 0 } } }),
    getLandingContent(),
  ]);
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "YogaOps",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr",
    image: [
      "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    telephone: landing.footerPhone,
    email: landing.footerEmail.replace(/^Email:\s*/i, ""),
    address: landing.footerAddress.replace(/^Adresse:\s*/i, ""),
    description: landing.heroIntro,
    sameAs: [
      landing.facebookUrl,
      landing.instagramUrl,
      landing.tiktokUrl,
      landing.linkedinUrl,
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Proposez-vous des seances de yoga pour femmes fatiguees par le travail ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: landing.fatigueMessage,
        },
      },
      {
        "@type": "Question",
        name: "Faites-vous du yoga sur chaise en entreprise ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: landing.enterpriseMessage,
        },
      },
      {
        "@type": "Question",
        name: "Y a-t-il une premiere seance gratuite ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: landing.firstSessionOffer,
        },
      },
    ],
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <section className="brand-card grid gap-8 rounded-2xl p-8 lg:grid-cols-2">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ color: "var(--brand)" }}
            >
              {landing.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl opacity-90">
              {landing.heroIntro}
            </p>
            <p className="mt-2 max-w-2xl text-sm opacity-80">
              {landing.fatigueMessage}
            </p>
            <p className="mt-2 max-w-2xl text-sm opacity-80">
              {landing.specializationMessage}
            </p>
            <p className="mt-2 max-w-2xl text-sm opacity-80">
              {landing.enterpriseMessage}
            </p>
            <p className="mt-2 max-w-2xl text-sm opacity-80">
              {landing.outdoorMessage}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/reserver" className="brand-btn rounded-lg px-4 py-2">
                Prendre rendez-vous
              </Link>
              <Link
                href="/tarifs"
                className="brand-btn-secondary rounded-lg px-4 py-2"
              >
                Voir les formules
              </Link>
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--brand)" }}>
              {landing.firstSessionOffer}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="brand-card rounded-xl p-4">
              {landing.heroImage1Url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={landing.heroImage1Url}
                  alt="Seance de yoga bien-etre pour femme"
                  className="h-48 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <p className="mt-3 text-sm opacity-80">
                Cours prives et petits groupes pour se recentrer, respirer et
                retrouver un dos plus souple.
              </p>
            </article>
            <article className="brand-card rounded-xl p-4">
              {landing.heroImage2Url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={landing.heroImage2Url}
                  alt="Yoga sur chaise en entreprise"
                  className="h-48 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <p className="mt-3 text-sm opacity-80">
                Interventions en entreprise: yoga sur chaise pour detendre nuque,
                epaules et lombaires au bureau.
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Mieux gerer le stress</h2>
            <p className="mt-2 text-sm opacity-85">
              Respiration guidee, relachement musculaire et mouvements adaptes pour
              calmer le mental et repartir plus legere.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">Soulager le mal de dos</h2>
            <p className="mt-2 text-sm opacity-85">
              Seances ciblees pour delier le dos, renforcer en douceur et reduire
              les douleurs liees a la sedentarite.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <h2 className="text-lg font-semibold">En ligne, sur place, entreprise</h2>
            <p className="mt-2 text-sm opacity-85">
              Choisissez le format qui vous convient: visio, presentiel ou atelier
              yoga sur chaise pour vos equipes.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5 md:col-span-3">
            <h2 className="text-lg font-semibold">Specialisation stress IT (sans exclure les autres profils)</h2>
            <p className="mt-2 text-sm opacity-85">
              Grace a mon experience en recrutement IT, je comprends la pression de ce secteur,
              en particulier pour les femmes. Je propose un accompagnement cible pour aider a
              respirer, sortir de la surcharge mentale et retrouver de la clarte, tout en restant
              ouvert a toutes les femmes et a tout type de metier.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5 md:col-span-3">
            <h2 className="text-lg font-semibold">Seances en plein air en groupe</h2>
            <p className="mt-2 text-sm opacity-85">
              Rejoignez des sessions conviviales en exterieur pour prendre plaisir
              a pratiquer, respirer au grand air et faire connaissance avec
              d autres femmes bienveillantes.
            </p>
          </article>
          <article className="brand-card rounded-xl p-5 md:col-span-3">
            <h2 className="text-lg font-semibold">Zone desservie</h2>
            <p className="mt-2 text-sm opacity-85">
              Vous etes a Carrieres-sous-Poissy (78955) ? Decouvrez la page locale dediee pour les
              seances yoga femmes, en ligne, sur place et en entreprise.
            </p>
            <Link
              href="/yoga-femme-carrieres-sous-poissy"
              className="brand-btn-secondary brand-btn-sm mt-3 inline-block rounded-lg px-3 py-1"
            >
              Voir la page locale Carrieres-sous-Poissy
            </Link>
          </article>
        </section>

        <section className="brand-card rounded-xl p-6">
          <h2 className="text-xl font-semibold">{landing.socialProofTitle}</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {landing.socialProofItems.map((item) => (
              <li key={item} className="brand-list-item rounded-lg p-4 text-sm opacity-90">
                « {item} »
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="brand-card rounded-xl p-6">
            <h2 className="text-xl font-semibold">{landing.teacherBioTitle}</h2>
            <p className="mt-3 text-sm opacity-90">{landing.teacherBioText}</p>
          </article>
          <article className="brand-card rounded-xl p-6">
            <h2 className="text-xl font-semibold">{landing.practicalInfoTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm opacity-90">
              {landing.practicalInfoItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="brand-card rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--brand)" }}>
            {landing.finalCtaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm opacity-90">{landing.finalCtaText}</p>
          <div className="mt-5">
            <Link href="/reserver" className="brand-btn rounded-lg px-5 py-2.5">
              {landing.finalCtaButtonLabel}
            </Link>
          </div>
        </section>

        <section id="contact-form" className="brand-card rounded-xl p-6">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--brand)" }}>
            Une question ? Contactez-moi
          </h2>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            Envoyez votre message pour demander des informations sur les seances, les tarifs ou les
            interventions en entreprise.
          </p>
          {contactStatus === "ok" ? (
            <p className="brand-alert mt-4 rounded-lg p-3 text-sm">
              Merci, votre message a bien ete envoye. Je vous reponds rapidement.
            </p>
          ) : null}
          {contactStatus === "error" ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Merci de remplir tous les champs du formulaire.
            </p>
          ) : null}
          <form action={sendContactMessage} className="mt-4 grid max-w-2xl gap-3">
            <ContactFormStartedAt />
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="brand-field rounded-md px-3 py-2 text-sm"
              />
            </div>
            <input
              name="fullName"
              required
              placeholder="Votre nom"
              className="brand-field rounded-md px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Votre email"
              className="brand-field rounded-md px-3 py-2 text-sm"
            />
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Votre message"
              className="brand-field rounded-md px-3 py-2 text-sm"
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Envoyer le message
            </button>
          </form>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Types de cours</p>
            <p className="mt-1 text-2xl font-semibold">{coursesCount}</p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Abonnements</p>
            <p className="mt-1 text-2xl font-semibold">{packageCount}</p>
          </article>
          <article className="brand-card rounded-xl p-5">
            <p className="text-sm opacity-75">Creneaux reservables</p>
            <p className="mt-1 text-2xl font-semibold">{availableSlots}</p>
          </article>
        </section>
      </main>
    </div>
  );
}
