export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { BlogContent } from "@/components/blog-content";
import { getPublishedBlogPostBySlug } from "@/lib/blog";
import { withImageCacheBust } from "@/lib/landing-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article introuvable - YogaOps",
      description: "L article demande n est pas disponible.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr";
  return {
    title: `${post.title} - Blog YogaOps`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} - Blog YogaOps`,
      description: post.excerpt,
      type: "article",
      url: `${baseUrl}/blog/${post.slug}`,
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Blog YogaOps`,
      description: post.excerpt,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();
  const coverSrc = post.coverImage
    ? withImageCacheBust(post.coverImage, post.updatedAt)
    : "";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr"}/blog/${post.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "YogaOps",
    },
    publisher: {
      "@type": "Organization",
      name: "YogaOps",
    },
  };

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <Link href="/blog" className="brand-btn-secondary brand-btn-sm inline-block rounded-md px-3 py-1">
          Retour au blog
        </Link>
        <article className="brand-card mt-4 rounded-xl p-6">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt={post.title}
              className="mb-6 h-64 w-full rounded-lg object-cover"
              loading="lazy"
            />
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            {post.title}
          </h1>
          <p className="mt-2 text-sm opacity-75">{post.excerpt}</p>
          <div className="mt-5">
            <BlogContent content={post.content} />
          </div>
        </article>
      </main>
    </div>
  );
}
