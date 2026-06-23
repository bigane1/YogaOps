import { prisma } from "@/lib/prisma";

const CGV_TEMPLATE = `CGV - Conditions Generales de Vente (Micro-entreprise)

1. Objet
Les presentes Conditions Generales de Vente (CGV) regissent la vente de seances de yoga (individuelles, collectives, en ligne, en presentiel ou en entreprise) et des formules associees proposees par YogaOps.

2. Prestations proposees
Les prestations sont decrites sur le site (format, duree, tarifs). YogaOps se reserve le droit d adapter le contenu pedagogique des seances selon le niveau et l etat de forme des participantes.

3. Reservation
La reservation d une seance est effectuee via le site et vaut acceptation pleine et entiere des presentes CGV.

4. Tarifs et paiement
Les prix sont indiques en euros. Le paiement peut etre realise selon les moyens proposes sur le site (paiement en ligne ou sur place selon le cas).

5. Annulation et report
Toute demande d annulation ou de report doit etre transmise des que possible.
Sauf mention contraire dans une offre specifique:
- annulation plus de 24h avant: report possible selon disponibilites;
- annulation moins de 24h avant ou absence: seance due.
En cas d annulation par YogaOps, une nouvelle date est proposee ou un remboursement est effectue selon la situation.

6. Conditions de participation
Chaque participante confirme etre apte a la pratique d une activite physique douce.
En cas de pathologie, grossesse, blessure ou doute, il est recommande de demander l avis d un professionnel de sante avant la seance.

7. Responsabilite
YogaOps met en oeuvre tous les moyens raisonnables pour assurer des seances de qualite et securisees.
La responsabilite de YogaOps ne saurait etre engagee en cas de mauvaise execution liee a une information incomplete ou inexacte fournie par la cliente, ou a un cas de force majeure.

8. Propriete intellectuelle
Les contenus, supports, textes, visuels et methodes proposes restent la propriete de YogaOps, sauf mention contraire.

9. Donnees personnelles
Les donnees collectees via le site sont utilisees pour la gestion des reservations, la relation client et le suivi administratif.

10. Mediation de la consommation
Conformement aux articles L.612-1 et suivants du Code de la consommation, la cliente peut recourir gratuitement a un mediateur de la consommation en vue de la resolution amiable d un litige.
Nom et coordonnees du mediateur: a completer.

11. Droit applicable
Les presentes CGV sont soumises au droit francais.

12. Informations micro-entreprise
Statut: micro-entreprise.
TVA non applicable, article 293 B du CGI (si franchise en base applicable).`;

const CGU_TEMPLATE = `CGU - Conditions Generales d Utilisation

1. Objet
Les presentes CGU encadrent l acces et l utilisation du site YogaOps.

2. Acceptation
En naviguant sur le site, l utilisatrice reconnait avoir pris connaissance des CGU et les accepter sans reserve.

3. Acces au site
Le site est accessible 24h/24, 7j/7, sauf interruption pour maintenance, mise a jour ou cas de force majeure.

4. Utilisation du site
L utilisatrice s engage a:
- fournir des informations exactes lors des formulaires;
- ne pas porter atteinte au bon fonctionnement du site;
- ne pas tenter d acceder de maniere non autorisee aux donnees ou systemes.

5. Contenus et propriete intellectuelle
L ensemble des contenus du site (marque, textes, photos, graphismes, logos) est protege.
Toute reproduction, representation ou diffusion sans autorisation prealable est interdite.

6. Liens externes
Le site peut contenir des liens vers des sites tiers. YogaOps n est pas responsable du contenu de ces sites externes.

7. Responsabilite
YogaOps met en oeuvre des moyens raisonnables pour fournir des informations fiables et actualisees, sans garantir l absence totale d erreurs ou d interruptions.

8. Donnees personnelles
L utilisation du site peut entrainer la collecte de donnees personnelles strictement necessaires au traitement des reservations et demandes de contact.

9. Modification des CGU
YogaOps peut modifier les presentes CGU a tout moment. La version en vigueur est celle publiee sur le site.

10. Droit applicable
Les presentes CGU sont soumises au droit francais.`;

