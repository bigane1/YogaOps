export const dynamic = "force-dynamic";

import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, createPackage, deletePackage, updatePackage, updateSubscriptionStatus } from "@/app/actions";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { paymentMethodLabelFr, subscriptionStatusLabelFr } from "@/lib/labels-fr";
import type { CourseModel as Course } from "@/generated/prisma/models/Course";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export default async function AdminAbonnementsPage() {
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

  const [courses, packages, subscriptions] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { title: "asc" } }),
    prisma.packagePlan.findMany({
      where: { isActive: true },
      include: { fixedCourse: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      include: { package: { include: { fixedCourse: true } } },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Abonnements & abonnes</h1>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">Deconnexion</button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Plans d&rsquo;abonnement</h2>
          <form action={createPackage} className="mb-4 mt-3 grid gap-2 sm:grid-cols-2">

            <p className="col-span-2 text-xs font-semibold uppercase tracking-wide opacity-50">Informations générales</p>
            <input name="name" required placeholder="Nom (ex: Abonnement Mercredi 18h — 3 mois)" className={fieldMd} />
            <input name="description" required placeholder="Description courte pour les clientes" className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={90} placeholder="Prix TOTAL en EUR (ex: 90 pour 3 mois)" className={fieldMd} />
            <select name="billingIntervalMonths" className={fieldMd} defaultValue="">
              <option value="">Paiement unique (pas récurrent)</option>
              <option value="3">3 mois – récurrent Stripe</option>
              <option value="6">6 mois – récurrent Stripe</option>
              <option value="12">12 mois – récurrent Stripe</option>
            </select>

            <p className="col-span-2 mt-2 text-xs font-semibold uppercase tracking-wide opacity-50">
              Planification du cours fixe (jour &amp; heure)
            </p>
            <p className="col-span-2 text-xs opacity-60">
              Remplis ces champs pour créer automatiquement le cours et tous les créneaux hebdomadaires.
              Laisse vide si tu veux lier manuellement un cours existant ci-dessous.
            </p>

            <select name="scheduleDayOfWeek" className={fieldMd} defaultValue="-1">
              <option value="-1">— Choisir le jour —</option>
              <option value="1">Lundi</option>
              <option value="2">Mardi</option>
              <option value="3">Mercredi</option>
              <option value="4">Jeudi</option>
              <option value="5">Vendredi</option>
              <option value="6">Samedi</option>
              <option value="0">Dimanche</option>
            </select>
            <input name="scheduleTime" type="time" defaultValue="18:00" placeholder="Heure (ex: 18:00)" className={fieldMd} />
            <input name="scheduleDurationMin" type="number" defaultValue={60} placeholder="Durée (min)" className={fieldMd} />
            <input name="scheduleCapacity" type="number" defaultValue={10} placeholder="Places par créneau" className={fieldMd} />
            <select name="scheduleLocation" className={fieldMd} defaultValue="en_ligne">
              <option value="en_ligne">En ligne (Zoom)</option>
              <option value="presentiel">Présentiel</option>
            </select>
            <select name="allowedCourseType" className={fieldMd} defaultValue="collectif">
              <option value="collectif">Collectif</option>
              <option value="individuel">Individuel</option>
              <option value="">Les deux</option>
            </select>

            <p className="col-span-2 mt-2 text-xs font-semibold uppercase tracking-wide opacity-50">
              Ou lier un cours existant
            </p>
            <div className="col-span-2">
              <select name="fixedCourseId" className={`${fieldMd} w-full`} defaultValue="">
                <option value="">Aucun (utilise la planification ci-dessus)</option>
                {courses.map((c: Course) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.type === "collectif" ? "Collectif" : "Individuel"} · {c.location === "en_ligne" ? "En ligne" : "Présentiel"})
                  </option>
                ))}
              </select>
            </div>

            <p className="col-span-2 text-xs opacity-50">
              Validité en jours (uniquement pour les paiements uniques sans durée fixe ci-dessus).
            </p>
            <input name="validityDays" type="number" defaultValue={30} placeholder="Validité (jours)" className={fieldMd} />
            <input name="sessionCount" type="number" defaultValue={1} placeholder="Séances / semaine (quota)" className={fieldMd} />

            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 sm:col-span-2">
              Créer l&apos;abonnement (génère le cours + créneaux + prix Stripe si récurrent)
            </button>
          </form>

          <ul className="mt-3 space-y-3 text-sm">
            {packages.map((item) => (
              <li key={item.id} className="brand-list-item p-3">
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  {item.billingIntervalMonths && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">
                      Récurrent {item.billingIntervalMonths} mois · {item.stripePriceId ?? "pas de Price ID Stripe"}
                    </span>
                  )}
                  {item.fixedCourse && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                      Cours fixe : {item.fixedCourse.title}
                    </span>
                  )}
                </div>
                <form action={updatePackage} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="name" defaultValue={item.name} placeholder="Nom abonnement" className={fieldSm} />
                  <input name="description" defaultValue={item.description} placeholder="Description abonnement" className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={item.priceEur} placeholder="Prix EUR" className={fieldSm} />
                  <input name="sessionCount" type="number" defaultValue={item.sessionCount} placeholder="Séances / semaine" className={fieldSm} />
                  <select name="allowedCourseType" className={fieldSm} defaultValue={item.allowedCourseType ?? ""}>
                    <option value="">Les deux</option>
                    <option value="individuel">Seulement individuel</option>
                    <option value="collectif">Seulement collectif</option>
                  </select>
                  <select name="fixedCourseId" className={fieldSm} defaultValue={item.fixedCourseId ?? ""}>
                    <option value="">Aucun cours fixe</option>
                    {courses.map((c: Course) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <input name="validityDays" type="number" defaultValue={item.validityDays} placeholder="Validite (jours)" className={fieldSm} />
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">Modifier</button>
                </form>
                <form action={deletePackage} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Gestion des abonnes</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {subscriptions.map((sub) => (
              <li key={sub.id} className="brand-list-item p-3">
                <p>
                  <span className="font-medium">{sub.customerEmail}</span> — Plan: {sub.package.name}
                </p>
                <p className="mt-1 text-xs opacity-75">
                  {sub.customerName && <><strong>{sub.customerName}</strong> · </>}
                  Paiement: {paymentMethodLabelFr(sub.paymentMethod)} · Fin: {sub.endsAt.toLocaleDateString("fr-FR")}
                  {sub.package.billingIntervalMonths && (
                    <> · <span className="text-green-700">Récurrent {sub.package.billingIntervalMonths} mois</span></>
                  )}
                  {sub.package.fixedCourse && (
                    <> · <span className="text-blue-700">Cours fixe : {sub.package.fixedCourse.title}</span></>
                  )}
                  {sub.cancelAtPeriodEnd && (
                    <> · <span className="text-amber-700">Résiliation programmée</span></>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${sub.status === "active" ? "brand-badge-ok" : sub.status === "cancelled" ? "brand-badge-muted" : "brand-alert"}`}>
                    {subscriptionStatusLabelFr(sub.status)}
                  </span>
                  {sub.status !== "active" ? (
                    <form action={updateSubscriptionStatus}>
                      <input type="hidden" name="subscriptionId" value={sub.id} />
                      <input type="hidden" name="targetStatus" value="active" />
                      <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1">Activer</button>
                    </form>
                  ) : null}
                  {sub.status !== "cancelled" ? (
                    <form action={updateSubscriptionStatus}>
                      <input type="hidden" name="subscriptionId" value={sub.id} />
                      <input type="hidden" name="targetStatus" value="cancelled" />
                      <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Annuler</button>
                    </form>
                  ) : null}
                  {sub.status !== "pending" ? (
                    <form action={updateSubscriptionStatus}>
                      <input type="hidden" name="subscriptionId" value={sub.id} />
                      <input type="hidden" name="targetStatus" value="pending" />
                      <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1">Remettre en attente</button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
