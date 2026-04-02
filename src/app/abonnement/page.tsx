import { SiteNav } from "@/components/site-nav";
import { buySubscriptionStripe } from "@/app/actions";
import { startOfWeekMonday } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { subscriptionStatusLabelFr } from "@/lib/labels-fr";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AbonnementPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ? String(params.email).trim() : "";
  const emailNorm = email.toLowerCase();

  const [packages, subscription] = await Promise.all([
    prisma.packagePlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    email
      ? prisma.subscription.findFirst({
          where: {
            OR: [{ customerEmail: emailNorm }, { customerEmail: email }],
          },
          include: { package: true },
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

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--brand)" }}
        >
          Abonnement
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Achetez un abonnement et consultez vos seances restantes.
        </p>

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
            <div className="mt-4 rounded-lg brand-alert p-3 text-sm">
              <p>
                Statut: <strong>{subscriptionStatusLabelFr(subscription.status)}</strong>
              </p>
              <p>
                Plan: <strong>{subscription.package.name}</strong>
              </p>
              <p>
                Seances restantes cette semaine: <strong>{remaining}</strong>
              </p>
              <p>Valide jusqu&apos;au: {new Date(subscription.endsAt).toLocaleDateString("fr-FR")}</p>
            </div>
          ) : email ? (
            <p className="mt-3 text-sm opacity-80">
              Aucun abonnement trouve pour {email}.
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Acheter un plan
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {packages.map((item) => (
              <article key={item.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
                <p className="mt-2 text-sm opacity-90">
                  {item.sessionCount} seances / semaine - validite {item.validityDays} jours
                </p>
                <p className="mt-1 text-sm opacity-80">
                  Type autorise:{" "}
                  {item.allowedCourseType === "individuel"
                    ? "Individuel"
                    : item.allowedCourseType === "collectif"
                      ? "Collectif"
                      : "Individuel + Collectif"}
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                  {item.priceEur} EUR
                </p>

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
                    Acheter via Stripe test
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
