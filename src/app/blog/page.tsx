import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { listPublishedBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog yoga: stress, dos, bien-etre femme | YogaOps",
  description:
    "Articles pratiques sur le yoga pour femmes, la gestion du stress, le mal de dos et le yoga sur chaise en entreprise.",
};

export default async function BlogPage() {
  const posts = await listPublishedBlogPosts();

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Blog YogaOps
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Conseils bien-etre, gestion du stress, yoga sur chaise et routines pour soulager le dos.
        </p>

        <section className="mt-8 grid gap-4">
          {posts.length === 0 ? (
            <article className="brand-card rounded-xl p-6 text-sm opacity-80">
              Aucun article publie pour le moment.
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="brand-card rounded-xl overflow-hidden">
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
                  <h2 className="text-xl font-semibold">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm opacity-80">{post.excerpt}</p>
                  <p className="mt-4 text-sm opacity-90">
                    {post.content.length > 260 ? `${post.content.slice(0, 260)}...` : post.content}
                  </p>
                  <Link href={`/blog/${post.slug}`} className="brand-btn-secondary brand-btn-sm mt-4 inline-block rounded-md px-3 py-1">
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
