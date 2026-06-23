export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { ImageUpload } from "@/components/image-upload";
import { cookies } from "next/headers";
import {
  adminLogin,
  adminLogout,
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  updateLandingContent,
} from "@/app/actions";
import { listAdminBlogPosts } from "@/lib/blog";
import { ensureSeedData, addDays, startOfDay } from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-[var(--brand)]">{children}</p>;
}

type AdminPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { saved } = await searchParams;
  await ensureSeedData();
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";

  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Backoffice prof
          </h1>
          <p className="mt-2 opacity-90">
            Entrez le code admin pour gerer cours, creneaux et abonnements.
          </p>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input
              name="pin"
              type="password"
              required
              placeholder="Code admin"
              className={fieldMd + " w-full"}
            />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const [
    coursesCount,
    slotsCount,
    bookingsPendingCount,
    subscriptionsActiveCount,
    landing,
    blogPosts,
  ] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.timeSlot.count({ where: { startsAt: { gte: today, lt: weekEnd } } }),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    getLandingContent(),
    listAdminBlogPosts(),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Backoffice prof
        </h1>
        <p className="mt-2 opacity-90">Gestion complete des cours YogaOps.</p>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button
            type="submit"
            className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm"
          >
            Deconnexion
          </button>
        </form>

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Blog (editable)
          </h2>
          <form action={createBlogPost} className="mt-4 grid gap-2">
            <input name="title" required placeholder="Titre article" className={fieldMd} />
            <input name="excerpt" required placeholder="Resume court" className={fieldMd} />
            <textarea name="content" required rows={5} placeholder="Contenu" className={fieldMd} />
            <ImageUpload name="coverImage" label="Image de couverture (optionnel)" className={fieldMd} />
            <select name="isPublished" className={fieldMd}>
              <option value="1">Publie</option>
              <option value="0">Brouillon</option>
            </select>
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Ajouter article
            </button>
          </form>

          <ul className="mt-4 space-y-3 text-sm">
            {blogPosts.map((post) => (
              <li key={post.id} className="brand-list-item p-3">
                <form action={updateBlogPost} className="grid gap-2">
                  <input type="hidden" name="id" value={post.id} />
                  <input name="title" defaultValue={post.title} className={fieldSm} />
                  <input name="excerpt" defaultValue={post.excerpt} className={fieldSm} />
                  <textarea
                    name="content"
                    defaultValue={post.content}
                    rows={4}
                    className={fieldSm}
                  />
                  <ImageUpload
                    name="coverImage"
                    label="Image de couverture"
                    currentUrl={post.coverImage ?? ""}
                    className={fieldSm}
                  />
                  <select
                    name="isPublished"
                    defaultValue={post.isPublished ? "1" : "0"}
                    className={fieldSm}
                  >
                    <option value="1">Publie</option>
                    <option value="0">Brouillon</option>
                  </select>
                  <button
                    type="submit"
                    className="brand-btn brand-btn-sm w-fit rounded px-3 py-1 text-white"
                  >
                    Modifier
                  </button>
                </form>
                <form action={deleteBlogPost} className="mt-2">
                  <input type="hidden" name="id" value={post.id} />
                  <button
                    type="submit"
                    className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Landing page (editable)
          </h2>
          {saved === "landing" ? (
            <p className="brand-badge-ok mt-3 rounded-lg px-3 py-2 text-sm font-medium">
              Contenu enregistre. Verifiez la page d accueil (rafraichir si besoin).
            </p>
          ) : null}
          <div className="mt-4 rounded-lg border border-[var(--border-soft)] bg-[var(--beige)]/50 p-4 text-sm text-[var(--muted)]">
            <p className="font-medium text-[var(--foreground)]">Photos : 2 etapes obligatoires</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Cliquez « Choisir depuis l ordi » et attendez la miniature.</li>
              <li>Descendez et cliquez « Enregistrer le contenu » (sinon rien est sauvegarde).</li>
            </ol>
            <p className="mt-2 text-xs">
              Formats acceptes : JPEG, PNG, WebP. Si la photo iPhone refuse, exportez en JPG avant.
            </p>
          </div>
          <form action={updateLandingContent} className="mt-4 grid gap-3">
            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Hero (bandeau d accueil)
            </p>
            <FieldLabel>Titre principal</FieldLabel>
            <input name="heroTitle" defaultValue={landing.heroTitle} className={fieldMd} />
            <FieldLabel>Sous-titre (parenthese…)</FieldLabel>
            <input name="heroSubtitle" defaultValue={landing.heroSubtitle} className={fieldMd} />
            <FieldLabel>Texte d introduction</FieldLabel>
            <textarea
              name="heroIntro"
              defaultValue={landing.heroIntro}
              rows={3}
              className={fieldMd}
            />
            <FieldLabel>Phrase sous le bouton (ex. Premiere seance offerte)</FieldLabel>
            <input
              name="firstSessionOffer"
              defaultValue={landing.firstSessionOffer}
              className={fieldMd}
            />
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
            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Images offres yoga
            </p>
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
            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Pourquoi YogaOps
            </p>
            <FieldLabel>Titre section</FieldLabel>
            <input name="whyTitle" defaultValue={landing.whyTitle} className={fieldMd} />
            <FieldLabel>Paragraphes (1 ligne = 1 paragraphe)</FieldLabel>
            <textarea
              name="whyParagraphs"
              defaultValue={landing.whyParagraphs.join("\n")}
              rows={4}
              className={fieldMd}
            />

            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Benefices
            </p>
            <FieldLabel>Titre section benefices</FieldLabel>
            <input
              name="practicalInfoTitle"
              defaultValue={landing.practicalInfoTitle}
              className={fieldMd}
            />
            <FieldLabel>Liste des benefices (1 ligne = 1 point)</FieldLabel>
            <textarea
              name="practicalInfoItems"
              defaultValue={landing.practicalInfoItems.join("\n")}
              rows={5}
              className={fieldMd}
            />

            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Formats / offre
            </p>
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

            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Temoignages
            </p>
            <FieldLabel>Titre temoignages</FieldLabel>
            <input
              name="socialProofTitle"
              defaultValue={landing.socialProofTitle}
              className={fieldMd}
            />
            <FieldLabel>Citations (1 ligne = 1 temoignage)</FieldLabel>
            <textarea
              name="socialProofItems"
              defaultValue={landing.socialProofItems.join("\n")}
              rows={4}
              className={fieldMd}
            />

            {/* legacy fields kept in DB but hidden from form */}
            <input type="hidden" name="specializationMessage" value={landing.specializationMessage} />
            <input type="hidden" name="fatigueMessage" value={landing.fatigueMessage} />
            <input type="hidden" name="enterpriseMessage" value={landing.enterpriseMessage} />
            <input type="hidden" name="outdoorMessage" value={landing.outdoorMessage} />

            {/* ── Yoga sur chaise ── */}
            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">Yoga sur chaise (section entreprise)</p>
            <input
              name="chairYogaTitle"
              defaultValue={landing.chairYogaTitle}
              placeholder="Titre de la section Yoga sur chaise"
              className={fieldMd}
            />
            <textarea
              name="chairYogaText"
              defaultValue={landing.chairYogaText}
              rows={3}
              placeholder="Description générale (yoga sur chaise)"
              className={fieldMd}
            />
            <textarea
              name="chairYogaItems"
              defaultValue={landing.chairYogaItems.join("\n")}
              rows={5}
              placeholder={"Bénéfices (1 par ligne)\nEx: Aucun équipement requis\nEx: Format 30 à 60 min"}
              className="col-span-2 brand-field rounded-md px-3 py-2 text-sm"
            />

            {/* ── Bio prof ── */}
            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">Bio du professeur</p>
            <ImageUpload
                name="teacherPhotoUrl"
                label="Photo du professeur"
                currentUrl={landing.teacherPhotoUrl}
                shape="circle"
                className="col-span-2"
              />

            <input
              name="teacherBioTitle"
              defaultValue={landing.teacherBioTitle}
              className={fieldMd}
            />
            <FieldLabel>Texte a propos (paragraphes separes par une ligne vide)</FieldLabel>
            <textarea
              name="teacherBioText"
              defaultValue={landing.teacherBioText}
              rows={5}
              className={fieldMd}
            />

            <p className="col-span-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wide opacity-50">
              Appel a l action + pied de page
            </p>
            <FieldLabel>Titre CTA (Prete a faire une pause ?)</FieldLabel>
            <input name="finalCtaTitle" defaultValue={landing.finalCtaTitle} className={fieldMd} />
            <FieldLabel>Texte sous le titre CTA</FieldLabel>
            <textarea
              name="finalCtaText"
              defaultValue={landing.finalCtaText}
              rows={3}
              className={fieldMd}
            />
            <input
              name="finalCtaButtonLabel"
              defaultValue={landing.finalCtaButtonLabel}
              className={fieldMd}
            />
            <input name="footerAddress" defaultValue={landing.footerAddress} className={fieldMd} />
            <input name="footerPhone" defaultValue={landing.footerPhone} className={fieldMd} />
            <input name="footerEmail" defaultValue={landing.footerEmail} className={fieldMd} />
            <input name="facebookUrl" defaultValue={landing.facebookUrl} className={fieldMd} />
            <input name="instagramUrl" defaultValue={landing.instagramUrl} className={fieldMd} />
            <input name="tiktokUrl" defaultValue={landing.tiktokUrl} className={fieldMd} />
            <input name="linkedinUrl" defaultValue={landing.linkedinUrl} className={fieldMd} />
            <textarea
              name="cgvContent"
              defaultValue={landing.cgvContent}
              rows={8}
              className={fieldMd}
            />
            <textarea
              name="cguContent"
              defaultValue={landing.cguContent}
              rows={8}
              className={fieldMd}
            />
            <textarea
              name="legalNoticeContent"
              defaultValue={landing.legalNoticeContent}
              rows={8}
              className={fieldMd}
            />

            <button type="submit" className="brand-btn brand-btn-sm mt-4 w-fit rounded-lg px-4 py-2">
              Enregistrer le contenu de la page d accueil
            </button>
          </form>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Tableau de bord
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <p className="text-xs opacity-70">Cours actifs</p>
              <p className="mt-1 text-2xl font-semibold">{coursesCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <p className="text-xs opacity-70">Creneaux (7 jours)</p>
              <p className="mt-1 text-2xl font-semibold">{slotsCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <p className="text-xs opacity-70">Reservations en attente</p>
              <p className="mt-1 text-2xl font-semibold">{bookingsPendingCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <p className="text-xs opacity-70">Abonnes actifs</p>
              <p className="mt-1 text-2xl font-semibold">{subscriptionsActiveCount}</p>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Utilisez le menu ci-dessus pour gerer separement le planning, les reservations, les
            cours/creneaux et les abonnes.
          </p>
        </section>
      </main>
    </div>
  );
}
