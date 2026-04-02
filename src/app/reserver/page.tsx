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

  const emailParamRaw = params.email ? String(params.email) : "";
  const emailNorm = emailParamRaw.trim().toLowerCase();
  const emailParam = emailParamRaw.trim();
  const subscriptionIdParam = params.subscriptionId
    ? String(params.subscriptionId)
    : "";
  const errorParam = params.error ? String(params.error) : "";

  const weekStart = startOfWeekMonday(selectedDate);

  /** Sur la journee selectionnee : chevauchement [dayStart, dayEnd) (sinon un abo achete le meme jour apres minuit etait invisible). */
  const subscriptionDateWhere = {
    startsAt: { lt: dayEnd },
    endsAt: { gt: dayStart },
  };

  const subscription = subscriptionIdParam
    ? await prisma.subscription.findUnique({
        where: { id: subscriptionIdParam },
        include: { package: true },
      })
    : emailParam
      ? await prisma.subscription.findFirst({
          where: {
            OR: [{ customerEmail: emailNorm }, { customerEmail: emailParam }],
            status: SubscriptionStatus.active,
            ...subscriptionDateWhere,
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

  /** Deep link avec slotId : afficher le formulaire même si le créneau est hors filtre abonnement (validation côté serveur). */
  const selectedSlotForForm =
    selectedSlot ??
    (selectedSlotId
      ? await prisma.timeSlot.findFirst({
          where: {
            id: selectedSlotId,
            available: { gt: 0 },
            startsAt: { gte: dayStart, lt: dayEnd },
          },
          include: { course: true },
        })
      : null);

  const emailQuery = emailParam ? `&email=${encodeURIComponent(emailParam)}` : "";
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

        <section className="brand-card mt-4 max-w-2xl rounded-xl p-4">
          <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
            Utiliser mon abonnement
          </p>
          <p className="mt-1 text-xs opacity-85">
            L&apos;abonnement est detecte via l&apos;URL (email). Saisissez l&apos;email du compte
            abonnement puis cliquez <strong>Appliquer</strong> : l&apos;option &quot;Utiliser mon
            abonnement&quot; se debloque ensuite dans le formulaire.
          </p>
          <form method="get" className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="date" value={selectedDate.toISOString().slice(0, 10)} />
            {selectedSlotId ? <input type="hidden" name="slotId" value={selectedSlotId} /> : null}
            {subscriptionIdParam ? (
              <input type="hidden" name="subscriptionId" value={subscriptionIdParam} />
            ) : null}
            <input
              name="email"
              type="email"
              defaultValue={emailParam}
              placeholder="Email de votre abonnement"
              className="brand-field flex-1 px-3 py-2 text-sm"
              autoComplete="email"
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Appliquer
            </button>
          </form>
        </section>

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
                Abonnement trouve pour cet email, mais statut : {subscription.status}. Tant qu&apos;il
                n&apos;est pas <strong>active</strong>, vous ne pouvez pas reserver avec (paiement en
                attente ou annule).
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

          {selectedSlotForForm && selectedSlotForForm.available > 0 ? (
            <section className="mt-6 brand-card rounded-xl p-6">
              <h3 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
                Finaliser la reservation
              </h3>
              <p className="mt-1 text-sm opacity-80">
                {selectedSlotForForm.course.title} •{" "}
                {formatTimeFR(selectedSlotForForm.startsAt)} •{" "}
                {selectedSlotForForm.course.durationMin} min •{" "}
                {selectedSlotForForm.course.priceEur} EUR
              </p>
              {selectedSlotId && selectedSlotForForm && !selectedSlot ? (
                <p className="brand-alert mt-3 rounded-lg p-3 text-sm">
                  Creneau ouvert via le lien direct. Verifiez que ce cours correspond a votre
                  abonnement (type et dates), sinon la reservation sera refusee.
                </p>
              ) : null}
              {(() => {
                const isOnlineCourse =
                  selectedSlotForForm.course.location === "en_ligne";
                const defaultPayment = subscriptionActive
                  ? "subscription"
                  : isOnlineCourse
                    ? "stripe"
                    : "on_site";
                const paymentOrder: Array<{
                  value: "stripe" | "on_site" | "subscription";
                  label: string;
                  hint?: string;
                  disabled?: boolean;
                }> = isOnlineCourse
                  ? [
                      {
                        value: "stripe",
                        label: "Paiement en ligne (carte bancaire)",
                        hint: "Redirection securisee vers Stripe pour regler la seance.",
                      },
                      {
                        value: "on_site",
                        label: "Paiement sur place (carte / especes)",
                        hint: "Pour les seances en presentiel ou accord avec la prof.",
                      },
                      {
                        value: "subscription",
                        label: subscriptionActive
                          ? "Utiliser mon abonnement (seances incluses)"
                          : "Utiliser mon abonnement (non disponible)",
                        disabled: !subscriptionActive,
                      },
                    ]
                  : [
                      { value: "on_site", label: "Paiement sur place (carte / especes)" },
                      {
                        value: "stripe",
                        label: "Paiement en ligne (carte bancaire)",
                        hint: "Redirection securisee vers Stripe.",
                      },
                      {
                        value: "subscription",
                        label: subscriptionActive
                          ? "Utiliser mon abonnement (seances incluses)"
                          : "Utiliser mon abonnement (non disponible)",
                        disabled: !subscriptionActive,
                      },
                    ];
                return (
              <form action={reserveSlot} className="mt-4 grid gap-3 max-w-xl">
                <input type="hidden" name="slotId" value={selectedSlotForForm.id} />
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
                <fieldset className="grid gap-2 rounded-lg border border-[var(--border-soft)] p-3">
                  <legend className="px-1 text-sm font-medium opacity-90">
                    Mode de paiement
                  </legend>
                  {paymentOrder.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 ${
                        opt.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--brand-soft)]"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.value}
                          defaultChecked={defaultPayment === opt.value}
                          disabled={opt.disabled}
                          className="shrink-0"
                        />
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span className="pl-6 text-xs opacity-80">{opt.hint}</span>
                      ) : null}
                    </label>
                  ))}
                </fieldset>
                {!subscriptionActive ? (
                  <p className="text-xs opacity-80">
                    Pour utiliser un abonnement : activez-le via la zone &quot;Utiliser mon abonnement&quot;
                    en haut (email + Appliquer), ou achetez-le sur Abonnement / Tarifs.
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2"
                >
                  Confirmer
                </button>
              </form>
                );
              })()}
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
