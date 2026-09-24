export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { ImageUpload } from "@/components/image-upload";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, createCourse, deleteCourse, updateCourse } from "@/app/actions";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export default async function AdminCoursPage() {
  await ensureSeedData();
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";
  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Backoffice prof</h1>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input name="pin" type="password" required placeholder="Code admin" className="brand-field w-full rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">Se connecter</button>
          </form>
        </main>
      </div>
    );
  }

  const courses = await prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Cours & creneaux</h1>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">Deconnexion</button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Ajouter un cours ou atelier</h2>
          <form action={createCourse} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Titre (ex: Yoga dos & stress — Mercredi)" className={fieldMd} />
            <input name="description" required placeholder="Description courte (accroche)" className={fieldMd} />
            <textarea
              name="benefits"
              placeholder={"Bienfaits (1 par ligne)\nEx: Soulage les tensions cervicales\nEx: Améliore la qualité du sommeil"}
              rows={4}
              className="col-span-2 brand-field rounded-md px-3 py-2 text-sm"
            />
            <ImageUpload name="coverImage" label="Image de couverture (optionnel)" className="col-span-2" />
            <select name="type" className={fieldMd}>
              <option value="collectif">Collectif</option>
              <option value="individuel">Individuel</option>
            </select>
            <select name="location" className={fieldMd}>
              <option value="en_ligne">En ligne (Zoom)</option>
              <option value="presentiel">Présentiel</option>
            </select>
            <input name="durationMin" type="number" defaultValue={60} placeholder="Durée (min)" className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={15} placeholder="Prix EUR" className={fieldMd} />
            <input name="capacity" type="number" defaultValue={10} placeholder="Places max" className={fieldMd} />
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="isWorkshop" value="0" />
              <input type="checkbox" name="isWorkshop" value="1" className="size-4 accent-[var(--brand)]" />
              C&apos;est un atelier thématique (événement ponctuel)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="acceptsUnitPayment" value="0" />
              <input
                type="checkbox"
                name="acceptsUnitPayment"
                value="1"
                defaultChecked
                className="size-4 accent-[var(--brand)]"
              />
              Ouvert au paiement à la séance (CB)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="acceptsCreditPayment" value="0" />
              <input
                type="checkbox"
                name="acceptsCreditPayment"
                value="1"
                defaultChecked
                className="size-4 accent-[var(--brand)]"
              />
              Ouvert aux cartes de crédits
            </label>
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 sm:col-span-2">
              Créer
            </button>
          </form>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Liste des cours</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {courses.map((course) => (
              <li key={course.id} className="brand-list-item p-3">
                {course.isWorkshop && (
                  <span className="mb-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    Atelier
                  </span>
                )}
                <form action={updateCourse} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={course.id} />
                  <input name="title" defaultValue={course.title} placeholder="Titre" className={fieldSm} />
                  <input name="description" defaultValue={course.description} placeholder="Description" className={`${fieldSm} sm:col-span-3`} />
                  <textarea
                    name="benefits"
                    defaultValue={course.benefits}
                    placeholder="Bienfaits (1 par ligne)"
                    rows={3}
                    className={`${fieldSm} sm:col-span-4`}
                  />
                  <ImageUpload
                    name="coverImage"
                    label="Image de couverture"
                    currentUrl={course.coverImage ?? ""}
                    className={`${fieldSm} sm:col-span-4`}
                  />
                  <select name="type" defaultValue={course.type} className={fieldSm}>
                    <option value="collectif">Collectif</option>
                    <option value="individuel">Individuel</option>
                  </select>
                  <select name="location" defaultValue={course.location} className={fieldSm}>
                    <option value="en_ligne">En ligne</option>
                    <option value="presentiel">Présentiel</option>
                  </select>
                  <input name="durationMin" type="number" defaultValue={course.durationMin} placeholder="Durée (min)" className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={course.priceEur} placeholder="Prix EUR" className={fieldSm} />
                  <input name="capacity" type="number" defaultValue={course.capacity} placeholder="Places" className={fieldSm} />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="hidden" name="isWorkshop" value="0" />
                    <input type="checkbox" name="isWorkshop" value="1" defaultChecked={course.isWorkshop} className="size-3 accent-[var(--brand)]" />
                    Atelier
                  </label>
                  <label className="flex items-center gap-1 text-xs sm:col-span-2">
                    <input type="hidden" name="acceptsUnitPayment" value="0" />
                    <input
                      type="checkbox"
                      name="acceptsUnitPayment"
                      value="1"
                      defaultChecked={course.acceptsUnitPayment}
                      className="size-3 accent-[var(--brand)]"
                    />
                    Paiement unitaire CB
                  </label>
                  <label className="flex items-center gap-1 text-xs sm:col-span-2">
                    <input type="hidden" name="acceptsCreditPayment" value="0" />
                    <input
                      type="checkbox"
                      name="acceptsCreditPayment"
                      value="1"
                      defaultChecked={course.acceptsCreditPayment}
                      className="size-3 accent-[var(--brand)]"
                    />
                    Cartes de crédits
                  </label>
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 sm:col-span-2">Modifier</button>
                </form>
                <form action={deleteCourse} className="mt-2">
                  <input type="hidden" name="id" value={course.id} />
                  <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Créneaux</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            La planification des créneaux (filtre par type, dates, séries hebdomadaires) se fait sur
            la page dédiée.
          </p>
          <Link href="/admin/creneaux" className="brand-btn brand-btn-sm mt-4 inline-flex rounded-lg px-4 py-2">
            Ouvrir les créneaux
          </Link>
        </section>
      </main>
    </div>
  );
}
