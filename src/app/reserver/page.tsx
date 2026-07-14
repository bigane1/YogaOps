export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { OfferCard } from "@/components/site-ui";
import { ReserverQueryLink } from "@/components/reserver-query-link";
import { ReserverSubscriptionUnlock } from "@/components/reserver-subscription-unlock";
import { reserveSlot } from "@/app/actions";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import {
  addDays,
  ensureSeedData,
  formatSiteDate,
  formatTimeFR,
  siteDayEndUtc,
  siteDayStartUtc,
  startOfSiteDay,
  startOfWeekMonday,
  toSiteDateKey,
} from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";
import {
  getReserverWeekdaysForGroup,
  getVisibleReserverDays,
  matchCourseBookingGroup,
  resolveReserverBookingGroup,
  type ReserverBookingGroup,
} from "@/lib/reserver-config";

type Props = {
  searchParams: Promise<{
    date?: string;
    type?: string;
    slotId?: string;
    email?: string;
    subscriptionId?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Reserver un cours de yoga | YogaOps",
  description:
    "Consultez les prochains creneaux et reservez votre seance de yoga en ligne ou en presentiel.",
};

export default async function ReserverPage({ searchParams }: Props) {
  await ensureSeedData();
  const landing = await getLandingContent();
  const params = await searchParams;
  const todayStart = startOfSiteDay();
  const todayKey = toSiteDateKey(new Date());
  const bookingGroup = resolveReserverBookingGroup(params.type);
  const enabledWeekdays = getReserverWeekdaysForGroup(bookingGroup, landing);
  const selectedDateKey = params.date ?? todayKey;
  const selectedDate = siteDayStartUtc(selectedDateKey);
  const selectedSlotId = params.slotId ? String(params.slotId) : null;

  const emailParamRaw = params.email ? String(params.email) : "";
  const emailNorm = emailParamRaw.trim().toLowerCase();
  const emailParam = emailParamRaw.trim();
  const subscriptionIdParam = params.subscriptionId
    ? String(params.subscriptionId)
    : "";
  const errorParam = params.error ? String(params.error) : "";

  const emailQuery = emailParam ? `&email=${encodeURIComponent(emailParam)}` : "";
  const subscriptionQuery = subscriptionIdParam
    ? `&subscriptionId=${encodeURIComponent(subscriptionIdParam)}`
    : "";
  const typeQuery = `&type=${bookingGroup}`;

  const allDays = Array.from({ length: 14 }, (_, idx) => {
    const day = new Date(todayStart);
    day.setUTCDate(day.getUTCDate() + idx);
    return day;
  });
  const horizonEnd = new Date(todayStart);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 14);

  const upcomingSlots = await prisma.timeSlot.findMany({
    where: {
      startsAt: { gte: todayStart, lt: horizonEnd },
      available: { gt: 0 },
      course: { isWorkshop: false, isActive: true },
    },
    include: { course: true },
    orderBy: { startsAt: "asc" },
  });

  const slotDayKeys = new Set(
    upcomingSlots
      .filter(
        (slot) =>
          matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch) === bookingGroup,
      )
      .map((slot) => toSiteDateKey(slot.startsAt)),
  );

  const visibleDays = getVisibleReserverDays(allDays, enabledWeekdays, slotDayKeys, toSiteDateKey);

  if (visibleDays.length > 0 && !visibleDays.some(
    (d) => toSiteDateKey(d) === selectedDateKey,
  )) {
    const firstVisible = toSiteDateKey(visibleDays[0]);
    const slotQuery = selectedSlotId ? `&slotId=${encodeURIComponent(selectedSlotId)}` : "";
    redirect(`/reserver?date=${firstVisible}${typeQuery}${emailQuery}${subscriptionQuery}${slotQuery}`);
  }

  const dayStart = selectedDate;
  const dayEnd = siteDayEndUtc(selectedDateKey);

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

  const slotsRaw = await prisma.timeSlot.findMany({
    where: {
      startsAt: shouldFilterBySubscription
        ? { gte: slotTimeGte, lt: slotTimeLt }
        : { gte: dayStart, lt: dayEnd },
      available: { gt: 0 },
      course:
        shouldFilterBySubscription && subscription!.package.allowedCourseType
          ? {
              type: subscription!.package.allowedCourseType,
              isWorkshop: false,
              isActive: true,
            }
          : { isWorkshop: false, isActive: true },
    },
    include: { course: true },
    orderBy: { startsAt: "asc" },
  });

  const slots = slotsRaw.filter(
    (slot) =>
      matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch) === bookingGroup,
  );

  const otherGroupSlots = slotsRaw.filter(
    (slot) =>
      matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch) !== bookingGroup,
  );

  const bookingGroupLabels: Record<ReserverBookingGroup, string> = {
    collective: landing.offerCollectiveLabel,
    techWomen: landing.offerTechLabel,
    individual: landing.offerIndividualLabel,
  };
  const otherGroupsWithSlots = [
    ...new Set(
      otherGroupSlots.map((slot) =>
        matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch),
      ),
    ),
  ];

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
            course: { isWorkshop: false, isActive: true },
          },
          include: { course: true },
        })
      : null);

  const courseTypeOptions: Array<{ id: ReserverBookingGroup; label: string }> = [
    { id: "collective", label: landing.offerCollectiveLabel },
    { id: "techWomen", label: landing.offerTechLabel },
    { id: "individual", label: landing.offerIndividualLabel },
  ];

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <h1 className="section-title">Reserver un cours</h1>
        <p className="section-subtitle mt-3">
          Choisissez une date puis un horaire disponible. Premiere seance offerte pour les cours collectifs.
        </p>

        {errorParam === "stripe_checkout" ? (
          <p className="brand-alert mt-6 rounded-lg p-3 text-sm">
            Le paiement en ligne n&apos;a pas pu etre initialise. Verifiez la configuration Stripe
            puis reessayez, ou choisissez &quot;Paiement sur place&quot;.
          </p>
        ) : null}

        <section id="choisir-creneau" className="booking-panel mt-8">
          <h2 className="font-display text-lg font-medium">Choisir un creneau</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Selectionnez un type de cours, une date puis un horaire disponible.
          </p>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide opacity-70 md:text-sm md:normal-case md:tracking-normal">
              Type de cours
            </p>
            <div className="flex flex-wrap gap-2">
              {courseTypeOptions.map((option) => {
                const isActive = bookingGroup === option.id;
                return (
                  <ReserverQueryLink
                    key={option.id}
                    href={`/reserver?type=${option.id}${emailQuery}${subscriptionQuery}`}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      isActive
                        ? "brand-btn font-semibold"
                        : "brand-btn-secondary border border-[var(--border-soft)] bg-white"
                    }`}
                  >
                    {option.label}
                  </ReserverQueryLink>
                );
              })}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70 md:text-sm md:normal-case md:tracking-normal">
              Choisir une date
            </p>
            <div className="-mx-4 px-4 md:mx-0 md:px-0">
              <div className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-hidden pb-1 md:flex-wrap md:overflow-visible">
                {visibleDays.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Aucun jour affiche pour ce type de cours. Modifiez les jours dans le backoffice.
                  </p>
                ) : null}
                {visibleDays.map((d) => {
                  const iso = toSiteDateKey(d);
                  const isActive = iso === selectedDateKey;
                  return (
                    <ReserverQueryLink
                      key={iso}
                      href={`/reserver?date=${iso}${typeQuery}${emailQuery}${subscriptionQuery}`}
                      className={`shrink-0 snap-start rounded-xl px-4 py-3 text-center text-sm shadow-sm md:rounded-lg md:px-3 md:py-2 md:shadow-none ${
                        isActive
                          ? "brand-badge-ok font-semibold ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--background)]"
                          : "brand-btn-secondary border border-[var(--border-soft)] bg-white"
                      }`}
                    >
                      <span className="block whitespace-nowrap capitalize">
                        {formatSiteDate(d, { weekday: "short" })}
                      </span>
                      <span className="block whitespace-nowrap text-xs opacity-90 md:text-sm">
                        {formatSiteDate(d, { day: "2-digit", month: "short" })}
                      </span>
                    </ReserverQueryLink>
                  );
                })}
              </div>
            </div>
            <div className="text-sm opacity-80 md:text-base">
              <span className="font-medium" style={{ color: "var(--brand)" }}>
                {formatSiteDate(selectedDate, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {subscriptionActive ? (
              <div className="brand-badge-ok rounded-lg px-3 py-2 text-sm font-semibold">
                Votre abonnement est bien pris en compte. Il vous reste{" "}
                <strong>{remainingSessionsThisWeek}</strong> seance
                {remainingSessionsThisWeek !== 1 ? "s" : ""} cette semaine.
              </div>
            ) : subscription ? (
              <div className="brand-alert rounded-lg px-3 py-2 text-sm">
                Nous retrouvons un abonnement avec cet e-mail, mais il n&apos;est pas encore actif
                (paiement en cours ou annule). Des qu&apos;il est actif, vous pourrez reserver avec vos
                seances incluses. En attendant, choisissez un autre mode de paiement.
              </div>
            ) : emailParam ? (
              <div className="opacity-80 text-sm">
                Aucun abonnement actif pour{" "}
                <span style={{ color: "var(--brand)" }}>{emailParam}</span>. Verifiez l&apos;e-mail ou
                souscrivez un abonnement sur la page Abonnement.
              </div>
            ) : null}
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide opacity-70 md:mt-8 md:text-sm md:normal-case md:tracking-normal">
            Creneaux disponibles
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {slots.length === 0 ? (
              <div className="brand-alert rounded-xl p-4 sm:col-span-2">
                <p>Aucun creneau disponible pour cette date dans « {bookingGroupLabels[bookingGroup]} ».</p>
                {otherGroupsWithSlots.length > 0 ? (
                  <p className="mt-2 text-sm opacity-90">
                    Des creneaux existent ce jour-la dans :{" "}
                    {otherGroupsWithSlots.map((group) => bookingGroupLabels[group]).join(", ")}.
                    Changez d&apos;onglet ci-dessus.
                  </p>
                ) : (
                  <p className="mt-2 text-sm opacity-90">
                    Verifiez dans le backoffice que le creneau est bien publie, avec des places
                    disponibles, et que le type de cours correspond a l&apos;onglet choisi.
                  </p>
                )}
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
                    <ReserverQueryLink
                      href={`/reserver?date=${selectedDateKey}&type=${bookingGroup}&slotId=${slot.id}${emailQuery}${subscriptionQuery}`}
                      className={`brand-btn-sm inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium md:w-auto md:py-2 ${
                        isSelected ? "brand-btn" : "brand-btn-secondary"
                      }`}
                    >
                      {isSelected ? "Creneau selectionne — continuer" : "Choisir ce creneau"}
                    </ReserverQueryLink>
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
                const paymentBase: Array<{
                  value: "stripe" | "on_site";
                  label: string;
                  hint?: string;
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
                    ]
                  : [
                      { value: "on_site", label: "Paiement sur place (carte / especes)" },
                      {
                        value: "stripe",
                        label: "Paiement en ligne (carte bancaire)",
                        hint: "Redirection securisee vers Stripe.",
                      },
                    ];
                const dateIso = selectedDateKey;
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
                  {paymentBase.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-[var(--brand-soft)]"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.value}
                          defaultChecked={defaultPayment === opt.value}
                          className="shrink-0"
                        />
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span className="pl-6 text-xs opacity-80">{opt.hint}</span>
                      ) : null}
                    </label>
                  ))}

                  {subscriptionActive ? (
                    <label className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-[var(--brand-soft)]">
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="subscription"
                          defaultChecked={defaultPayment === "subscription"}
                          className="shrink-0"
                        />
                        <span>
                          Utiliser mon abonnement
                          <span className="mt-0.5 block text-xs font-normal opacity-80">
                            {remainingSessionsThisWeek} seance
                            {remainingSessionsThisWeek !== 1 ? "s" : ""} restante
                            {remainingSessionsThisWeek !== 1 ? "s" : ""} cette semaine
                          </span>
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="rounded-md border border-dashed border-[var(--border-soft)] bg-white/60 px-2 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <label className="flex min-w-0 flex-1 cursor-not-allowed items-start gap-2 opacity-55">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="subscription"
                            disabled
                            className="pointer-events-none mt-0.5 shrink-0"
                          />
                          <span className="text-sm">
                            Utiliser mon abonnement
                            <span className="mt-1 block text-xs font-normal opacity-90">
                              Indisponible tant que votre abonnement n&apos;est pas rattache.
                            </span>
                          </span>
                        </label>
                        <ReserverSubscriptionUnlock
                          dateIso={dateIso}
                          slotId={selectedSlotForForm.id}
                          subscriptionId={subscriptionIdParam || undefined}
                          defaultEmail={emailParam}
                        />
                      </div>
                    </div>
                  )}
                </fieldset>
                {!subscriptionActive ? (
                  <p className="text-xs opacity-80">
                    Pas encore d&apos;abonnement ? Rendez-vous sur la page Abonnement pour souscrire un
                    forfait.
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
              <ReserverQueryLink
                href={`/reserver?date=${selectedDateKey}&type=${bookingGroup}`}
                className="mt-3 inline-block text-sm opacity-80 underline"
              >
                Annuler
              </ReserverQueryLink>
            </section>
          ) : null}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <OfferCard
            label="Cours collectifs"
            title="Yoga collectif en ligne"
            description="40 minutes en petit groupe. Premiere seance offerte."
            imageUrl={landing.collectiveOfferImageUrl}
            imageAlt="Cours de yoga collectif en ligne depuis chez soi"
            meta={["40 min", "Mardi & vendredi midi", "En ligne", "5 pers. max", "Presentiel Poissy"]}
            href="#choisir-creneau"
            cta="Choisir un creneau"
            variant="primary"
          />
          <OfferCard
            label="Yoga individuel"
            title="Accompagnement individuel"
            description="Un espace personnalise en visio, adapte a votre rythme."
            imageUrl={landing.individualOfferImageUrl}
            imageAlt="Cours de yoga individuel en ligne avec la professeure"
            meta={["1h", "En ligne", "Presentiel Poissy"]}
            href="#choisir-creneau"
            cta="Choisir un creneau"
          />
        </section>

        <div className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
          <p>
            <strong className="text-[var(--foreground)]">Collectif :</strong> 12 EUR/seance, abonnement 39 EUR/mois. Premiere seance offerte.
          </p>
          <p>
            <strong className="text-[var(--foreground)]">Individuel :</strong> decouverte 15 EUR, seance 35 EUR, abonnement 129 EUR/mois.
          </p>
        </div>

        {landing.presentielOfferImageUrl ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--beige)] md:grid md:grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={landing.presentielOfferImageUrl}
              alt="Cours de yoga en presentiel a Poissy"
              className="h-56 w-full object-cover md:h-full"
              loading="lazy"
            />
            <div className="flex flex-col justify-center gap-3 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--terracotta)]">
                Presentiel
              </p>
              <h2 className="font-display text-xl font-medium">Cours a Poissy et alentours</h2>
              <p className="text-sm text-[var(--muted)]">
                Seances en petit groupe ou en individuel sur place, en complement des cours en ligne.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
