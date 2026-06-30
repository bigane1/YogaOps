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
          homepageHint="Page d accueil : carte « Cours presentiel »"
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
        <BlockHeading>Yoga en entreprise (carte offres + page Entreprises)</BlockHeading>
        <FieldLabel>Titre de la section</FieldLabel>
        <input name="chairYogaTitle" defaultValue={landing.chairYogaTitle} className={fieldMd} />
        <FieldLabel>Description</FieldLabel>
        <textarea name="chairYogaText" defaultValue={landing.chairYogaText} rows={3} className={fieldMd} />
        <ImageUpload
          key={`chair-yoga-${landing.chairYogaImageUrl}`}
          name="chairYogaImageUrl"
          label="Image Yoga en entreprise"
          homepageHint="Page d accueil : carte « Yoga en entreprise » + page /entreprises"
          currentUrl={landing.chairYogaImageUrl}
          className={fieldMd}
        />
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
