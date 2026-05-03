import type { MetadataRoute } from "next";
import { listPublishedBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yogaops.fr";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cours`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/reserver`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tarifs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/entreprises`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${baseUrl}/yoga-femme-carrieres-sous-poissy`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${baseUrl}/ateliers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/abonnement`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const posts = await listPublishedBlogPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
