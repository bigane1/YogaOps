import { SiteNav } from "@/components/site-nav";
import { reserveSlot } from "@/app/actions";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import {
  ensureSeedData,
  formatDateFR,
  formatTimeFR,
  startOfDay,
  addDays,
  startOfWeekMonday,
} from "@/lib/db";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    date?: string;
    slotId?: string;
    email?: string;
    subscriptionId?: string;
    error?: string;
  }>;
};

export default async function ReserverPage({ searchParams }: Props) {
  await ensureSeedData();
  const params = await searchParams;
  const today = startOfDay(new Date());
  const selectedDate = params.date ? startOfDay(new Date(params.date)) : today;
  const selectedSlotId = params.slotId ? String(params.slotId) : null;

  const dayStart = selectedDate;
  const dayEnd = addDays(selectedDate, 1);

  const emailParam = params.email ? String(params.email) : "";
  const subscriptionIdParam = params.subscriptionId
    ? String(params.subscriptionId)
    : "";
  const errorParam = params.error ? String(params.error) : "";

  const weekStart = startOfWeekMonday(selectedDate);

  const subscription = subscriptionIdParam
    ? await prisma.subscription.findUnique({
        where: { id: subscriptionIdParam },
        include: { package: true },
      })
    : emailParam
      ? await prisma.subscription.findFirst({
          where: {
            customerEmail: emailParam,
            status: SubscriptionStatus.active,
            startsAt: { lte: selectedDate },
            endsAt: { gt: selectedDate },
            package: { isActive: true },
          },
          include: { package: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const subscriptionWeek = subscription
    ? await prisma.subscriptionWeek.findUnique({
        where: {
          subscriptionId_weekStart: {
            subscriptionId: subscription.id,
            weekStart,
          },
        },
      })
    : null;

  const remainingSessionsThisWeek =
    subscription && subscription.status === SubscriptionStatus.active
      ? subscriptionWeek?.remainingSessions ?? subscription.package.sessionCount
      : null;

  const subscriptionActive =
    !!subscription && subscription.status === SubscriptionStatus.active;

  const shouldFilterBySubscription =
    subscriptionActive && (remainingSessionsThisWeek ?? 0) > 0;

  const slotTimeGte = subscriptionActive ? (subscription!.startsAt > dayStart ? subscription!.startsAt : dayStart) : dayStart;
  const slotTimeLt = subscriptionActive ? (subscription!.endsAt < dayEnd ? subscription!.endsAt : dayEnd) : dayEnd;

  const slots = await prisma.timeSlot.findMany({
    where: {
      startsAt: shouldFilterBySubscription
        ? { gte: slotTimeGte, lt: slotTimeLt }
        : { gte: dayStart, lt: dayEnd },
      available: { gt: 0 },
      ...(shouldFilterBySubscription && subscription!.package.allowedCourseType
        ? { course: { type: subscription!.package.allowedCourseType } }
        : {}),
    },
    include: { course: true },
    orderBy: { startsAt: "asc" },
  });

  const selectedSlot = selectedSlotId
    ? slots.find((s) => s.id === selectedSlotId) ?? null
    : null;

  const emailQuery = emailParam
    ? `&email=${encodeURIComponent(emailParam)}`
    : "";
  const subscriptionQuery = subscriptionIdParam
    ? `&subscriptionId=${encodeURIComponent(subscriptionIdParam)}`
    : "";

  const days = Array.from({ length: 14 }).map((_, idx) => addDays(today, idx));

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Reserver un cours
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Comme sur Calendly : choisissez une date, puis un horaire disponible.
        </p>
        {errorParam === "stripe_checkout" ? (
          <p className="brand-alert mt-4 rounded-lg p-3 text-sm">
            Le paiement en ligne n&apos;a pas pu etre initialise. Verifiez la configuration Stripe
            puis reessayez, ou choisissez &quot;Paiement sur place&quot;.
          </p>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {days.map((d) => {
                const iso = d.toISOString().slice(0, 10);
                const isActive = iso === selectedDate.toISOString().slice(0, 10);
                return (
                  <a
                    key={iso}
                    href={`/reserver?date=${iso}${emailQuery}${subscriptionQuery}`}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isActive
                        ? "brand-badge-ok font-semibold"
                        : "brand-btn-secondary"
                    }`}
                  >
                    {d.toLocaleDateString("fr-FR", { weekday: "short" })}{" "}
                    {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </a>
                );
              })}
            </div>
            <div className="opacity-80 text-sm">
              Jour choisi : {formatDateFR(selectedDate)}
            </div>

            {subscriptionActive ? (
              <div className="brand-badge-ok rounded-lg px-3 py-2 text-sm font-semibold">
                Abonnement actif • {remainingSessionsThisWeek} seances restantes cette semaine
              </div>
            ) : subscription ? (
              <div className="brand-alert rounded-lg px-3 py-2 text-sm">
                Abonnement actuel: statut {subscription.status} (seances bloquées tant que actif)
              </div>
            ) : emailParam ? (
              <div className="opacity-80 text-sm">
                Aucun abonnement actif trouve pour <span style={{ color: "var(--brand)" }}>{emailParam}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {slots.length === 0 ? (
              <div className="brand-alert rounded-xl p-4 sm:col-span-2">
                Aucun creneau disponible pour cette date.
              </div>
            ) : null}

            {slots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const isOnline = slot.course.location === "en_ligne";
              return (
                <article
                  key={slot.id}
                  className={`brand-card rounded-xl p-5 ${
                    isSelected ? "outline outline-2 outline-[var(--brand)]" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">{slot.course.title}</h2>
                    <span className="brand-badge-ok rounded-full px-3 py-1 text-xs font-medium">
                      {isOnline ? "En ligne (Zoom)" : "Presentiel"}
                    </span>
                  </div>
                  {slot.course.description ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium opacity-90">
                        Voir la description
                      </summary>
                      <p className="mt-1 text-sm opacity-80">{slot.course.description}</p>
                    </details>
                  ) : null}

                  <p className="mt-2 text-sm opacity-90">
                    {formatTimeFR(slot.startsAt)} - {slot.course.durationMin} min -{" "}
                    {slot.course.priceEur} EUR
                  </p>
                  <p className="mt-1 text-sm opacity-80">
                    Type: {slot.course.type}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/reserver?date=${selectedDate.toISOString().slice(0, 10)}&slotId=${slot.id}${emailQuery}${subscriptionQuery}`}
                      className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-2 text-sm"
                    >
                      {isSelected ? "Choisi" : "Reserver"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedSlot && selectedSlot.available > 0 ? (
            <section className="mt-6 brand-card rounded-xl p-6">
              <h3 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
                Finaliser la reservation
              </h3>
              <p className="mt-1 text-sm opacity-80">
                {selectedSlot.course.title} • {formatTimeFR(selectedSlot.startsAt)} •{" "}
                {selectedSlot.course.durationMin} min • {selectedSlot.course.priceEur} EUR
              </p>
              <form action={reserveSlot} className="mt-4 grid gap-3 max-w-xl">
                <input type="hidden" name="slotId" value={selectedSlot.id} />
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
                  defaultValue={emailParam || ""}
                  className="brand-field px-3 py-2 text-sm"
                />
                <select
                  name="paymentMethod"
                  defaultValue={subscriptionActive ? "subscription" : "on_site"}
                  className="brand-field px-3 py-2 text-sm"
                >
                  <option value="on_site">
                    Paiement sur place (carte/especes)
                  </option>
                  <option value="stripe">Paiement en ligne (Stripe test)</option>
                  <option value="subscription" disabled={!subscriptionActive}>
                    {subscriptionActive
                      ? "Utiliser mon abonnement"
                      : "Utiliser mon abonnement (indisponible)"}
                  </option>
                </select>
                {!subscriptionActive ? (
                  <p className="text-xs opacity-80">
                    Pour utiliser un abonnement, achetez-le d&apos;abord depuis l&apos;onglet
                    Tarifs.
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2"
                >
                  Confirmer
                </button>
              </form>
              <a
                href={`/reserver?date=${selectedDate.toISOString().slice(0, 10)}`}
                className="mt-3 inline-block text-sm opacity-80 underline"
              >
                Annuler
              </a>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
}
