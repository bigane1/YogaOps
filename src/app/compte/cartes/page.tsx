export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { MemberCreditStatus } from "@/generated/prisma/enums";
import { SiteNav } from "@/components/site-nav";
import { MemberSubnav } from "@/components/member-subnav";
import { buyCreditPack, grantCreditPackLocalDev } from "@/app/member-actions";
import { eligibilityLabel } from "@/lib/credits";
import { getCurrentMember } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";
import { fulfillPaidCheckoutSession } from "@/lib/stripe-fulfill";
import { isLocalDevEnvironment } from "@/lib/stripe";

type Props = {
  searchParams: Promise<{
    success?: string;
    cancelled?: string;
    error?: string;
    session_id?: string;
  }>;
};

export default async function CartesPage({ searchParams }: Props) {
  const member = await getCurrentMember();
  if (!member) redirect("/compte/connexion?next=/compte/cartes");

  const params = await searchParams;
  let paymentJustActivated = false;
  if (params.session_id) {
    const result = await fulfillPaidCheckoutSession(params.session_id);
    paymentJustActivated = result.ok && result.kind === "credit_pack";
  }

  const [packs, myCards] = await Promise.all([
    prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: [{ creditCount: "asc" }, { priceEur: "asc" }],
    }),
    prisma.memberCreditCard.findMany({
      where: { memberId: member.id },
      include: { pack: true },
      orderBy: { purchasedAt: "desc" },
    }),
  ]);

  const now = new Date();
  const isLocal = isLocalDevEnvironment();

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">Mes cartes</h1>
        <p className="mt-2 text-[var(--muted)]">
          1 crédit = 1 séance. Chaque carte est valable 1 an à l&apos;achat.
        </p>
        <MemberSubnav />

        {isLocal ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Mode local : vous pouvez obtenir une carte <strong>sans paiement Stripe</strong> pour
            continuer vos tests.
          </p>
        ) : null}

        {paymentJustActivated || params.success ? (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
            {isLocal && !params.session_id
              ? "Carte ajoutée (bypass local)."
              : "Paiement confirmé. Votre carte de crédits est active."}
          </p>
        ) : null}
        {params.cancelled ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Paiement annulé. Aucun débit n&apos;a été effectué.
          </p>
        ) : null}
        {params.error === "stripe_config" && !isLocal ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Stripe n&apos;est pas configuré. Ajoutez des clés test ou utilisez le mode local.
          </p>
        ) : null}
        {params.error === "stripe" ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Impossible de démarrer le paiement. En local, utilisez « Obtenir sans paiement ».
          </p>
        ) : null}
        {params.error === "pack" ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Cette carte n&apos;est plus disponible.
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-xl font-medium">Acheter une carte</h2>
          {packs.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Aucune carte disponible pour le moment.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {packs.map((pack) => (
                <li key={pack.id} className="brand-card flex flex-col rounded-xl p-5">
                  <h3 className="font-display text-lg font-medium">{pack.name}</h3>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{pack.priceEur} €</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {pack.creditCount} crédit{pack.creditCount > 1 ? "s" : ""} ·{" "}
                    {eligibilityLabel(pack.eligibility)}
                  </p>
                  {pack.description ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">{pack.description}</p>
                  ) : null}
                  <div className="mt-auto space-y-2 pt-4">
                    {isLocal ? (
                      <form action={grantCreditPackLocalDev}>
                        <input type="hidden" name="packId" value={pack.id} />
                        <button
                          type="submit"
                          className="brand-btn w-full rounded-lg px-4 py-2.5 text-sm"
                        >
                          Obtenir sans paiement (local)
                        </button>
                      </form>
                    ) : null}
                    <form action={buyCreditPack}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <button
                        type="submit"
                        className={`w-full rounded-lg px-4 py-2.5 text-sm ${
                          isLocal ? "brand-btn-secondary" : "brand-btn"
                        }`}
                      >
                        Payer par carte bancaire
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-medium">Cartes déjà achetées</h2>
          {myCards.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Vous n&apos;avez pas encore de carte.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {myCards.map((card) => {
                const expired = card.expiresAt < now;
                const label =
                  card.status === MemberCreditStatus.exhausted || card.remainingCredits <= 0
                    ? "Épuisée"
                    : expired || card.status === MemberCreditStatus.expired
                      ? "Expirée"
                      : "Active";
                return (
                  <li
                    key={card.id}
                    className="brand-card flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{card.pack.name}</p>
                      <p className="text-[var(--muted)]">
                        {card.remainingCredits}/{card.totalCredits} crédits · expire le{" "}
                        {card.expiresAt.toLocaleDateString("fr-FR", {
                          timeZone: "Europe/Paris",
                        })}
                      </p>
                    </div>
                    <span className="rounded-md bg-[var(--beige)] px-2 py-1 text-xs font-medium">
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
