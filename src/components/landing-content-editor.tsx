"use client";

import { ImageUpload } from "@/components/image-upload";
import { LandingBlockForm } from "@/components/landing-block-form";
import type { LandingContent } from "@/lib/landing-content";
import { HOMEPAGE_SECTION_IDS, HOMEPAGE_SECTION_LABELS } from "@/lib/homepage-sections-config";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-[var(--brand)]">{children}</p>;
}

function BlockHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{children}</p>
  );
}

type LandingContentEditorProps = {
  landing: LandingContent;
};

export function LandingContentEditor({ landing }: LandingContentEditorProps) {
  return (
    <div>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">Important : pas la section Blog</p>
        <p className="mt-2">
          Les images de la <strong>page d accueil</strong> sont modifiees ici, dans « Landing page ».
          La section <strong>Blog</strong> en haut de page ne change que les articles du blog, pas
          l accueil.
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-[var(--border-soft)] bg-[var(--beige)]/50 p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--foreground)]">Chaque section a son bouton d enregistrement</p>
        <p className="mt-2">
          1. Choisissez la photo et attendez la miniature. 2. Cliquez « Enregistrer ce bloc » dans la
          meme section (Hero, Images offres, Bio prof, etc.).
        </p>
      </div>

      <LandingBlockForm blockId="hero" title="Hero (bandeau d accueil)" className="mt-6 grid gap-3">
        <BlockHeading>Hero (bandeau d accueil)</BlockHeading>
        <FieldLabel>Titre principal</FieldLabel>
        <input name="heroTitle" defaultValue={landing.heroTitle} className={fieldMd} />
        <FieldLabel>Sous-titre (parenthese…)</FieldLabel>
        <input name="heroSubtitle" defaultValue={landing.heroSubtitle} className={fieldMd} />
        <FieldLabel>Texte d introduction</FieldLabel>
        <textarea name="heroIntro" defaultValue={landing.heroIntro} rows={3} className={fieldMd} />
        <FieldLabel>Phrase sous le bouton (ex. Premiere seance offerte)</FieldLabel>
        <input name="firstSessionOffer" defaultValue={landing.firstSessionOffer} className={fieldMd} />
        <FieldLabel>Libelle du bouton principal</FieldLabel>
        <input name="finalCtaButtonLabel" defaultValue={landing.finalCtaButtonLabel} className={fieldMd} />
        <ImageUpload
          key={`hero-1-${landing.heroImage1Url}`}
          name="heroImage1Url"
          label="Photo principale (grande image hero)"
          homepageHint="Page d accueil : grande photo a droite du titre principal"
          currentUrl={landing.heroImage1Url}
          className={fieldMd}
        />
        <ImageUpload
          key={`hero-2-${landing.heroImage2Url}`}
          name="heroImage2Url"
          label="Photo secondaire hero"
          homepageHint="Bandeau d accueil : affichee si la photo principale est encore l image par defaut. Sinon section A propos."
          currentUrl={landing.heroImage2Url}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="offerImages" title="Images offres yoga" className="mt-8 grid gap-3">
        <BlockHeading>Images offres yoga</BlockHeading>
        <ImageUpload
          key={`collective-${landing.collectiveOfferImageUrl}`}
          name="collectiveOfferImageUrl"
          label="Image cours collectif (en ligne)"
          homepageHint="Page d accueil : carte « Cours collectifs en ligne »"
          currentUrl={landing.collectiveOfferImageUrl}
          className={fieldMd}
        />
        <ImageUpload
          key={`individual-${landing.individualOfferImageUrl}`}
          name="individualOfferImageUrl"
          label="Image cours individuel (visio / telephone)"
          homepageHint="Page d accueil : carte « Cours individuel »"
          currentUrl={landing.individualOfferImageUrl}
          className={fieldMd}
        />
        <ImageUpload
          key={`presentiel-${landing.presentielOfferImageUrl}`}
          name="presentielOfferImageUrl"
          label="Image cours presentiel (Poissy)"
          homepageHint="Page d accueil : carte accompagnement individuel (presentiel)"
          currentUrl={landing.presentielOfferImageUrl}
          className={fieldMd}
        />
        <ImageUpload
          key={`tech-women-offer-${landing.techWomenOfferImageUrl}`}
          name="techWomenOfferImageUrl"
          label="Image Seance Femmes Tech"
          homepageHint="Page d accueil : carte « Seance Femmes Tech »"
          currentUrl={landing.techWomenOfferImageUrl}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="homepageLayout" title="Ordre page accueil" className="mt-8 grid gap-3">
        <BlockHeading>Ordre des sections (page d accueil)</BlockHeading>
        <p className="text-xs text-[var(--muted)]">
          Une ligne = une section. Utilisez les identifiants ci-dessous, dans l ordre souhaite.
        </p>
        <ul className="grid gap-1 rounded-md border border-[var(--border-soft)] bg-white/60 p-3 text-xs text-[var(--muted)]">
          {HOMEPAGE_SECTION_IDS.map((id) => (
            <li key={id}>
              <code className="text-[var(--foreground)]">{id}</code> — {HOMEPAGE_SECTION_LABELS[id]}
            </li>
          ))}
        </ul>
        <FieldLabel>Ordre des blocs (1 ligne = 1 section)</FieldLabel>
        <textarea
          name="homepageSectionOrder"
          defaultValue={landing.homepageSectionOrder.join("\n")}
          rows={9}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="reserver" title="Page Reserver" className="mt-8 grid gap-3">
        <BlockHeading>Page Reserver (/reserver)</BlockHeading>
        <p className="text-xs text-[var(--muted)]">
          Jours visibles dans le calendrier par type de cours (1 ligne = 1 jour : lundi, mardi, mercredi…).
          Laissez vide pour n&apos;afficher que les jours avec un creneau publie dans « Cours &amp; creneaux ».
          Les jours avec creneau restent toujours visibles, meme hors de cette liste.
        </p>
        <FieldLabel>Seances collectives — jours affiches</FieldLabel>
        <textarea
          name="reserverCollectiveWeekdays"
          defaultValue={landing.reserverCollectiveWeekdays.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Seance Femmes Tech — jours affiches</FieldLabel>
        <textarea
          name="reserverTechWomenWeekdays"
          defaultValue={landing.reserverTechWomenWeekdays.join("\n")}
          rows={3}
          className={fieldMd}
        />
        <FieldLabel>Accompagnement individuel — jours affiches</FieldLabel>
        <textarea
          name="reserverIndividualWeekdays"
          defaultValue={landing.reserverIndividualWeekdays.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Mot-cle pour reconnaitre le cours Femmes Tech (dans le titre)</FieldLabel>
        <input
          name="reserverTechWomenMatch"
          defaultValue={landing.reserverTechWomenMatch}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="techWomen" title="Femmes de la tech" className="mt-8 grid gap-3">
        <BlockHeading>Femmes de la tech (page d accueil)</BlockHeading>
        <FieldLabel>Libelle de section</FieldLabel>
        <input name="techWomenLabel" defaultValue={landing.techWomenLabel} className={fieldMd} />
        <FieldLabel>Titre</FieldLabel>
        <input name="techWomenTitle" defaultValue={landing.techWomenTitle} className={fieldMd} />
        <FieldLabel>Paragraphes (1 ligne = 1 paragraphe)</FieldLabel>
        <textarea
          name="techWomenParagraphs"
          defaultValue={landing.techWomenParagraphs.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Libelle du bouton</FieldLabel>
        <input name="techWomenCtaLabel" defaultValue={landing.techWomenCtaLabel} className={fieldMd} />
      </LandingBlockForm>

      <LandingBlockForm blockId="offers" title="Offres / formats" className="mt-8 grid gap-3">
        <BlockHeading>Offres / formats (page d accueil)</BlockHeading>
        <FieldLabel>Titre de section</FieldLabel>
        <input name="formatTitle" defaultValue={landing.formatTitle} className={fieldMd} />
        <FieldLabel>Texte sous le titre (optionnel)</FieldLabel>
        <textarea name="formatText" defaultValue={landing.formatText} rows={2} className={fieldMd} />
        <FieldLabel>Collectif — libelle carte</FieldLabel>
        <input name="offerCollectiveLabel" defaultValue={landing.offerCollectiveLabel} className={fieldMd} />
        <FieldLabel>Collectif — titre</FieldLabel>
        <input name="offerCollectiveTitle" defaultValue={landing.offerCollectiveTitle} className={fieldMd} />
        <FieldLabel>Collectif — description</FieldLabel>
        <textarea
          name="offerCollectiveDescription"
          defaultValue={landing.offerCollectiveDescription}
          rows={2}
          className={fieldMd}
        />
        <FieldLabel>Collectif — infos (1 ligne = 1 pastille)</FieldLabel>
        <textarea
          name="offerCollectiveMeta"
          defaultValue={landing.offerCollectiveMeta.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Femmes Tech — libelle carte</FieldLabel>
        <input name="offerTechLabel" defaultValue={landing.offerTechLabel} className={fieldMd} />
        <FieldLabel>Femmes Tech — titre</FieldLabel>
        <input name="offerTechTitle" defaultValue={landing.offerTechTitle} className={fieldMd} />
        <FieldLabel>Femmes Tech — description</FieldLabel>
        <textarea
          name="offerTechDescription"
          defaultValue={landing.offerTechDescription}
          rows={2}
          className={fieldMd}
        />
        <FieldLabel>Femmes Tech — infos (1 ligne = 1 pastille)</FieldLabel>
        <textarea
          name="offerTechMeta"
          defaultValue={landing.offerTechMeta.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Individuel — libelle carte</FieldLabel>
        <input name="offerIndividualLabel" defaultValue={landing.offerIndividualLabel} className={fieldMd} />
        <FieldLabel>Individuel — titre</FieldLabel>
        <input name="offerIndividualTitle" defaultValue={landing.offerIndividualTitle} className={fieldMd} />
        <FieldLabel>Individuel — description</FieldLabel>
        <textarea
          name="offerIndividualDescription"
          defaultValue={landing.offerIndividualDescription}
          rows={2}
          className={fieldMd}
        />
        <FieldLabel>Individuel — infos (1 ligne = 1 pastille)</FieldLabel>
        <textarea
          name="offerIndividualMeta"
          defaultValue={landing.offerIndividualMeta.join("\n")}
          rows={3}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="why" title="Pourquoi YogaOps" className="mt-8 grid gap-3">
        <BlockHeading>Pourquoi YogaOps</BlockHeading>
        <FieldLabel>Titre section</FieldLabel>
        <input name="whyTitle" defaultValue={landing.whyTitle} className={fieldMd} />
        <FieldLabel>Paragraphes (1 ligne = 1 paragraphe)</FieldLabel>
        <textarea
          name="whyParagraphs"
          defaultValue={landing.whyParagraphs.join("\n")}
          rows={4}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="benefits" title="Benefices" className="mt-8 grid gap-3">
        <BlockHeading>Benefices</BlockHeading>
        <FieldLabel>Titre section benefices</FieldLabel>
        <input name="practicalInfoTitle" defaultValue={landing.practicalInfoTitle} className={fieldMd} />
        <FieldLabel>Liste des benefices (1 ligne = 1 point)</FieldLabel>
        <textarea
          name="practicalInfoItems"
          defaultValue={landing.practicalInfoItems.join("\n")}
          rows={5}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="testimonials" title="Temoignages" className="mt-8 grid gap-3">
        <BlockHeading>Temoignages</BlockHeading>
        <FieldLabel>Titre temoignages</FieldLabel>
        <input name="socialProofTitle" defaultValue={landing.socialProofTitle} className={fieldMd} />
        <FieldLabel>Citations (1 ligne = 1 temoignage)</FieldLabel>
        <textarea
          name="socialProofItems"
          defaultValue={landing.socialProofItems.join("\n")}
          rows={4}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="entreprises" title="Page Entreprises" className="mt-8 grid gap-3">
        <BlockHeading>Page Entreprises (/entreprises)</BlockHeading>
        <FieldLabel>Titre principal</FieldLabel>
        <input name="entreprisesHeroTitle" defaultValue={landing.entreprisesHeroTitle} className={fieldMd} />
        <FieldLabel>Texte d introduction</FieldLabel>
        <textarea
          name="entreprisesHeroText"
          defaultValue={landing.entreprisesHeroText}
          rows={3}
          className={fieldMd}
        />
        <FieldLabel>Titre « Pourquoi »</FieldLabel>
        <input name="entreprisesWhyTitle" defaultValue={landing.entreprisesWhyTitle} className={fieldMd} />
        <FieldLabel>Points « Pourquoi » (1 ligne = 1 point)</FieldLabel>
        <textarea
          name="entreprisesWhyItems"
          defaultValue={landing.entreprisesWhyItems.join("\n")}
          rows={5}
          className={fieldMd}
        />
        <FieldLabel>Titre « Comment ca fonctionne »</FieldLabel>
        <input name="entreprisesHowTitle" defaultValue={landing.entreprisesHowTitle} className={fieldMd} />
        <FieldLabel>Points « Comment » (1 ligne = 1 point)</FieldLabel>
        <textarea
          name="entreprisesHowItems"
          defaultValue={landing.entreprisesHowItems.join("\n")}
          rows={4}
          className={fieldMd}
        />
        <FieldLabel>Libelle du bouton CTA</FieldLabel>
        <input name="entreprisesCtaLabel" defaultValue={landing.entreprisesCtaLabel} className={fieldMd} />
        <ImageUpload
          key={`entreprises-${landing.chairYogaImageUrl}`}
          name="chairYogaImageUrl"
          label="Image page Entreprises"
          homepageHint="Page /entreprises : image principale"
          currentUrl={landing.chairYogaImageUrl}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="ateliers" title="Page Ateliers" className="mt-8 grid gap-3">
        <BlockHeading>Page Ateliers (/ateliers)</BlockHeading>
        <FieldLabel>Titre principal</FieldLabel>
        <input name="ateliersPageTitle" defaultValue={landing.ateliersPageTitle} className={fieldMd} />
        <FieldLabel>Introduction</FieldLabel>
        <textarea name="ateliersPageIntro" defaultValue={landing.ateliersPageIntro} rows={2} className={fieldMd} />
        <FieldLabel>
          Ateliers (1 ligne = 1 atelier, format : Titre|Description)
        </FieldLabel>
        <textarea name="ateliersWorkshops" defaultValue={landing.ateliersWorkshops} rows={5} className={fieldMd} />
        <FieldLabel>Texte annonce prochaines dates</FieldLabel>
        <textarea
          name="ateliersAnnounceText"
          defaultValue={landing.ateliersAnnounceText}
          rows={2}
          className={fieldMd}
        />
        <FieldLabel>Titre formulaire inscription</FieldLabel>
        <input name="ateliersSignupTitle" defaultValue={landing.ateliersSignupTitle} className={fieldMd} />
        <FieldLabel>Libelle bouton formulaire</FieldLabel>
        <input
          name="ateliersSignupButtonLabel"
          defaultValue={landing.ateliersSignupButtonLabel}
          className={fieldMd}
        />
        <FieldLabel>Titre section blog</FieldLabel>
        <input name="ateliersBlogTitle" defaultValue={landing.ateliersBlogTitle} className={fieldMd} />
        <FieldLabel>Introduction section blog</FieldLabel>
        <textarea name="ateliersBlogIntro" defaultValue={landing.ateliersBlogIntro} rows={2} className={fieldMd} />
      </LandingBlockForm>

      <LandingBlockForm blockId="teacherBio" title="Bio du professeur" className="mt-8 grid gap-3">
        <BlockHeading>Bio du professeur</BlockHeading>
        <ImageUpload
          key={`teacher-${landing.teacherPhotoUrl}`}
          name="teacherPhotoUrl"
          label="Photo du professeur"
          homepageHint="Page d accueil : section « A propos » (prioritaire sur la photo secondaire hero)"
          currentUrl={landing.teacherPhotoUrl}
          shape="circle"
        />
        <FieldLabel>Titre</FieldLabel>
        <input name="teacherBioTitle" defaultValue={landing.teacherBioTitle} className={fieldMd} />
        <FieldLabel>Texte a propos (paragraphes separes par une ligne vide)</FieldLabel>
        <textarea name="teacherBioText" defaultValue={landing.teacherBioText} rows={5} className={fieldMd} />
      </LandingBlockForm>

      <LandingBlockForm blockId="ctaFooter" title="CTA et pied de page" className="mt-8 grid gap-3">
        <BlockHeading>Appel a l action + pied de page</BlockHeading>
        <FieldLabel>Titre CTA</FieldLabel>
        <input name="finalCtaTitle" defaultValue={landing.finalCtaTitle} className={fieldMd} />
        <FieldLabel>Texte sous le titre CTA</FieldLabel>
        <textarea name="finalCtaText" defaultValue={landing.finalCtaText} rows={2} className={fieldMd} />
        <FieldLabel>Libelle du bouton CTA</FieldLabel>
        <input name="finalCtaButtonLabel" defaultValue={landing.finalCtaButtonLabel} className={fieldMd} />
        <FieldLabel>Adresse (footer)</FieldLabel>
        <input name="footerAddress" defaultValue={landing.footerAddress} className={fieldMd} />
        <FieldLabel>Telephone</FieldLabel>
        <input name="footerPhone" defaultValue={landing.footerPhone} className={fieldMd} />
        <FieldLabel>Email</FieldLabel>
        <input name="footerEmail" defaultValue={landing.footerEmail} className={fieldMd} />
        <FieldLabel>URL Facebook</FieldLabel>
        <input name="facebookUrl" defaultValue={landing.facebookUrl} className={fieldMd} />
        <FieldLabel>URL Instagram</FieldLabel>
        <input name="instagramUrl" defaultValue={landing.instagramUrl} className={fieldMd} />
        <FieldLabel>URL TikTok</FieldLabel>
        <input name="tiktokUrl" defaultValue={landing.tiktokUrl} className={fieldMd} />
        <FieldLabel>URL LinkedIn</FieldLabel>
        <input name="linkedinUrl" defaultValue={landing.linkedinUrl} className={fieldMd} />
        <FieldLabel>Contenu CGV</FieldLabel>
        <textarea name="cgvContent" defaultValue={landing.cgvContent} rows={6} className={fieldMd} />
        <FieldLabel>Contenu CGU</FieldLabel>
        <textarea name="cguContent" defaultValue={landing.cguContent} rows={6} className={fieldMd} />
        <FieldLabel>Mentions legales</FieldLabel>
        <textarea
          name="legalNoticeContent"
          defaultValue={landing.legalNoticeContent}
          rows={6}
          className={fieldMd}
        />
      </LandingBlockForm>
    </div>
  );
}
