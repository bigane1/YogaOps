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
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: "var(--brand)" }}>
          Reserver un cours
        </h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90 md:text-base">
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

        <section className="mt-6 md:mt-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide opacity-70 md:text-sm md:normal-case md:tracking-normal">
              Choisir une date
            </p>
            <div className="-mx-4 px-4 md:mx-0 md:px-0">
              <div className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-hidden pb-1 md:flex-wrap md:overflow-visible">
                {days.map((d) => {
                  const iso = d.toISOString().slice(0, 10);
                  const isActive = iso === selectedDate.toISOString().slice(0, 10);
                  return (
                    <a
                      key={iso}
                      href={`/reserver?date=${iso}${emailQuery}${subscriptionQuery}`}
                      className={`shrink-0 snap-start rounded-xl px-4 py-3 text-center text-sm shadow-sm md:rounded-lg md:px-3 md:py-2 md:shadow-none ${
                        isActive
                          ? "brand-badge-ok font-semibold ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--background)]"
                          : "brand-btn-secondary border border-[var(--border-soft)] bg-white"
                      }`}
                    >
                      <span className="block whitespace-nowrap capitalize">
                        {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </span>
                      <span className="block whitespace-nowrap text-xs opacity-90 md:text-sm">
                        {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="text-sm opacity-80 md:text-base">
              <span className="font-medium" style={{ color: "var(--brand)" }}>
                {formatDateFR(selectedDate)}
              </span>
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

          <p className="mt-6 text-xs font-medium uppercase tracking-wide opacity-70 md:mt-8 md:text-sm md:normal-case md:tracking-normal">
            Creneaux disponibles
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
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
                  className={`brand-card rounded-xl p-4 md:p-5 ${
                    isSelected ? "ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--background)]" : ""
                  }`}
                >
                  <div className="flex gap-3 sm:block">
                    <div
                      className="flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-lg px-2 py-2 text-center sm:hidden"
                      style={{ background: "var(--brand-soft)" }}
                    >
                      <span
                        className="text-xl font-semibold tabular-nums leading-none"
                        style={{ color: "var(--brand)" }}
                      >
                        {formatTimeFR(slot.startsAt)}
                      </span>
                      <span className="mt-1 text-[10px] font-medium uppercase opacity-80">
                        {slot.course.durationMin} min
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 sm:flex-initial">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-medium leading-snug sm:text-lg">{slot.course.title}</h2>
                        <span className="brand-badge-ok shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium sm:px-3 sm:text-xs">
                          {isOnline ? "En ligne (Zoom)" : "Presentiel"}
                        </span>
                      </div>
                      <p className="mt-2 hidden text-sm opacity-90 sm:block">
                        {formatTimeFR(slot.startsAt)} &middot; {slot.course.durationMin} min &middot;{" "}
                        {slot.course.priceEur} EUR
                      </p>
                      <p className="mt-2 text-sm opacity-90 sm:hidden">
                        {slot.course.priceEur} EUR &middot; {slot.course.type}
                      </p>
                      <p className="mt-1 hidden text-sm opacity-80 sm:block">Type: {slot.course.type}</p>
                    </div>
                  </div>
                  {slot.course.description ? (
                    <details className="mt-3 border-t border-[var(--border-soft)] pt-3">
                      <summary className="cursor-pointer text-sm font-medium opacity-90">
                        Voir la description
                      </summary>
                      <p className="mt-1 text-sm opacity-80">{slot.course.description}</p>
                    </details>
                  ) : null}

                  <div className="mt-4">
                    <a
                      href={`/reserver?date=${selectedDate.toISOString().slice(0, 10)}&slotId=${slot.id}${emailQuery}${subscriptionQuery}`}
                      className={`brand-btn-sm inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium md:w-auto md:py-2 ${
                        isSelected ? "brand-btn" : "brand-btn-secondary"
                      }`}
                    >
                      {isSelected ? "Creneau selectionne — continuer" : "Choisir ce creneau"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedSlotForForm && selectedSlotForForm.available > 0 ? (
            <section className="mt-6 brand-card rounded-xl p-4 md:p-6">
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
