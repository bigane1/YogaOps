import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { listPublishedBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog yoga: stress, charge mentale | YogaOps",
  description:
    "Conseils pratiques pour ralentir, respirer et prendre soin de soi au quotidien.",
};

export default async function BlogPage() {
  const posts = await listPublishedBlogPosts();

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="section-title">Blog YogaOps</h1>
        <p className="section-subtitle mt-3">
          Mini articles simples et utiles pour le quotidien des femmes actives.
        </p>

        <section className="mt-10 grid gap-5">
          {posts.length === 0 ? (
            <article className="offer-card text-[var(--muted)]">
              Aucun article publie pour le moment.
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="offer-card overflow-hidden p-0">
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6">
                  <h2 className="font-display text-xl font-medium">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="brand-btn-secondary brand-btn-sm mt-4 inline-flex rounded-lg px-3 py-1.5"
                  >
                    Lire l article
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
