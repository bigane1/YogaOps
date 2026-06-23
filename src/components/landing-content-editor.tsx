"use client";

import { ImageUpload } from "@/components/image-upload";
import { LandingBlockForm } from "@/components/landing-block-form";
import type { LandingContent } from "@/lib/landing-content";

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
      <div className="mt-4 rounded-lg border border-[var(--border-soft)] bg-[var(--beige)]/50 p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--foreground)]">Chaque section a son bouton d enregistrement</p>
        <p className="mt-2">
          Modifiez un bloc, cliquez « Enregistrer ce bloc », confirmez dans la popup. Les photos JPEG,
          PNG ou WebP (max 5 Mo) doivent etre enregistrees avec le bloc correspondant.
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
        <ImageUpload
          name="heroImage1Url"
          label="Photo principale (grande image hero)"
          currentUrl={landing.heroImage1Url}
          className={fieldMd}
        />
        <ImageUpload
          name="heroImage2Url"
          label="Photo secondaire (section entreprise / fallback)"
          currentUrl={landing.heroImage2Url}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="offerImages" title="Images offres yoga" className="mt-8 grid gap-3">
        <BlockHeading>Images offres yoga</BlockHeading>
        <ImageUpload
          name="collectiveOfferImageUrl"
          label="Image cours collectif (en ligne)"
          currentUrl={landing.collectiveOfferImageUrl}
          className={fieldMd}
        />
        <ImageUpload
          name="individualOfferImageUrl"
          label="Image cours individuel (visio / telephone)"
          currentUrl={landing.individualOfferImageUrl}
          className={fieldMd}
        />
        <ImageUpload
          name="presentielOfferImageUrl"
          label="Image cours presentiel (Poissy)"
          currentUrl={landing.presentielOfferImageUrl}
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

      <LandingBlockForm blockId="formats" title="Formats / offre" className="mt-8 grid gap-3">
        <BlockHeading>Formats / offre</BlockHeading>
        <FieldLabel>Titre section formats</FieldLabel>
        <input name="formatTitle" defaultValue={landing.formatTitle} className={fieldMd} />
        <FieldLabel>Texte sous les formats</FieldLabel>
        <textarea name="formatText" defaultValue={landing.formatText} rows={2} className={fieldMd} />
        <FieldLabel>Formats (1 ligne = 1 pastille)</FieldLabel>
        <textarea
          name="formatItems"
          defaultValue={landing.formatItems.join("\n")}
          rows={4}
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

      <LandingBlockForm blockId="chairYoga" title="Yoga en entreprise" className="mt-8 grid gap-3">
        <BlockHeading>Yoga sur chaise (section entreprise)</BlockHeading>
        <FieldLabel>Titre de la section</FieldLabel>
        <input name="chairYogaTitle" defaultValue={landing.chairYogaTitle} className={fieldMd} />
        <FieldLabel>Description</FieldLabel>
        <textarea name="chairYogaText" defaultValue={landing.chairYogaText} rows={3} className={fieldMd} />
        <FieldLabel>Benefices (1 ligne = 1 point)</FieldLabel>
        <textarea
          name="chairYogaItems"
          defaultValue={landing.chairYogaItems.join("\n")}
          rows={5}
          className={fieldMd}
        />
      </LandingBlockForm>

      <LandingBlockForm blockId="teacherBio" title="Bio du professeur" className="mt-8 grid gap-3">
        <BlockHeading>Bio du professeur</BlockHeading>
        <ImageUpload
          name="teacherPhotoUrl"
          label="Photo du professeur"
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