const LEGAL_NOTICE_TEMPLATE = `Mentions legales (Micro-entreprise)

1. Editeur du site
Nom commercial: YogaOps
Responsable de publication: la professeure exploitante du service
Email de contact: contact@yogaops.fr
Telephone: +33 6 00 00 00 00
Statut juridique: micro-entreprise
Nom / Prenom de l exploitante: a completer
Adresse de domiciliation: a completer
SIREN: a completer
RCS/RM: a completer si applicable
TVA: TVA non applicable, article 293 B du CGI (si franchise en base)

2. Hebergement
Hebergeur: a completer avec les informations de votre hebergeur (raison sociale, adresse, contact).

3. Activite
Le site propose des services de reservation de seances de yoga (en ligne, presentiel et interventions en entreprise).

4. Propriete intellectuelle
Les contenus du site sont proteges par le droit de la propriete intellectuelle.
Toute reproduction, adaptation ou publication, totale ou partielle, sans autorisation ecrite est interdite.

5. Donnees personnelles
Les informations collectees via les formulaires sont utilisees pour gerer les reservations, repondre aux demandes et assurer le suivi client.
Les donnees sont conservees uniquement pendant la duree necessaire a ces finalites, sauf obligation legale contraire.

6. Cookies et mesures d audience
Le site peut utiliser des cookies techniques necessaires a son fonctionnement.
En cas d ajout de cookies de mesure d audience ou marketing, un bandeau de consentement doit etre mis en place.

7. Mediation de la consommation
Conformement au Code de la consommation, vous pouvez recourir gratuitement a un mediateur de la consommation en cas de litige.
Nom et coordonnees du mediateur: a completer.

8. Contact
Pour toute question juridique ou relative a vos donnees, vous pouvez contacter YogaOps via l email indique ci-dessus.`;

export type LandingContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroIntro: string;
  heroImage1Url: string;
  heroImage2Url: string;
  collectiveOfferImageUrl: string;
  individualOfferImageUrl: string;
  presentielOfferImageUrl: string;
  whyTitle: string;
  whyParagraphs: string[];
  formatTitle: string;
  formatText: string;
  formatItems: string[];
  specializationMessage: string;
  fatigueMessage: string;
  enterpriseMessage: string;
  outdoorMessage: string;
  firstSessionOffer: string;
  socialProofTitle: string;
  socialProofItems: string[];
  chairYogaTitle: string;
  chairYogaText: string;
  chairYogaItems: string[];
  teacherBioTitle: string;
  teacherBioText: string;
  teacherPhotoUrl: string;
  practicalInfoTitle: string;
  practicalInfoItems: string[];
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaButtonLabel: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  cgvContent: string;
  cguContent: string;
  legalNoticeContent: string;
  updatedAt?: string;
};

export function isCustomUploadedImage(url: string): boolean {
  const value = url.trim();
  return value.startsWith("/media/") || value.startsWith("/uploads/");
}

export function isStockPlaceholderImage(url: string): boolean {
  const value = url.trim();
  if (!value) return true;
  return value.includes("pexels.com") || value.includes("images.pexels");
}

/** Grande photo du bandeau : principale, ou secondaire si c'est la seule photo uploadee. */
export function resolveHeroBannerImageUrl(heroImage1Url: string, heroImage2Url: string): string {
  const primary = heroImage1Url.trim();
  const secondary = heroImage2Url.trim();
  if (isCustomUploadedImage(primary)) return primary;
  if (isCustomUploadedImage(secondary) && isStockPlaceholderImage(primary)) return secondary;
  return primary || secondary;
}

