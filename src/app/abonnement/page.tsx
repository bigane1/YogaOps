export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Mon abonnement - YogaOps",
  description: "Gérez votre abonnement yoga YogaOps : suivi, annulation et renouvellement.",
  robots: { index: false },
};
import { buySubscriptionStripe, cancelSubscription } from "@/app/actions";
import { startOfWeekMonday } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { subscriptionStatusLabelFr } from "@/lib/labels-fr";

type Props = {
  searchParams: Promise<{ email?: string; success?: string }>;
};

export default async function AbonnementPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ? String(params.email).trim() : "";
  const emailNorm = email.toLowerCase();
  const showSuccess = params.success === "1";

  const [packages, subscription] = await Promise.all([
    prisma.packagePlan.findMany({
      where: { isActive: true },
      include: { fixedCourse: true },
      orderBy: { createdAt: "desc" },
    }),
    email
      ? prisma.subscription.findFirst({
          where: {
            OR: [{ customerEmail: emailNorm }, { customerEmail: email }],
          },
          include: { package: { include: { fixedCourse: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const weekInfo = subscription
    ? await prisma.subscriptionWeek.findUnique({
        where: {
          subscriptionId_weekStart: {
            subscriptionId: subscription.id,
            weekStart: startOfWeekMonday(new Date()),
          },
        },
      })
    : null;

  const remaining = subscription
    ? weekInfo?.remainingSessions ?? subscription.package.sessionCount
    : null;

  const isRecurring = !!subscription?.stripeSubscriptionId;
  const isCancelScheduled = subscription?.cancelAtPeriodEnd ?? false;
  const renewalDate = subscription ? new Date(subscription.endsAt).toLocaleDateString("fr-FR") : null;

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--brand)" }}
        >
          Mon abonnement
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Consultez vos seances restantes et gerez votre abonnement.
        </p>

        {showSuccess && (
          <div className="brand-badge-ok mt-4 rounded-lg px-4 py-3 text-sm font-medium">
            Abonnement active avec succes ! Vous pouvez maintenant reserver vos cours.
          </div>
        )}

        <section className="brand-card mt-6 rounded-xl p-5">
          <form className="grid gap-2 sm:max-w-xl" action="/abonnement" method="get">
            <input
              type="email"
              name="email"
              required
              placeholder="Entrez votre email pour verifier votre abonnement"
              defaultValue={email}
              className="brand-field px-3 py-2 text-sm"
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Verifier mon abonnement
            </button>
          </form>

          {subscription ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg brand-alert p-4 text-sm">
                <p className="font-medium text-base">{subscription.package.name}</p>
                {subscription.package.fixedCourse && (
                  <p className="mt-1 text-blue-700 font-medium">
                    Cours fixe : {subscription.package.fixedCourse.title} — tous vos créneaux sont réservés automatiquement
                  </p>
                )}
                <p className="mt-2">
                  Statut :{" "}
                  <strong>
                    {isCancelScheduled
                      ? "Résiliation programmée"
                      : subscriptionStatusLabelFr(subscription.status)}
                  </strong>
                </p>
                {!subscription.package.fixedCourse && (
                  <p>
                    Séances restantes cette semaine : <strong>{remaining}</strong>
                  </p>
                )}
                {isRecurring ? (
                  isCancelScheduled ? (
                    <p className="mt-1 text-amber-700">
                      Votre abonnement prendra fin le {renewalDate}. Aucun prelevement ne sera
                      effectue apres cette date.
                    </p>
                  ) : (
                    <p>
                      Prochain renouvellement le : <strong>{renewalDate}</strong>
                    </p>
                  )
                ) : (
                  <p>Valide jusqu&apos;au : {renewalDate}</p>
                )}
              </div>

              {isRecurring && subscription.status === "active" && !isCancelScheduled && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                  <p className="font-medium text-red-800">Résilier mon abonnement</p>
                  <p className="mt-1 text-red-700">
                    Votre abonnement restera actif jusqu&apos;au {renewalDate}, puis ne sera plus
                    renouvelé. Vous pouvez résilier jusqu&apos;à 1 mois avant cette date.
                  </p>
                  <form action={cancelSubscription} className="mt-3">
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <input type="hidden" name="customerEmail" value={emailNorm} />
                    <button
                      type="submit"
                      className="rounded border border-red-400 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Confirmer la résiliation
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : email ? (
            <p className="mt-3 text-sm opacity-80">
              Aucun abonnement trouve pour {email}.
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Souscrire a un abonnement
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((item) => (
              <article key={item.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
                {item.fixedCourse ? (
                  <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                    Cours fixe : {item.fixedCourse.title}
                    <span className="ml-1 font-normal opacity-80">
                      — tous vos créneaux sont réservés automatiquement
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm opacity-90">
                    {item.sessionCount} séance{item.sessionCount > 1 ? "s" : ""} / semaine
                  </p>
                )}
                {item.billingIntervalMonths ? (
                  <p className="mt-1 text-sm opacity-80">
                    {item.billingIntervalMonths} mois · renouvellement automatique · sans engagement
                  </p>
                ) : (
                  <p className="mt-1 text-sm opacity-70">Validité {item.validityDays} jours</p>
                )}
                {!item.fixedCourse && (
                  <p className="mt-1 text-sm opacity-80">
                    Type autorisé :{" "}
                    {item.allowedCourseType === "individuel"
                      ? "Individuel"
                      : item.allowedCourseType === "collectif"
                        ? "Collectif"
                        : "Individuel + Collectif"}
                  </p>
                )}
                {item.billingIntervalMonths ? (
                  <div className="mt-3">
                    <p className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                      {Math.round(item.priceEur / item.billingIntervalMonths)} EUR
                      <span className="text-base font-medium opacity-70"> / mois</span>
                    </p>
                    <p className="mt-0.5 text-xs opacity-60">
                      soit {item.priceEur} EUR prélevés tous les {item.billingIntervalMonths} mois
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                    {item.priceEur} EUR
                  </p>
                )}

                <form action={buySubscriptionStripe} className="mt-4 grid gap-2">
                  <input type="hidden" name="packageId" value={item.id} />
                  <input
                    name="customerName"
                    required
                    placeholder="Votre nom"
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <input
                    name="customerEmail"
                    type="email"
                    required
                    placeholder="Votre email"
                    defaultValue={email}
                    className="brand-field px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="brand-btn brand-btn-sm rounded-lg px-4 py-2"
                  >
                    {item.billingIntervalMonths ? "S'abonner via Stripe" : "Acheter via Stripe"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
