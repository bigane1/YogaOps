export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { adminLogin, adminLogout } from "@/app/actions";
import {
  createCreditPack,
  deleteCreditPack,
  updateCreditPack,
} from "@/app/member-actions";
import { eligibilityLabel } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

const field = "brand-field rounded-md px-3 py-2 text-sm";

export default async function AdminCartesPage() {
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";
  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Cartes de crédits
          </h1>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input
              name="pin"
              type="password"
              required
              placeholder="Code admin"
              className={`${field} w-full`}
            />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const packs = await prisma.creditPack.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Cartes de crédits
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Créez les offres (ex. 5 crédits, 60 crédits). Validité par défaut : 1 an. Chaque
          réservation = 1 crédit.
        </p>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">
            Déconnexion
          </button>
        </form>

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Nouvelle carte
          </h2>
          <form action={createCreditPack} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Nom (ex: Carte 5 séances)" className={field} />
            <input
              name="description"
              placeholder="Description courte (optionnel)"
              className={field}
            />
            <input
              name="creditCount"
              type="number"
              min={1}
              defaultValue={5}
              required
              placeholder="Nombre de crédits"
              className={field}
            />
            <input
              name="priceEur"
              type="number"
              min={1}
              defaultValue={55}
              required
              placeholder="Prix €"
              className={field}
            />
            <input
              name="validityDays"
              type="number"
              min={1}
              defaultValue={365}
              required
              placeholder="Validité (jours)"
              className={field}
            />
            <select name="eligibility" className={field} defaultValue="both">
              <option value="both">Individuel et collectif</option>
              <option value="collectif">Collectif seulement</option>
              <option value="individuel">Individuel seulement</option>
            </select>
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 sm:col-span-2">
              Créer la carte
            </button>
          </form>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Cartes existantes
          </h2>
          {packs.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Aucune carte pour l&apos;instant.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {packs.map((pack) => (
                <li key={pack.id} className="brand-list-item p-3">
                  <form action={updateCreditPack} className="grid gap-2 sm:grid-cols-3">
                    <input type="hidden" name="id" value={pack.id} />
                    <input name="name" defaultValue={pack.name} className={field} />
                    <input
                      name="description"
                      defaultValue={pack.description}
                      className={`${field} sm:col-span-2`}
                    />
                    <input
                      name="creditCount"
                      type="number"
                      defaultValue={pack.creditCount}
                      className={field}
                    />
                    <input
                      name="priceEur"
                      type="number"
                      defaultValue={pack.priceEur}
                      className={field}
                    />
                    <input
                      name="validityDays"
                      type="number"
                      defaultValue={pack.validityDays}
                      className={field}
                    />
                    <select name="eligibility" defaultValue={pack.eligibility} className={field}>
                      <option value="both">Individuel et collectif</option>
                      <option value="collectif">Collectif seulement</option>
                      <option value="individuel">Individuel seulement</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="hidden" name="isActive" value="0" />
                      <input
                        type="checkbox"
                        name="isActive"
                        value="1"
                        defaultChecked={pack.isActive}
                        className="size-4 accent-[var(--brand)]"
                      />
                      Active ({eligibilityLabel(pack.eligibility)})
                    </label>
                    <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1">
                      Enregistrer
                    </button>
                  </form>
                  <form action={deleteCreditPack} className="mt-2">
                    <input type="hidden" name="id" value={pack.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                    >
                      Désactiver
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