export function withImageCacheBust(url: string, version: string): string {
  if (!url.trim() || !version.trim()) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export const defaultLandingContent: LandingContent = {
  heroTitle: "Yoga doux pour les femmes actives",
  heroSubtitle: "Une parenthese au coeur de vos journees bien remplies",
  heroImage1Url:
    "https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1200",
  heroImage2Url:
    "https://images.pexels.com/photos/3822863/pexels-photo-3822863.jpeg?auto=compress&cs=tinysrgb&w=1200",
  collectiveOfferImageUrl:
    "https://images.pexels.com/photos/4056529/pexels-photo-4056529.jpeg?auto=compress&cs=tinysrgb&w=1200",
  individualOfferImageUrl:
    "https://images.pexels.com/photos/7978244/pexels-photo-7978244.jpeg?auto=compress&cs=tinysrgb&w=1200",
  presentielOfferImageUrl:
    "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  heroIntro:
    "Des seances en ligne pensees pour apaiser le mental, relacher les tensions et restaurer l equilibre entre corps et esprit.",
  whyTitle: "Un espace pour ralentir",
  whyParagraphs: [
    "Entre ecrans, reunions et responsabilites, le rythme du quotidien laisse peu de place pour souffler.",
    "YogaOps est un espace pour revenir a l essentiel : respirer, relacher, se recentrer.",
    "Des seances courtes, accessibles et sans performance, concues pour s integrer naturellement dans vos journees.",
  ],
  formatTitle: "Une pratique adaptee a votre rythme",
  formatText:
    "Des formats simples et flexibles, penses pour s adapter a votre realite.",
  formatItems: [
    "Cours en ligne",
    "Petits groupes",
    "Accompagnement individuel",
    "Yoga en entreprise sur demande",
  ],
  specializationMessage:
    "sortir du mode automatique",
  fatigueMessage:
    "bouger en douceur",
  enterpriseMessage:
    "deconnecter des ecrans",
  outdoorMessage:
    "retrouver du calme et de la clarte mentale",
  firstSessionOffer: "Premiere seance offerte",
  socialProofTitle: "Experiences vecues",
  socialProofItems: [
    "Super cours ! Basma explique tres bien, c est facile a suivre et tres relaxant. Je recommande. – Julia",
    "Chaque seance est adaptee a mes besoins. Un vrai moment pour moi. – Maha",
    "Je pratique entre midi et deux depuis plusieurs mois. Une vraie parenthese de calme dans mes journees. – AB",
  ],
  chairYogaTitle: "Yoga en entreprise",
  chairYogaText:
    "Offrez a vos equipes un moment pour souffler, bouger et se recentrer sans quitter leur poste de travail.",
  chairYogaItems: [
    "Reduire le stress et la charge mentale",
    "Retrouver du focus et de la clarte mentale",
    "Ameliorer la concentration au quotidien",
    "Format flexible : en ligne ou sur site",
  ],
  teacherPhotoUrl:
    "https://images.pexels.com/photos/3822863/pexels-photo-3822863.jpeg?auto=compress&cs=tinysrgb&w=800",
  teacherBioTitle: "Une pratique ancree dans la vraie vie",
  teacherBioText:
    "Je suis Basma, ancienne recruteuse IT et aujourd hui professeure de yoga certifiee en Hatha et Vinyasa.\n\nJ ai cree YogaOps apres plusieurs annees dans le digital, a vivre des journees intenses, passees devant les ecrans, entre pression et charge mentale.\n\nLe yoga m a permis de retrouver de l equilibre, de relacher les tensions et de mieux vivre ce rythme.",
  practicalInfoTitle: "Ce que ces seances vous apportent",
  practicalInfoItems: [
    "Apaisement du stress et de la charge mentale",
    "Detente profonde du corps",
    "Amelioration de la posture au quotidien",
    "Souplesse et tonicite en douceur",
    "Clarte mentale et energie renouvelee",
  ],
  finalCtaTitle: "Prete a faire une vraie pause ?",
  finalCtaText: "Premiere seance offerte",
  finalCtaButtonLabel: "Reserver une seance decouverte",
  footerAddress: "Adresse: 12 rue du Bien-Etre, 75000 Paris",
  footerPhone: "Telephone: +33 6 00 00 00 00",
  footerEmail: "Email: contact@yogaops.fr",
  facebookUrl: "https://www.facebook.com/",
  instagramUrl: "https://www.instagram.com/",
  tiktokUrl: "https://www.tiktok.com/",
  linkedinUrl: "https://www.linkedin.com/",
  cgvContent:
    CGV_TEMPLATE,
  cguContent:
    CGU_TEMPLATE,
  legalNoticeContent:
    LEGAL_NOTICE_TEMPLATE,
  updatedAt: "",
};

function parseItems(raw: string | null | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  const items = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

export async function ensureLandingContentTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS LandingContent (
      id INTEGER PRIMARY KEY,
      heroTitle TEXT NOT NULL,
      heroIntro TEXT NOT NULL,
      specializationMessage TEXT NOT NULL,
      fatigueMessage TEXT NOT NULL,
      enterpriseMessage TEXT NOT NULL,
      outdoorMessage TEXT NOT NULL,
      firstSessionOffer TEXT NOT NULL,
      socialProofTitle TEXT NOT NULL,
      socialProofItems TEXT NOT NULL,
      teacherBioTitle TEXT NOT NULL,
      teacherBioText TEXT NOT NULL,
      practicalInfoTitle TEXT NOT NULL,
      practicalInfoItems TEXT NOT NULL,
      finalCtaTitle TEXT NOT NULL,
      finalCtaText TEXT NOT NULL,
      finalCtaButtonLabel TEXT NOT NULL,
      footerAddress TEXT NOT NULL,
      footerPhone TEXT NOT NULL,
      footerEmail TEXT NOT NULL,
      facebookUrl TEXT NOT NULL,
      instagramUrl TEXT NOT NULL,
      tiktokUrl TEXT NOT NULL,
      linkedinUrl TEXT NOT NULL,
      cgvContent TEXT NOT NULL,
      cguContent TEXT NOT NULL,
      legalNoticeContent TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = (await prisma.$queryRawUnsafe<{ name: string }[]>(
    "PRAGMA table_info(LandingContent)",
  )) as { name: string }[];
  const existingColumns = new Set(columns.map((column) => column.name));
  const requiredColumns = [
    "specializationMessage",
    "footerAddress",
    "footerPhone",
    "footerEmail",
    "facebookUrl",
    "instagramUrl",
    "tiktokUrl",
    "linkedinUrl",
    "cgvContent",
    "cguContent",
    "legalNoticeContent",
    "heroImage1Url",
    "heroImage2Url",
    "collectiveOfferImageUrl",
    "individualOfferImageUrl",
    "presentielOfferImageUrl",
    "teacherPhotoUrl",
    "chairYogaTitle",
    "chairYogaText",
    "chairYogaItems",
    "heroSubtitle",
    "whyTitle",
    "whyParagraphs",
    "formatTitle",
    "formatText",
    "formatItems",
  ];

  for (const column of requiredColumns) {
    if (existingColumns.has(column)) continue;
    await prisma.$executeRawUnsafe(
      `ALTER TABLE LandingContent ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`,
    );
  }
}

export async function seedLandingContentIfMissing() {
  await ensureLandingContentTable();

  const existing = (await prisma.$queryRawUnsafe<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM LandingContent WHERE id = 1",
  )) as { count: number }[];
  const hasRow = Number(existing?.[0]?.count ?? 0) > 0;
  if (hasRow) return;

  await prisma.$executeRawUnsafe(
    `INSERT INTO LandingContent (
      id, heroTitle, heroIntro, specializationMessage, fatigueMessage, enterpriseMessage, outdoorMessage, firstSessionOffer,
      socialProofTitle, socialProofItems, teacherBioTitle, teacherBioText, practicalInfoTitle,
      practicalInfoItems, finalCtaTitle, finalCtaText, finalCtaButtonLabel, footerAddress,
      footerPhone, footerEmail, facebookUrl, instagramUrl, tiktokUrl, linkedinUrl,
      cgvContent, cguContent, legalNoticeContent, updatedAt
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
    )`,
    defaultLandingContent.heroTitle,
    defaultLandingContent.heroIntro,
    defaultLandingContent.specializationMessage,
    defaultLandingContent.fatigueMessage,
    defaultLandingContent.enterpriseMessage,
    defaultLandingContent.outdoorMessage,
    defaultLandingContent.firstSessionOffer,
    defaultLandingContent.socialProofTitle,
    defaultLandingContent.socialProofItems.join("\n"),
    defaultLandingContent.teacherBioTitle,
    defaultLandingContent.teacherBioText,
    defaultLandingContent.practicalInfoTitle,
    defaultLandingContent.practicalInfoItems.join("\n"),
    defaultLandingContent.finalCtaTitle,
    defaultLandingContent.finalCtaText,
    defaultLandingContent.finalCtaButtonLabel,
    defaultLandingContent.footerAddress,
    defaultLandingContent.footerPhone,
    defaultLandingContent.footerEmail,
    defaultLandingContent.facebookUrl,
    defaultLandingContent.instagramUrl,
    defaultLandingContent.tiktokUrl,
    defaultLandingContent.linkedinUrl,
    defaultLandingContent.cgvContent,
    defaultLandingContent.cguContent,
    defaultLandingContent.legalNoticeContent,
  );
}

export async function upgradeLegalTemplatesIfNeeded() {
  await ensureLandingContentTable();

  // Upgrade legacy placeholder legal texts, without overriding custom edits.
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET cgvContent = ?,
         cguContent = ?,
         legalNoticeContent = ?
     WHERE id = 1
       AND (
         cgvContent LIKE 'CGV - Conditions Generales de Vente%'
         OR cguContent LIKE 'CGU - Conditions Generales d Utilisation%'
         OR legalNoticeContent LIKE 'Mentions legales%'
       )`,
    CGV_TEMPLATE,
    CGU_TEMPLATE,
    LEGAL_NOTICE_TEMPLATE,
  );

  // Explicit upgrade path for prior non-micro templates added in earlier versions.
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET cgvContent = ?,
         legalNoticeContent = ?
     WHERE id = 1
       AND (
         cgvContent LIKE 'CGV - Conditions Generales de Vente%'
         OR legalNoticeContent LIKE 'Mentions legales%'
       )`,
    CGV_TEMPLATE,
    LEGAL_NOTICE_TEMPLATE,
  );
}

