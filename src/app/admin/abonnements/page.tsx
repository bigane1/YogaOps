import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, createPackage, deletePackage, updatePackage, updateSubscriptionStatus } from "@/app/actions";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { paymentMethodLabelFr, subscriptionStatusLabelFr } from "@/lib/labels-fr";

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

  const [packages, subscriptions] = await Promise.all([
    prisma.packagePlan.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.subscription.findMany({
      include: { package: true },
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
            <input name="name" required placeholder="Nom abonnement (ex: Nidra)" className={fieldMd} />
            <input name="description" required placeholder="Description abonnement" className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={79} placeholder="Prix EUR" className={fieldMd} />
            <input name="sessionCount" type="number" defaultValue={6} placeholder="Seances par semaine" className={fieldMd} />
            <select name="allowedCourseType" className={fieldMd} defaultValue="">
              <option value="">Les deux (individuel + collectif)</option>
              <option value="individuel">Seulement individuel</option>
              <option value="collectif">Seulement collectif</option>
            </select>
            <input name="validityDays" type="number" defaultValue={30} placeholder="Validite (jours)" className={fieldMd} />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">Creer abonnement</button>
          </form>

          <ul className="mt-3 space-y-3 text-sm">
            {packages.map((item) => (
              <li key={item.id} className="brand-list-item p-3">
                <form action={updatePackage} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="name" defaultValue={item.name} placeholder="Nom abonnement" className={fieldSm} />
                  <input name="description" defaultValue={item.description} placeholder="Description abonnement" className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={item.priceEur} placeholder="Prix EUR" className={fieldSm} />
                  <input name="sessionCount" type="number" defaultValue={item.sessionCount} placeholder="Seances / semaine" className={fieldSm} />
                  <select name="allowedCourseType" className={fieldSm} defaultValue={item.allowedCourseType ?? ""}>
                    <option value="">Les deux</option>
                    <option value="individuel">Seulement individuel</option>
                    <option value="collectif">Seulement collectif</option>
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
                  <span className="font-medium">{sub.customerEmail}</span> - Plan: {sub.package.name}
                </p>
                <p className="mt-1 text-xs opacity-75">
                  Paiement: {paymentMethodLabelFr(sub.paymentMethod)} - Fin: {sub.endsAt.toLocaleDateString("fr-FR")}
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
