import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  resolveHomepageSectionOrder,
  type HomepageSectionId,
} from "@/lib/homepage-sections-config";
import { DEFAULT_RESERVER_WEEKDAYS } from "@/lib/reserver-config";

export type { HomepageSectionId } from "@/lib/homepage-sections-config";
export {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  HOMEPAGE_SECTION_IDS,
  HOMEPAGE_SECTION_LABELS,
  resolveHomepageSectionOrder,
} from "@/lib/homepage-sections-config";

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

export type WorkshopItem = {
  title: string;
  description: string;
};

export type LandingContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroIntro: string;
  heroImage1Url: string;
  heroImage2Url: string;
  collectiveOfferImageUrl: string;
  individualOfferImageUrl: string;
  presentielOfferImageUrl: string;
  techWomenOfferImageUrl: string;
  whyTitle: string;
  whyParagraphs: string[];
  formatTitle: string;
  formatText: string;
  formatItems: string[];
  techWomenLabel: string;
  techWomenTitle: string;
  techWomenParagraphs: string[];
  techWomenCtaLabel: string;
  offerCollectiveLabel: string;
  offerCollectiveTitle: string;
  offerCollectiveDescription: string;
  offerCollectiveMeta: string[];
  offerTechLabel: string;
  offerTechTitle: string;
  offerTechDescription: string;
  offerTechMeta: string[];
  offerIndividualLabel: string;
  offerIndividualTitle: string;
  offerIndividualDescription: string;
  offerIndividualMeta: string[];
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
  chairYogaImageUrl: string;
  entreprisesHeroTitle: string;
  entreprisesHeroText: string;
  entreprisesWhyTitle: string;
  entreprisesWhyItems: string[];
  entreprisesHowTitle: string;
  entreprisesHowItems: string[];
  entreprisesCtaLabel: string;
  ateliersPageTitle: string;
  ateliersPageIntro: string;
  ateliersWorkshops: string;
  ateliersAnnounceText: string;
  ateliersSignupTitle: string;
  ateliersSignupButtonLabel: string;
  ateliersBlogTitle: string;
  ateliersBlogIntro: string;
  homepageSectionOrder: HomepageSectionId[];
  reserverCollectiveWeekdays: string[];
  reserverTechWomenWeekdays: string[];
  reserverIndividualWeekdays: string[];
  reserverTechWomenMatch: string;
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

export const defaultWorkshopItems: WorkshopItem[] = [
  {
    title: 'Atelier "Reprise / Transition"',
    description:
      "Pense pour les periodes de reprise (post-maternite, changement d entreprise, de poste, nouvelle organisation) : retrouver un rythme corporel stable dans une periode de changement.",
  },
  {
    title: 'Atelier "Pic de charge"',
    description:
      "Pour les periodes de forte intensite (sprint, cloture, pic recrutement IT, deadline) : des outils rapides a mobiliser quand le temps manque.",
  },
  {
    title: 'Atelier "Sommeil et recuperation"',
    description:
      "Un temps plus long et plus calme (relachement guide) pour travailler sur la qualite de la recuperation.",
  },
];

export function serializeWorkshopItems(items: WorkshopItem[]): string {
  return items.map((item) => `${item.title}|${item.description}`).join("\n");
}