type LandingRow = {
  heroTitle: string;
  heroSubtitle: string;
  heroIntro: string;
  heroImage1Url: string;
  heroImage2Url: string;
  collectiveOfferImageUrl: string;
  individualOfferImageUrl: string;
  presentielOfferImageUrl: string;
  whyTitle: string;
  whyParagraphs: string;
  formatTitle: string;
  formatText: string;
  formatItems: string;
  specializationMessage: string;
  fatigueMessage: string;
  enterpriseMessage: string;
  outdoorMessage: string;
  firstSessionOffer: string;
  socialProofTitle: string;
  socialProofItems: string;
  chairYogaTitle: string;
  chairYogaText: string;
  chairYogaItems: string;
  teacherBioTitle: string;
  teacherBioText: string;
  teacherPhotoUrl: string;
  practicalInfoTitle: string;
  practicalInfoItems: string;
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaButtonLabel: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  cgvContent: string;
  cguContent: string;
  legalNoticeContent: string;
  updatedAt?: string;
};

export async function upgradeOfferImagesIfEmpty() {
  await ensureLandingContentTable();

  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET collectiveOfferImageUrl = ?
     WHERE id = 1 AND (collectiveOfferImageUrl IS NULL OR collectiveOfferImageUrl = '')`,
    defaultLandingContent.collectiveOfferImageUrl,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET individualOfferImageUrl = ?
     WHERE id = 1 AND (individualOfferImageUrl IS NULL OR individualOfferImageUrl = '')`,
    defaultLandingContent.individualOfferImageUrl,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET presentielOfferImageUrl = ?
     WHERE id = 1 AND (presentielOfferImageUrl IS NULL OR presentielOfferImageUrl = '')`,
    defaultLandingContent.presentielOfferImageUrl,
  );
}

export async function upgradeCollectiveOfferImageIfLegacy() {
  await ensureLandingContentTable();

  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET collectiveOfferImageUrl = ?
     WHERE id = 1
       AND (
         collectiveOfferImageUrl LIKE '%5474295%'
         OR collectiveOfferImageUrl LIKE '%5474292%'
       )`,
    defaultLandingContent.collectiveOfferImageUrl,
  );
}

