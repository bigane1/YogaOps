import { prisma } from "@/lib/prisma";

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

function toSlug(input: string): string {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `article-${Date.now()}`;
}

export async function ensureBlogTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS BlogPost (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      isPublished INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function seedBlogIfMissing() {
  await ensureBlogTable();
  const existing = (await prisma.$queryRawUnsafe<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM BlogPost",
  )) as { count: number }[];
  if (Number(existing?.[0]?.count ?? 0) > 0) return;

  const title = "Yoga sur chaise au travail: 5 minutes anti-stress";
  await prisma.$executeRawUnsafe(
    `INSERT INTO BlogPost (title, slug, excerpt, content, isPublished, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    title,
    toSlug(title),
    "Une routine simple pour relacher les tensions du dos et respirer mieux au bureau.",
    "Le yoga sur chaise est ideal pour les femmes actives et les equipes en entreprise. En quelques minutes, vous pouvez relacher la nuque, detendre les epaules et calmer le mental. Cette pratique aide a reduire la pression au travail et a prevenir les douleurs liees a la posture.",
  );
}

export async function listPublishedBlogPosts(): Promise<BlogPost[]> {
  await seedBlogIfMissing();
  return (await prisma.$queryRawUnsafe<BlogPost[]>(
    `SELECT id, title, slug, excerpt, content, isPublished, createdAt, updatedAt
     FROM BlogPost
     WHERE isPublished = 1
     ORDER BY datetime(createdAt) DESC`,
  )) as BlogPost[];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  await seedBlogIfMissing();
  const rows = (await prisma.$queryRawUnsafe<BlogPost[]>(
    `SELECT id, title, slug, excerpt, content, isPublished, createdAt, updatedAt
     FROM BlogPost
     WHERE slug = ? AND isPublished = 1
     LIMIT 1`,
    slug,
  )) as BlogPost[];
  return rows?.[0] ?? null;
}

export async function listAdminBlogPosts(): Promise<BlogPost[]> {
  await seedBlogIfMissing();
  return (await prisma.$queryRawUnsafe<BlogPost[]>(
    `SELECT id, title, slug, excerpt, content, isPublished, createdAt, updatedAt
     FROM BlogPost
     ORDER BY datetime(createdAt) DESC`,
  )) as BlogPost[];
}

export async function createBlogPostInDb(input: {
  title: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
}) {
  await seedBlogIfMissing();
  const slug = toSlug(input.title);
  const baseSlug = slug;
  let counter = 1;
  let uniqueSlug = baseSlug;

  while (true) {
    const rows = (await prisma.$queryRawUnsafe<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM BlogPost WHERE slug = ?",
      uniqueSlug,
    )) as { count: number }[];
    if (Number(rows?.[0]?.count ?? 0) === 0) break;
    counter += 1;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO BlogPost (title, slug, excerpt, content, isPublished, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    input.title,
    uniqueSlug,
    input.excerpt,
    input.content,
    input.isPublished ? 1 : 0,
  );
}

export async function updateBlogPostInDb(input: {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
}) {
  await seedBlogIfMissing();
  await prisma.$executeRawUnsafe(
    `UPDATE BlogPost
     SET title = ?,
         excerpt = ?,
         content = ?,
         isPublished = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    input.title,
    input.excerpt,
    input.content,
    input.isPublished ? 1 : 0,
    input.id,
  );
}

export async function deleteBlogPostInDb(id: number) {
  await seedBlogIfMissing();
  await prisma.$executeRawUnsafe("DELETE FROM BlogPost WHERE id = ?", id);
}