export function parseWorkshopItems(raw: string | null | undefined, fallback: WorkshopItem[]): WorkshopItem[] {
  if (!raw) return fallback;
  const items = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator === -1) return { title: line, description: "" };
      return {
        title: line.slice(0, separator).trim(),
        description: line.slice(separator + 1).trim(),
      };
    });
  return items.length > 0 ? items : fallback;
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
  formatText: "",
  formatItems: [
    "Cours en ligne",
    "Petits groupes",
    "Accompagnement individuel",
    "Yoga en entreprise sur demande",
  ],
  techWomenLabel: "Femmes de la tech",
  techWomenTitle: "Une attention particuliere aux femmes de la tech",
  techWomenParagraphs: [
    "Dev, PM, data, RH tech, freelances… Le quotidien de la tech ajoute souvent une couche : environnements majoritairement masculins, charge mentale liee a la disponibilite permanente, sentiment de devoir constamment prouver sa legitimite.",
    "YogaOps propose un creneau et un espace penses specifiquement pour les femmes de la tech — un moment ou souffler ne demande aucune justification.",
  ],
  techWomenCtaLabel: "Decouvrir la session Femmes Tech",
  offerCollectiveLabel: "Seances collectives en ligne",
  offerCollectiveTitle: "Seances collectives en ligne",
  offerCollectiveDescription: "40 minutes de mouvement, respiration et relachement.",
  offerCollectiveMeta: [
    "Mardi et jeudi midi",
    "En ligne",
    "5 personnes max",
    "Premiere seance offerte",
  ],
  techWomenOfferImageUrl:
    "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1200",
  offerTechLabel: "Seance Femmes Tech",
  offerTechTitle: "Seance Femmes Tech",
  offerTechDescription:
    "40 minutes de mouvement, respiration et relachement, dans un groupe compose uniquement de femmes travaillant dans la tech.",
  offerTechMeta: ["Vendredi midi", "En ligne", "5 personnes max", "Premiere seance offerte"],
  offerIndividualLabel: "Accompagnement individuel",
  offerIndividualTitle: "Accompagnement individuel",
  offerIndividualDescription:
    "Pour ralentir a votre rythme et retrouver de la clarte mentale.",
  offerIndividualMeta: ["1h", "En ligne ou en presentiel", "Sur rendez-vous"],
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
  chairYogaImageUrl:
    "https://images.pexels.com/photos/7173032/pexels-photo-7173032.jpeg?auto=compress&cs=tinysrgb&w=1200",
  entreprisesHeroTitle:
    "Offrez a vos equipes une vraie pause, sans qu elles quittent leur poste",
  entreprisesHeroText:
    "Les journees en entreprise tech et digitale sont denses : sprints, deadlines, reunions a la chaine. YogaOps propose des seances de mouvement et de respiration directement integrees a la journee de travail — en ligne ou sur site.",
  entreprisesWhyTitle: "Pourquoi le proposer a vos equipes",
  entreprisesWhyItems: [
    "Prevenir les tensions liees a la sedentarite et au travail d ecran prolonge",
    "Offrir une vraie coupure au milieu d une journee chargee, sans organisation complexe",
    "Renforcer la marque employeur et l attention portee au bien-etre au travail",
    "Un format particulierement pertinent pour les equipes avec une forte proportion de femmes dans la tech",
  ],
  entreprisesHowTitle: "Comment ca fonctionne",
  entreprisesHowItems: [
    "Seances ponctuelles ou programme sur plusieurs semaines",
    "Format 30 a 45 minutes, en ligne ou sur site",
    "Adapte au niveau et au rythme de vos equipes, aucune experience requise",
  ],
  entreprisesCtaLabel: "Demander une pause sur mesure pour mon equipe",
  ateliersPageTitle: "Des temps forts autour de ce qui pese le plus dans votre quotidien",
  ateliersPageIntro:
    "Au-dela des seances regulieres, les ateliers YogaOps prennent le temps d aller plus loin sur une thematique precise.",
  ateliersWorkshops: serializeWorkshopItems(defaultWorkshopItems),
  ateliersAnnounceText:
    "Les prochains ateliers, dates et lieux, seront annonces tres prochainement. Envie d etre prevenue en priorite ?",
  ateliersSignupTitle: "Etre informee des prochaines dates",
  ateliersSignupButtonLabel: "Etre informee des prochaines dates",
  ateliersBlogTitle: "Le blog YogaOps",
  ateliersBlogIntro: "Mini articles simples et utiles pour le quotidien.",
  homepageSectionOrder: [...DEFAULT_HOMEPAGE_SECTION_ORDER],
  reserverCollectiveWeekdays: [...DEFAULT_RESERVER_WEEKDAYS.collective],
  reserverTechWomenWeekdays: [...DEFAULT_RESERVER_WEEKDAYS.techWomen],
  reserverIndividualWeekdays: [...DEFAULT_RESERVER_WEEKDAYS.individual],
  reserverTechWomenMatch: "femmes tech",
  teacherPhotoUrl:
    "https://images.pexels.com/photos/3822863/pexels-photo-3822863.jpeg?auto=compress&cs=tinysrgb&w=800",
  teacherBioTitle: "Une pratique ancree dans la vraie vie",
  teacherBioText:
    "Je suis Basma. Recruteuse IT freelance. Certifiee en Hatha, Vinyasa et Nidra. Formee au mouvement, a la respiration et au relachement.\n\nJ ai passe plusieurs annees dans le recrutement tech. Les ecrans. Les reunions, les entretiens qui s enchainent. Une charge mentale qui ne s arrete jamais vraiment.\n\nLe mouvement et la respiration m ont appris a prendre soin de moi. Entre deux appels, dans des journees qui ne laissaient aucune place pour souffler.\n\nEn en parlant autour de moi, j ai compris que je n etais pas la seule. Beaucoup de femmes du digital et de la tech vivent le meme rythme, sans espace pour le relacher.\n\nYogaOps est ne de ce constat.",
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
  finalCtaButtonLabel: "Reserver ma pause decouverte",
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
    "techWomenOfferImageUrl",
    "teacherPhotoUrl",
    "chairYogaTitle",
    "chairYogaText",
    "chairYogaItems",
    "chairYogaImageUrl",
    "heroSubtitle",
    "whyTitle",
    "whyParagraphs",
    "formatTitle",
    "formatText",
    "formatItems",
    "techWomenLabel",
    "techWomenTitle",
    "techWomenParagraphs",
    "techWomenCtaLabel",
    "offerCollectiveLabel",
    "offerCollectiveTitle",
    "offerCollectiveDescription",
    "offerCollectiveMeta",
    "offerTechLabel",
    "offerTechTitle",
    "offerTechDescription",
    "offerTechMeta",
    "offerIndividualLabel",
    "offerIndividualTitle",
    "offerIndividualDescription",
    "offerIndividualMeta",
    "entreprisesHeroTitle",
    "entreprisesHeroText",
    "entreprisesWhyTitle",
    "entreprisesWhyItems",
    "entreprisesHowTitle",
    "entreprisesHowItems",
    "entreprisesCtaLabel",
    "ateliersPageTitle",
    "ateliersPageIntro",
    "ateliersWorkshops",
    "ateliersAnnounceText",
    "ateliersSignupTitle",
    "ateliersSignupButtonLabel",
    "ateliersBlogTitle",
    "ateliersBlogIntro",
    "homepageSectionOrder",
    "reserverCollectiveWeekdays",
    "reserverTechWomenWeekdays",
    "reserverIndividualWeekdays",
    "reserverTechWomenMatch",
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
  techWomenOfferImageUrl: string;
  whyTitle: string;
  whyParagraphs: string;
  formatTitle: string;
  formatText: string;
  formatItems: string;
  techWomenLabel: string;
  techWomenTitle: string;
  techWomenParagraphs: string;
  techWomenCtaLabel: string;
  offerCollectiveLabel: string;
  offerCollectiveTitle: string;
  offerCollectiveDescription: string;
  offerCollectiveMeta: string;
  offerTechLabel: string;
  offerTechTitle: string;
  offerTechDescription: string;
  offerTechMeta: string;
  offerIndividualLabel: string;
  offerIndividualTitle: string;
  offerIndividualDescription: string;
  offerIndividualMeta: string;
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
  chairYogaImageUrl: string;
  entreprisesHeroTitle: string;
  entreprisesHeroText: string;
  entreprisesWhyTitle: string;
  entreprisesWhyItems: string;
  entreprisesHowTitle: string;
  entreprisesHowItems: string;
  entreprisesCtaLabel: string;
  ateliersPageTitle: string;
  ateliersPageIntro: string;
  ateliersWorkshops: string;
  ateliersAnnounceText: string;
  ateliersSignupTitle: string;
  ateliersSignupButtonLabel: string;
  ateliersBlogTitle: string;
  ateliersBlogIntro: string;
  homepageSectionOrder: string;
  reserverCollectiveWeekdays: string;
  reserverTechWomenWeekdays: string;
  reserverIndividualWeekdays: string;
  reserverTechWomenMatch: string;
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
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET chairYogaImageUrl = ?
     WHERE id = 1 AND (chairYogaImageUrl IS NULL OR chairYogaImageUrl = '')`,
    defaultLandingContent.chairYogaImageUrl,
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

async function upgradeColumnIfEmpty(column: string, value: string) {
  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent SET ${column} = ? WHERE id = 1 AND (${column} IS NULL OR ${column} = '')`,
    value,
  );
}