export async function upgradeHomeSectionsIfEmpty() {
  await ensureLandingContentTable();
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET heroSubtitle = ? WHERE id = 1 AND (heroSubtitle IS NULL OR heroSubtitle = '')`,
    defaultLandingContent.heroSubtitle,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET whyTitle = ? WHERE id = 1 AND (whyTitle IS NULL OR whyTitle = '')`,
    defaultLandingContent.whyTitle,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET whyParagraphs = ? WHERE id = 1 AND (whyParagraphs IS NULL OR whyParagraphs = '')`,
    defaultLandingContent.whyParagraphs.join("\n"),
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET formatTitle = ? WHERE id = 1 AND (formatTitle IS NULL OR formatTitle = '')`,
    defaultLandingContent.formatTitle,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET formatText = ? WHERE id = 1 AND (formatText IS NULL OR formatText = '')`,
    defaultLandingContent.formatText,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET formatItems = ? WHERE id = 1 AND (formatItems IS NULL OR formatItems = '')`,
    defaultLandingContent.formatItems.join("\n"),
  );
}

export async function getLandingContent(): Promise<LandingContent> {
  await seedLandingContentIfMissing();
  await upgradeLegalTemplatesIfNeeded();
  await upgradeOfferImagesIfEmpty();
  await upgradeCollectiveOfferImageIfLegacy();
  await upgradeHomeSectionsIfEmpty();
  const rows = (await prisma.$queryRawUnsafe<LandingRow[]>(
    "SELECT * FROM LandingContent WHERE id = 1 LIMIT 1",
  )) as LandingRow[];
  const row = rows?.[0];
  if (!row) return defaultLandingContent;

  return {
    heroTitle: row.heroTitle || defaultLandingContent.heroTitle,
    heroSubtitle: row.heroSubtitle || defaultLandingContent.heroSubtitle,
    heroIntro: row.heroIntro || defaultLandingContent.heroIntro,
    whyTitle: row.whyTitle || defaultLandingContent.whyTitle,
    whyParagraphs: parseItems(row.whyParagraphs, defaultLandingContent.whyParagraphs),
    formatTitle: row.formatTitle || defaultLandingContent.formatTitle,
    formatText: row.formatText || defaultLandingContent.formatText,
    formatItems: parseItems(row.formatItems, defaultLandingContent.formatItems),
    heroImage1Url: row.heroImage1Url || defaultLandingContent.heroImage1Url,
    heroImage2Url: row.heroImage2Url || defaultLandingContent.heroImage2Url,
    collectiveOfferImageUrl:
      row.collectiveOfferImageUrl || defaultLandingContent.collectiveOfferImageUrl,
    individualOfferImageUrl:
      row.individualOfferImageUrl || defaultLandingContent.individualOfferImageUrl,
    presentielOfferImageUrl:
      row.presentielOfferImageUrl || defaultLandingContent.presentielOfferImageUrl,
    specializationMessage:
      row.specializationMessage || defaultLandingContent.specializationMessage,
    fatigueMessage: row.fatigueMessage || defaultLandingContent.fatigueMessage,
    enterpriseMessage: row.enterpriseMessage || defaultLandingContent.enterpriseMessage,
    outdoorMessage: row.outdoorMessage || defaultLandingContent.outdoorMessage,
    firstSessionOffer: row.firstSessionOffer || defaultLandingContent.firstSessionOffer,
    socialProofTitle: row.socialProofTitle || defaultLandingContent.socialProofTitle,
    socialProofItems: parseItems(row.socialProofItems, defaultLandingContent.socialProofItems),
    chairYogaTitle: row.chairYogaTitle || defaultLandingContent.chairYogaTitle,
    chairYogaText: row.chairYogaText || defaultLandingContent.chairYogaText,
    chairYogaItems: parseItems(row.chairYogaItems, defaultLandingContent.chairYogaItems),
    teacherBioTitle: row.teacherBioTitle || defaultLandingContent.teacherBioTitle,
    teacherBioText: row.teacherBioText || defaultLandingContent.teacherBioText,
    teacherPhotoUrl: row.teacherPhotoUrl || "",
    practicalInfoTitle: row.practicalInfoTitle || defaultLandingContent.practicalInfoTitle,
    practicalInfoItems: parseItems(row.practicalInfoItems, defaultLandingContent.practicalInfoItems),
    finalCtaTitle: row.finalCtaTitle || defaultLandingContent.finalCtaTitle,
    finalCtaText: row.finalCtaText || defaultLandingContent.finalCtaText,
    finalCtaButtonLabel: row.finalCtaButtonLabel || defaultLandingContent.finalCtaButtonLabel,
    footerAddress: row.footerAddress || defaultLandingContent.footerAddress,
    footerPhone: row.footerPhone || defaultLandingContent.footerPhone,
    footerEmail: row.footerEmail || defaultLandingContent.footerEmail,
    facebookUrl: row.facebookUrl || defaultLandingContent.facebookUrl,
    instagramUrl: row.instagramUrl || defaultLandingContent.instagramUrl,
    tiktokUrl: row.tiktokUrl || defaultLandingContent.tiktokUrl,
    linkedinUrl: row.linkedinUrl || defaultLandingContent.linkedinUrl,
    cgvContent: row.cgvContent || defaultLandingContent.cgvContent,
    cguContent: row.cguContent || defaultLandingContent.cguContent,
    legalNoticeContent: row.legalNoticeContent || defaultLandingContent.legalNoticeContent,
    updatedAt: row.updatedAt || "",
  };
}

