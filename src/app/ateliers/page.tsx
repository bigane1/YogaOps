export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { notifyAtelierInterest, reserveSlot } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { listPublishedBlogPosts } from "@/lib/blog";
import {
  defaultWorkshopItems,
  getLandingContent,
  parseWorkshopItems,
} from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ateliers & ressources yoga | YogaOps",
  description:
    "Ateliers autour du stress, de la charge mentale et des transitions professionnelles. Conseils et articles pratiques.",
};

type Props = {
  searchParams: Promise<{ signup?: string }>;
};

export default async function AteliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const signupStatus = params.signup;
  await ensureSeedData();

  const landing = await getLandingContent();
  const workshops = parseWorkshopItems(landing.ateliersWorkshops, defaultWorkshopItems);

  const now = new Date();
  const [slots, posts] = await Promise.all([
    prisma.timeSlot.findMany({
      where: {
        startsAt: { gt: now },
        course: { isActive: true, isWorkshop: true },
      },
      include: { course: true },
      orderBy: { startsAt: "asc" },
    }),
    listPublishedBlogPosts(),
  ]);

  const displayPosts = posts.length > 0 ? posts.slice(0, 4) : null;

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="section-title">{landing.ateliersPageTitle}</h1>
        <p className="section-subtitle mt-3">{landing.ateliersPageIntro}</p>

        <section className="section-block">
          <h2 className="font-display text-xl font-medium">Ateliers</h2>

          {slots.length === 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {workshops.map((workshop) => (
                <li key={workshop.title} className="offer-card">
                  <h3 className="font-medium">{workshop.title}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{workshop.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {slots.map((slot) => {
                const complet = slot.available <= 0;
                return (
                  <article key={slot.id} className="offer-card">
                    <h3 className="font-display text-lg font-medium">{slot.course.title}</h3>
                    <p className="text-sm text-[var(--muted)]">{slot.course.description}</p>
                    <div className="space-y-1 text-sm text-[var(--muted)]">
                      <p>{formatDateFR(slot.startsAt)}</p>
                      <p>{slot.course.durationMin} min</p>
                      <p>
                        {slot.course.location === "en_ligne" ? "En ligne" : "Presentiel"}
                      </p>
                      <p className="font-medium text-[var(--foreground)]">
                        {slot.course.priceEur} EUR
                      </p>
                    </div>
                    {complet ? (
                      <p className="text-sm text-red-700">Complet</p>
                    ) : (
                      <form action={reserveSlot} className="mt-2 grid gap-2">
                        <input type="hidden" name="slotId" value={slot.id} />
                        <input type="hidden" name="paymentMethod" value="stripe" />
                        <input
                          name="customerName"
                          required
                          placeholder="Votre nom"
                          className="brand-field px-3 py-2 text-sm"
                        />
                        <input
                          name="customerEmail"
                          type="email"
                          required
                          placeholder="Votre email"
                          className="brand-field px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2"
                        >
                          S inscrire
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-8 max-w-2xl text-[var(--muted)] leading-relaxed">
            {landing.ateliersAnnounceText}
          </p>

          <div id="atelier-signup" className="brand-card mt-6 max-w-md rounded-2xl p-6">
            <h3 className="font-display text-lg font-medium">{landing.ateliersSignupTitle}</h3>
            {signupStatus === "ok" ? (
              <p className="brand-alert mt-4 rounded-lg p-3 text-sm">
                Merci, vous serez informee en priorite des prochaines dates.
              </p>
            ) : null}
            {signupStatus === "error" ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Merci de remplir votre prenom et votre email.
              </p>
            ) : null}
            <form action={notifyAtelierInterest} className="mt-4 grid gap-3">
              <div className="hidden" aria-hidden="true">
                <input name="website" tabIndex={-1} autoComplete="off" className="brand-field px-3 py-2 text-sm" />
              </div>
              <input
                name="firstName"
                required
                placeholder="Votre prenom"
                className="brand-field px-3 py-2 text-sm"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Votre email"
                className="brand-field px-3 py-2 text-sm"
              />
              <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
                {landing.ateliersSignupButtonLabel}
              </button>
            </form>
          </div>
        </section>

        <section className="section-block border-t border-[var(--border-soft)]">
          <h2 className="font-display text-xl font-medium">{landing.ateliersBlogTitle}</h2>
          <p className="mt-3 text-[var(--muted)]">{landing.ateliersBlogIntro}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {displayPosts
              ? displayPosts.map((post) => (
                  <article key={post.id} className="offer-card">
                    <h3 className="font-medium">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-[var(--muted)]">{post.excerpt}</p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="brand-btn-secondary brand-btn-sm mt-auto w-fit rounded-lg px-3 py-1.5"
                    >
                      Lire
                    </Link>
                  </article>
                ))
              : null}
          </div>

          <Link href="/blog" className="brand-btn-secondary brand-btn-sm mt-8 inline-flex rounded-lg px-4 py-2">
            Voir tous les articles
          </Link>
        </section>
      </main>
    </div>
  );
}