export async function upgradeExpandedSectionsIfEmpty() {
  await ensureLandingContentTable();

  const textColumns: Array<[keyof LandingContent, string]> = [
    ["techWomenLabel", defaultLandingContent.techWomenLabel],
    ["techWomenTitle", defaultLandingContent.techWomenTitle],
    ["techWomenCtaLabel", defaultLandingContent.techWomenCtaLabel],
    ["offerCollectiveLabel", defaultLandingContent.offerCollectiveLabel],
    ["offerCollectiveTitle", defaultLandingContent.offerCollectiveTitle],
    ["offerCollectiveDescription", defaultLandingContent.offerCollectiveDescription],
    ["offerTechLabel", defaultLandingContent.offerTechLabel],
    ["offerTechTitle", defaultLandingContent.offerTechTitle],
    ["offerTechDescription", defaultLandingContent.offerTechDescription],
    ["offerIndividualLabel", defaultLandingContent.offerIndividualLabel],
    ["offerIndividualTitle", defaultLandingContent.offerIndividualTitle],
    ["offerIndividualDescription", defaultLandingContent.offerIndividualDescription],
    ["entreprisesHeroTitle", defaultLandingContent.entreprisesHeroTitle],
    ["entreprisesHeroText", defaultLandingContent.entreprisesHeroText],
    ["entreprisesWhyTitle", defaultLandingContent.entreprisesWhyTitle],
    ["entreprisesHowTitle", defaultLandingContent.entreprisesHowTitle],
    ["entreprisesCtaLabel", defaultLandingContent.entreprisesCtaLabel],
    ["ateliersPageTitle", defaultLandingContent.ateliersPageTitle],
    ["ateliersPageIntro", defaultLandingContent.ateliersPageIntro],
    ["ateliersWorkshops", defaultLandingContent.ateliersWorkshops],
    ["ateliersAnnounceText", defaultLandingContent.ateliersAnnounceText],
    ["ateliersSignupTitle", defaultLandingContent.ateliersSignupTitle],
    ["ateliersSignupButtonLabel", defaultLandingContent.ateliersSignupButtonLabel],
    ["ateliersBlogTitle", defaultLandingContent.ateliersBlogTitle],
    ["ateliersBlogIntro", defaultLandingContent.ateliersBlogIntro],
    ["homepageSectionOrder", defaultLandingContent.homepageSectionOrder.join("\n")],
    ["reserverCollectiveWeekdays", defaultLandingContent.reserverCollectiveWeekdays.join("\n")],
    ["reserverTechWomenWeekdays", defaultLandingContent.reserverTechWomenWeekdays.join("\n")],
    ["reserverIndividualWeekdays", defaultLandingContent.reserverIndividualWeekdays.join("\n")],
    ["reserverTechWomenMatch", defaultLandingContent.reserverTechWomenMatch],
    ["techWomenOfferImageUrl", defaultLandingContent.techWomenOfferImageUrl],
  ];

  for (const [column, value] of textColumns) {
    await upgradeColumnIfEmpty(column, value);
  }

  const arrayColumns: Array<[keyof LandingContent, string[]]> = [
    ["techWomenParagraphs", defaultLandingContent.techWomenParagraphs],
    ["offerCollectiveMeta", defaultLandingContent.offerCollectiveMeta],
    ["offerTechMeta", defaultLandingContent.offerTechMeta],
    ["offerIndividualMeta", defaultLandingContent.offerIndividualMeta],
    ["entreprisesWhyItems", defaultLandingContent.entreprisesWhyItems],
    ["entreprisesHowItems", defaultLandingContent.entreprisesHowItems],
    ["homepageSectionOrder", defaultLandingContent.homepageSectionOrder],
    ["reserverCollectiveWeekdays", defaultLandingContent.reserverCollectiveWeekdays],
    ["reserverTechWomenWeekdays", defaultLandingContent.reserverTechWomenWeekdays],
    ["reserverIndividualWeekdays", defaultLandingContent.reserverIndividualWeekdays],
  ];

  for (const [column, value] of arrayColumns) {
    await upgradeColumnIfEmpty(column, value.join("\n"));
  }

  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET finalCtaButtonLabel = ?
     WHERE id = 1 AND finalCtaButtonLabel = 'Reserver une seance decouverte'`,
    defaultLandingContent.finalCtaButtonLabel,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE LandingContent
     SET teacherBioTitle = ?,
         teacherBioText = ?
     WHERE id = 1
       AND teacherBioText LIKE '%ancienne recruteuse IT et aujourd hui professeure de yoga certifiee en Hatha et Vinyasa%'`,
    defaultLandingContent.teacherBioTitle,
    defaultLandingContent.teacherBioText,
  );
}

