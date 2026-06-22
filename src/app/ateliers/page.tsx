export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { reserveSlot } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { listPublishedBlogPosts } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ateliers & ressources yoga | YogaOps",
  description:
    "Ateliers autour du stress, de la charge mentale et des transitions professionnelles. Conseils et articles pratiques.",
};

const workshopExamples = [
  "Deconnecter avant les vacances",
  "Sortir du mode automatique",
  "Yoga & transition professionnelle",
  "Respirer dans les periodes d incertitude",
];

const blogExamples = [
  "3 minutes pour relacher la pression mentale",
  "Pourquoi le corps reste tendu apres une journee d ecran",
  "Respirer avant une reunion stressante",
  "Mini mobilite apres une journee assise",
];

export default async function AteliersPage() {
  await ensureSeedData();

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
        <h1 className="section-title">Ateliers &amp; ressources</h1>
        <p className="section-subtitle mt-3">
          Des ateliers et contenus simples autour du stress, de la charge mentale et de la
          reconnexion a soi.
        </p>

        {/* Ateliers */}
        <section className="section-block">
          <h2 className="font-display text-xl font-medium">Ateliers</h2>
          <p className="mt-3 text-[var(--muted)]">
            Des ateliers autour du stress, de la charge mentale, des transitions professionnelles
            et de la reconnexion a soi.
          </p>

          {slots.length === 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {workshopExamples.map((title) => (
                <li key={title} className="offer-card">
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-[var(--muted)]">Prochainement disponible</p>
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

          <Link href="/reserver" className="brand-btn-secondary brand-btn-sm mt-8 inline-flex rounded-lg px-4 py-2">
            S inscrire a un atelier
          </Link>
        </section>

        {/* Blog */}
        <section className="section-block border-t border-[var(--border-soft)]">
          <h2 className="font-display text-xl font-medium">Blog / Conseils</h2>
          <p className="mt-3 text-[var(--muted)]">
            Mini articles simples et utiles pour le quotidien.
          </p>

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
              : blogExamples.map((title) => (
                  <article key={title} className="offer-card">
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-[var(--muted)]">Article a venir</p>
                  </article>
                ))}
          </div>

          <Link href="/blog" className="brand-btn-secondary brand-btn-sm mt-8 inline-flex rounded-lg px-4 py-2">
            Voir tous les articles
          </Link>
        </section>
      </main>
    </div>
  );
}