export async function updateLandingContentInDb(content: LandingContent) {
  await seedLandingContentIfMissing();
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET heroTitle = ?,
         heroSubtitle = ?,
         heroIntro = ?,
         heroImage1Url = ?,
         heroImage2Url = ?,
         collectiveOfferImageUrl = ?,
         individualOfferImageUrl = ?,
         presentielOfferImageUrl = ?,
         whyTitle = ?,
         whyParagraphs = ?,
         formatTitle = ?,
         formatText = ?,
         formatItems = ?,
         specializationMessage = ?,
         fatigueMessage = ?,
         enterpriseMessage = ?,
         outdoorMessage = ?,
         firstSessionOffer = ?,
         socialProofTitle = ?,
         socialProofItems = ?,
         chairYogaTitle = ?,
         chairYogaText = ?,
         chairYogaItems = ?,
         teacherBioTitle = ?,
         teacherBioText = ?,
         teacherPhotoUrl = ?,
         practicalInfoTitle = ?,
         practicalInfoItems = ?,
         finalCtaTitle = ?,
         finalCtaText = ?,
         finalCtaButtonLabel = ?,
         footerAddress = ?,
         footerPhone = ?,
         footerEmail = ?,
         facebookUrl = ?,
         instagramUrl = ?,
         tiktokUrl = ?,
         linkedinUrl = ?,
         cgvContent = ?,
         cguContent = ?,
         legalNoticeContent = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = 1`,
    content.heroTitle,
    content.heroSubtitle,
    content.heroIntro,
    content.heroImage1Url,
    content.heroImage2Url,
    content.collectiveOfferImageUrl,
    content.individualOfferImageUrl,
    content.presentielOfferImageUrl,
    content.whyTitle,
    content.whyParagraphs.join("\n"),
    content.formatTitle,
    content.formatText,
    content.formatItems.join("\n"),
    content.specializationMessage,
    content.fatigueMessage,
    content.enterpriseMessage,
    content.outdoorMessage,
    content.firstSessionOffer,
    content.socialProofTitle,
    content.socialProofItems.join("\n"),
    content.chairYogaTitle,
    content.chairYogaText,
    content.chairYogaItems.join("\n"),
    content.teacherBioTitle,
    content.teacherBioText,
    content.teacherPhotoUrl,
    content.practicalInfoTitle,
    content.practicalInfoItems.join("\n"),
    content.finalCtaTitle,
    content.finalCtaText,
    content.finalCtaButtonLabel,
    content.footerAddress,
    content.footerPhone,
    content.footerEmail,
    content.facebookUrl,
    content.instagramUrl,
    content.tiktokUrl,
    content.linkedinUrl,
    content.cgvContent,
    content.cguContent,
    content.legalNoticeContent,
  );
}
