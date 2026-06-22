export const dynamic = "force-dynamic";

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

export default async function AdminPage() {
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
          <p className="mt-1 text-sm opacity-80">
            Modifiez les textes de la page d accueil. Les listes se saisissent une ligne par element.
          </p>
          <form action={updateLandingContent} className="mt-4 grid gap-3">
            <input name="heroTitle" defaultValue={landing.heroTitle} className={fieldMd} />
            <textarea
              name="heroIntro"
              defaultValue={landing.heroIntro}
              rows={3}
              className={fieldMd}
            />
            <ImageUpload
                name="heroImage1Url"
                label="Image hero 1"
                currentUrl={landing.heroImage1Url}
                className={fieldMd}
              />
            <ImageUpload
                name="heroImage2Url"
                label="Image hero 2"
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
            <textarea
              name="specializationMessage"
              defaultValue={landing.specializationMessage}
              rows={3}
              className={fieldMd}
            />
            <textarea
              name="fatigueMessage"
              defaultValue={landing.fatigueMessage}
              rows={3}
              className={fieldMd}
            />
            <textarea
              name="enterpriseMessage"
              defaultValue={landing.enterpriseMessage}
              rows={2}
              className={fieldMd}
            />
            <textarea
              name="outdoorMessage"
              defaultValue={landing.outdoorMessage}
              rows={2}
              className={fieldMd}
            />
            <input
              name="firstSessionOffer"
              defaultValue={landing.firstSessionOffer}
              className={fieldMd}
            />

            <input
              name="socialProofTitle"
              defaultValue={landing.socialProofTitle}
              className={fieldMd}
            />
            <textarea
              name="socialProofItems"
              defaultValue={landing.socialProofItems.join("\n")}
              rows={4}
              className={fieldMd}
            />

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
            <textarea
              name="teacherBioText"
              defaultValue={landing.teacherBioText}
              rows={3}
              className={fieldMd}
            />

            <input
              name="practicalInfoTitle"
              defaultValue={landing.practicalInfoTitle}
              className={fieldMd}
            />
            <textarea
              name="practicalInfoItems"
              defaultValue={landing.practicalInfoItems.join("\n")}
              rows={4}
              className={fieldMd}
            />

            <input name="finalCtaTitle" defaultValue={landing.finalCtaTitle} className={fieldMd} />
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

            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Enregistrer contenu landing
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