export async function getLandingContent(): Promise<LandingContent> {
  await seedLandingContentIfMissing();
  await upgradeLegalTemplatesIfNeeded();
  await upgradeOfferImagesIfEmpty();
  await upgradeCollectiveOfferImageIfLegacy();
  await upgradeHomeSectionsIfEmpty();
  await upgradeExpandedSectionsIfEmpty();
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
    formatText: row.formatText ?? defaultLandingContent.formatText,
    formatItems: parseItems(row.formatItems, defaultLandingContent.formatItems),
    techWomenLabel: row.techWomenLabel || defaultLandingContent.techWomenLabel,
    techWomenTitle: row.techWomenTitle || defaultLandingContent.techWomenTitle,
    techWomenParagraphs: parseItems(
      row.techWomenParagraphs,
      defaultLandingContent.techWomenParagraphs,
    ),
    techWomenCtaLabel: row.techWomenCtaLabel || defaultLandingContent.techWomenCtaLabel,
    offerCollectiveLabel:
      row.offerCollectiveLabel || defaultLandingContent.offerCollectiveLabel,
    offerCollectiveTitle:
      row.offerCollectiveTitle || defaultLandingContent.offerCollectiveTitle,
    offerCollectiveDescription:
      row.offerCollectiveDescription || defaultLandingContent.offerCollectiveDescription,
    offerCollectiveMeta: parseItems(
      row.offerCollectiveMeta,
      defaultLandingContent.offerCollectiveMeta,
    ),
    techWomenOfferImageUrl:
      row.techWomenOfferImageUrl || defaultLandingContent.techWomenOfferImageUrl,
    offerTechLabel: row.offerTechLabel || defaultLandingContent.offerTechLabel,
    offerTechTitle: row.offerTechTitle || defaultLandingContent.offerTechTitle,
    offerTechDescription:
      row.offerTechDescription || defaultLandingContent.offerTechDescription,
    offerTechMeta: parseItems(row.offerTechMeta, defaultLandingContent.offerTechMeta),
    offerIndividualLabel:
      row.offerIndividualLabel || defaultLandingContent.offerIndividualLabel,
    offerIndividualTitle:
      row.offerIndividualTitle || defaultLandingContent.offerIndividualTitle,
    offerIndividualDescription:
      row.offerIndividualDescription || defaultLandingContent.offerIndividualDescription,
    offerIndividualMeta: parseItems(
      row.offerIndividualMeta,
      defaultLandingContent.offerIndividualMeta,
    ),
    heroImage1Url: row.heroImage1Url?.trim() || defaultLandingContent.heroImage1Url,
    heroImage2Url: row.heroImage2Url?.trim() || defaultLandingContent.heroImage2Url,
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
    chairYogaImageUrl:
      row.chairYogaImageUrl?.trim() || defaultLandingContent.chairYogaImageUrl,
    entreprisesHeroTitle:
      row.entreprisesHeroTitle || defaultLandingContent.entreprisesHeroTitle,
    entreprisesHeroText: row.entreprisesHeroText || defaultLandingContent.entreprisesHeroText,
    entreprisesWhyTitle: row.entreprisesWhyTitle || defaultLandingContent.entreprisesWhyTitle,
    entreprisesWhyItems: parseItems(
      row.entreprisesWhyItems,
      defaultLandingContent.entreprisesWhyItems,
    ),
    entreprisesHowTitle: row.entreprisesHowTitle || defaultLandingContent.entreprisesHowTitle,
    entreprisesHowItems: parseItems(
      row.entreprisesHowItems,
      defaultLandingContent.entreprisesHowItems,
    ),
    entreprisesCtaLabel: row.entreprisesCtaLabel || defaultLandingContent.entreprisesCtaLabel,
    ateliersPageTitle: row.ateliersPageTitle || defaultLandingContent.ateliersPageTitle,
    ateliersPageIntro: row.ateliersPageIntro || defaultLandingContent.ateliersPageIntro,
    ateliersWorkshops: row.ateliersWorkshops || defaultLandingContent.ateliersWorkshops,
    ateliersAnnounceText: row.ateliersAnnounceText || defaultLandingContent.ateliersAnnounceText,
    ateliersSignupTitle: row.ateliersSignupTitle || defaultLandingContent.ateliersSignupTitle,
    ateliersSignupButtonLabel:
      row.ateliersSignupButtonLabel || defaultLandingContent.ateliersSignupButtonLabel,
    ateliersBlogTitle: row.ateliersBlogTitle || defaultLandingContent.ateliersBlogTitle,
    ateliersBlogIntro: row.ateliersBlogIntro || defaultLandingContent.ateliersBlogIntro,
    homepageSectionOrder: resolveHomepageSectionOrder(
      parseItems(row.homepageSectionOrder, defaultLandingContent.homepageSectionOrder),
    ),
    reserverCollectiveWeekdays: parseItems(
      row.reserverCollectiveWeekdays,
      defaultLandingContent.reserverCollectiveWeekdays,
    ),
    reserverTechWomenWeekdays: parseItems(
      row.reserverTechWomenWeekdays,
      defaultLandingContent.reserverTechWomenWeekdays,
    ),
    reserverIndividualWeekdays: parseItems(
      row.reserverIndividualWeekdays,
      defaultLandingContent.reserverIndividualWeekdays,
    ),
    reserverTechWomenMatch:
      row.reserverTechWomenMatch || defaultLandingContent.reserverTechWomenMatch,
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
         techWomenOfferImageUrl = ?,
         whyTitle = ?,
         whyParagraphs = ?,
         formatTitle = ?,
         formatText = ?,
         formatItems = ?,
         techWomenLabel = ?,
         techWomenTitle = ?,
         techWomenParagraphs = ?,
         techWomenCtaLabel = ?,
         offerCollectiveLabel = ?,
         offerCollectiveTitle = ?,
         offerCollectiveDescription = ?,
         offerCollectiveMeta = ?,
         offerTechLabel = ?,
         offerTechTitle = ?,
         offerTechDescription = ?,
         offerTechMeta = ?,
         offerIndividualLabel = ?,
         offerIndividualTitle = ?,
         offerIndividualDescription = ?,
         offerIndividualMeta = ?,
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
         chairYogaImageUrl = ?,
         entreprisesHeroTitle = ?,
         entreprisesHeroText = ?,
         entreprisesWhyTitle = ?,
         entreprisesWhyItems = ?,
         entreprisesHowTitle = ?,
         entreprisesHowItems = ?,
         entreprisesCtaLabel = ?,
         ateliersPageTitle = ?,
         ateliersPageIntro = ?,
         ateliersWorkshops = ?,
         ateliersAnnounceText = ?,
         ateliersSignupTitle = ?,
         ateliersSignupButtonLabel = ?,
         ateliersBlogTitle = ?,
         ateliersBlogIntro = ?,
         homepageSectionOrder = ?,
         reserverCollectiveWeekdays = ?,
         reserverTechWomenWeekdays = ?,
         reserverIndividualWeekdays = ?,
         reserverTechWomenMatch = ?,
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
    content.techWomenOfferImageUrl,
    content.whyTitle,
    content.whyParagraphs.join("\n"),
    content.formatTitle,
    content.formatText,
    content.formatItems.join("\n"),
    content.techWomenLabel,
    content.techWomenTitle,
    content.techWomenParagraphs.join("\n"),
    content.techWomenCtaLabel,
    content.offerCollectiveLabel,
    content.offerCollectiveTitle,
    content.offerCollectiveDescription,
    content.offerCollectiveMeta.join("\n"),
    content.offerTechLabel,
    content.offerTechTitle,
    content.offerTechDescription,
    content.offerTechMeta.join("\n"),
    content.offerIndividualLabel,
    content.offerIndividualTitle,
    content.offerIndividualDescription,
    content.offerIndividualMeta.join("\n"),
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
    content.chairYogaImageUrl,
    content.entreprisesHeroTitle,
    content.entreprisesHeroText,
    content.entreprisesWhyTitle,
    content.entreprisesWhyItems.join("\n"),
    content.entreprisesHowTitle,
    content.entreprisesHowItems.join("\n"),
    content.entreprisesCtaLabel,
    content.ateliersPageTitle,
    content.ateliersPageIntro,
    content.ateliersWorkshops,
    content.ateliersAnnounceText,
    content.ateliersSignupTitle,
    content.ateliersSignupButtonLabel,
    content.ateliersBlogTitle,
    content.ateliersBlogIntro,
    content.homepageSectionOrder.join("\n"),
    content.reserverCollectiveWeekdays.join("\n"),
    content.reserverTechWomenWeekdays.join("\n"),
    content.reserverIndividualWeekdays.join("\n"),
    content.reserverTechWomenMatch,
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
