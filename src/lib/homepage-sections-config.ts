export const HOMEPAGE_SECTION_IDS = [
  "hero",
  "femmes-tech",
  "offres",
  "pourquoi",
  "benefices",
  "cta",
  "apropos",
  "temoignages",
  "contact",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
  hero: "Bandeau d accueil (hero)",
  "femmes-tech": "Femmes de la tech",
  offres: "Offres / formats",
  pourquoi: "Pourquoi YogaOps",
  benefices: "Benefices",
  cta: "Appel a l action intermediaire",
  apropos: "A propos (Basma)",
  temoignages: "Temoignages",
  contact: "Communaute et contact",
};

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionId[] = [...HOMEPAGE_SECTION_IDS];

export function resolveHomepageSectionOrder(
  raw: string[] | null | undefined,
): HomepageSectionId[] {
  const valid = new Set<string>(HOMEPAGE_SECTION_IDS);
  const ordered: HomepageSectionId[] = [];
  for (const id of raw ?? []) {
    if (valid.has(id) && !ordered.includes(id as HomepageSectionId)) {
      ordered.push(id as HomepageSectionId);
    }
  }
  for (const id of DEFAULT_HOMEPAGE_SECTION_ORDER) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}
