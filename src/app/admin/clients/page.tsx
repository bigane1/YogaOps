export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { MemberCreditStatus } from "@/generated/prisma/enums";
import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { adminLogin, adminLogout } from "@/app/actions";
import { memberDisplayName } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

const field = "brand-field rounded-md px-3 py-2 text-sm";

export default async function AdminClientsPage() {
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";
  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Clients
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

  const now = new Date();
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creditCards: {
        where: {
          status: MemberCreditStatus.active,
          remainingCredits: { gt: 0 },
          expiresAt: { gte: now },
        },
        include: { pack: true },
      },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Clients
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Membres inscrits, crédits restants et nombre de réservations.
        </p>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">
            Déconnexion
          </button>
        </form>

        <section className="brand-card mt-8 overflow-x-auto rounded-xl p-4 md:p-6">
          {members.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Aucun client inscrit pour le moment.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-[var(--muted)]">
                  <th className="pb-2 pr-3 font-medium">Client</th>
                  <th className="pb-2 pr-3 font-medium">Contact</th>
                  <th className="pb-2 pr-3 font-medium">Crédits</th>
                  <th className="pb-2 font-medium">Réservations</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const credits = m.creditCards.reduce((s, c) => s + c.remainingCredits, 0);
                  return (
                    <tr key={m.id} className="border-b border-[var(--border-soft)] align-top">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{memberDisplayName(m)}</p>
                        <p className="text-xs text-[var(--muted)]">
                          depuis{" "}
                          {m.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p>{m.email}</p>
                        <p className="text-[var(--muted)]">{m.phone || "—"}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold tabular-nums">{credits}</p>
                        {m.creditCards.length > 0 ? (
                          <ul className="mt-1 space-y-0.5 text-xs text-[var(--muted)]">
                            {m.creditCards.map((c) => (
                              <li key={c.id}>
                                {c.pack.name}: {c.remainingCredits}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <Link
                          href="/admin/reservations"
                          className="underline underline-offset-2"
                        >
                          {m._count.bookings}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
