import { prisma } from "@/lib/prisma";

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
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
      coverImage TEXT NOT NULL DEFAULT '',
      isPublished INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = (await prisma.$queryRawUnsafe<{ name: string }[]>(
    "PRAGMA table_info(BlogPost)",
  )) as { name: string }[];
  const existingColumns = new Set(columns.map((c) => c.name));
  if (!existingColumns.has("coverImage")) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE BlogPost ADD COLUMN coverImage TEXT NOT NULL DEFAULT ''",
    );
  }
}

export async function seedBlogIfMissing() {
  await ensureBlogTable();
  const existing = (await prisma.$queryRawUnsafe<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM BlogPost",
  )) as { count: number }[];
  if (Number(existing?.[0]?.count ?? 0) > 0) {
    await seedSouplesseArticleIfMissing();
    return;
  }

  const title = "Yoga sur chaise au travail: 5 minutes anti-stress";
  await prisma.$executeRawUnsafe(
    `INSERT INTO BlogPost (title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    title,
    toSlug(title),
    "Une routine simple pour relacher les tensions du dos et respirer mieux au bureau.",
    "Le yoga sur chaise est ideal pour les femmes actives et les equipes en entreprise. En quelques minutes, vous pouvez relacher la nuque, detendre les epaules et calmer le mental. Cette pratique aide a reduire la pression au travail et a prevenir les douleurs liees a la posture.",
  );

  await seedSouplesseArticleIfMissing();
}

const SOUPLESSE_SLUG = "je-ne-suis-pas-souple-je-ne-suis-pas-sportive";

export async function seedSouplesseArticleIfMissing() {
  await ensureBlogTable();
  const existing = (await prisma.$queryRawUnsafe<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM BlogPost WHERE slug = ?",
    SOUPLESSE_SLUG,
  )) as { count: number }[];
  if (Number(existing?.[0]?.count ?? 0) > 0) return;

  const title = '"Je ne suis pas souple, je ne suis pas sportive" — pourquoi ce n est pas un probleme';
  const excerpt =
    "Ce n est pas un probleme. Ce n est meme pas un point de depart pertinent pour une seance YogaOps.";
  const content = `C'est la phrase que j'entends le plus souvent avant une premiere seance. Presque toujours dite comme une excuse, avant meme d'avoir commence.

Alors autant le dire clairement des le depart : ce n'est pas un probleme. Ce n'est meme pas un point de depart pertinent.

## Ce que les seances YogaOps ne sont pas

Il n'y a pas de posture a reussir. Pas de niveau a atteindre. Pas de comparaison, meme silencieuse, avec la personne a cote de vous a l'ecran.

Une seance YogaOps, c'est un moment de mouvement, de respiration et de relachement, pense pour un corps qui a passe la matinee assis devant un ecran.

Vous n'avez rien a prouver. Il n'y a d'ailleurs personne a qui le prouver.

## D'ou vient cette idee recue

La confusion vient souvent d'images : des postures spectaculaires, des corps tres souples, des comptes Instagram ou tout semble fluide et facile. Ca n'a rien a voir avec ce qui se passe reellement pendant 40 minutes a la mi-journee.

Ce qu'on travaille, ce n'est pas l'amplitude d'un mouvement. C'est la capacite a ralentir, a desserrer une machoire, a faire descendre des epaules qui vivent remontees depuis le matin. Ca ne demande aucune souplesse. Ca demande juste de se rendre disponible quelques minutes.

## Ce qui compte vraiment

Chaque mouvement propose a une version accessible, quel que soit votre point de depart. Une hanche raide, un dos qui a mal, une nuque bloquee par des heures de visio : ce sont exactement les corps pour lesquels ces seances sont pensees, pas une exception a accommoder.

La seule chose qui compte, c'est d'arriver. Le reste s'ajuste avec vous, a votre rythme, seance apres seance.

## Pour qui c'est fait

Pour les femmes qui n'ont jamais pratique. Pour celles qui ont essaye une fois, il y a longtemps, et qui n'ont pas aime se sentir en decalage. Pour celles qui pensent, sincerement, que "ce n'est pas pour elles".

Ce sont precisement les personnes pour qui YogaOps a ete pense.

---

*Envie de le verifier par vous-meme ? Votre premiere seance est offerte.*`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO BlogPost (title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    title,
    SOUPLESSE_SLUG,
    excerpt,
    content,
  );
}

export async function listPublishedBlogPosts(): Promise<BlogPost[]> {
  await seedBlogIfMissing();
  await seedSouplesseArticleIfMissing();
  return (await prisma.$queryRawUnsafe<BlogPost[]>(
    `SELECT id, title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt
     FROM BlogPost
     WHERE isPublished = 1
     ORDER BY datetime(createdAt) DESC`,
  )) as BlogPost[];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  await seedBlogIfMissing();
  const rows = (await prisma.$queryRawUnsafe<BlogPost[]>(
    `SELECT id, title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt
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
    `SELECT id, title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt
     FROM BlogPost
     ORDER BY datetime(createdAt) DESC`,
  )) as BlogPost[];
}

export async function createBlogPostInDb(input: {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
}): Promise<string> {
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
    `INSERT INTO BlogPost (title, slug, excerpt, content, coverImage, isPublished, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    input.title,
    uniqueSlug,
    input.excerpt,
    input.content,
    input.coverImage,
    input.isPublished ? 1 : 0,
  );
  return uniqueSlug;
}

export async function updateBlogPostInDb(input: {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
}): Promise<string | null> {
  await seedBlogIfMissing();
  const rows = (await prisma.$queryRawUnsafe<{ slug: string }[]>(
    "SELECT slug FROM BlogPost WHERE id = ? LIMIT 1",
    input.id,
  )) as { slug: string }[];
  const slug = rows?.[0]?.slug ?? null;

  await prisma.$executeRawUnsafe(
    `UPDATE BlogPost
     SET title = ?,
         excerpt = ?,
         content = ?,
         coverImage = ?,
         isPublished = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    input.title,
    input.excerpt,
    input.content,
    input.coverImage,
    input.isPublished ? 1 : 0,
    input.id,
  );
  return slug;
}

export async function deleteBlogPostInDb(id: number) {
  await seedBlogIfMissing();
  await prisma.$executeRawUnsafe("DELETE FROM BlogPost WHERE id = ?", id);
}
