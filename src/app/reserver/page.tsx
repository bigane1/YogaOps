export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { OfferCard } from "@/components/site-ui";
import { ReserverQueryLink } from "@/components/reserver-query-link";
import { reserveSlot } from "@/app/actions";
import { MemberCreditStatus } from "@/generated/prisma/enums";
import {
  ensureSeedData,
  formatSiteDate,
  formatTimeFR,
  siteDayEndUtc,
  siteDayStartUtc,
  startOfSiteDay,
  toSiteDateKey,
} from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";
import { buildTelUrl, buildWhatsAppUrl, formatPhoneDisplay } from "@/lib/contact-links";
import { packMatchesCourseType } from "@/lib/credits";
import { getCurrentMember, isMemberProfileComplete, memberDisplayName } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
  const member = await getCurrentMember();
  const params = await searchParams;
  const todayStart = startOfSiteDay();
  const todayKey = toSiteDateKey(new Date());
  const typeParam = params.type ? String(params.type) : "";
  const typeSelected =
    typeParam === "collective" || typeParam === "techWomen" || typeParam === "individual";
  const bookingGroup = resolveReserverBookingGroup(typeParam || undefined);
  const enabledWeekdays = getReserverWeekdaysForGroup(bookingGroup, landing);
  const selectedDateKey = params.date ?? todayKey;
  const selectedDate = siteDayStartUtc(selectedDateKey);
  const selectedSlotId = params.slotId ? String(params.slotId) : null;
  const errorParam = params.error ? String(params.error) : "";
  const typeQuery = `&type=${bookingGroup}`;

  const allDays = Array.from({ length: 14 }, (_, idx) => {
    const day = new Date(todayStart);
    day.setUTCDate(day.getUTCDate() + idx);
    return day;
  });
  const horizonEnd = new Date(todayStart);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 14);

  const upcomingSlots = typeSelected
    ? await prisma.timeSlot.findMany({
        where: {
          startsAt: { gte: todayStart, lt: horizonEnd },
          available: { gt: 0 },
          course: { isWorkshop: false, isActive: true },
        },
        include: { course: true },
        orderBy: { startsAt: "asc" },
      })
    : [];

  const slotDayKeys = new Set(
    upcomingSlots
      .filter(
        (slot) =>
          matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch) === bookingGroup,
      )
      .map((slot) => toSiteDateKey(slot.startsAt)),
  );

  const visibleDays = typeSelected
    ? getVisibleReserverDays(allDays, enabledWeekdays, slotDayKeys, toSiteDateKey)
    : [];

  if (
    typeSelected &&
    bookingGroup !== "individual" &&
    visibleDays.length > 0 &&
    !visibleDays.some((d) => toSiteDateKey(d) === selectedDateKey)
  ) {
    const firstVisible = toSiteDateKey(visibleDays[0]);
    const slotQuery = selectedSlotId ? `&slotId=${encodeURIComponent(selectedSlotId)}` : "";
    redirect(`/reserver?date=${firstVisible}${typeQuery}${slotQuery}`);
  }

  const dayStart = selectedDate;
  const dayEnd = siteDayEndUtc(selectedDateKey);
  const loadDaySlots = typeSelected && bookingGroup !== "individual";

  const slotsRaw = loadDaySlots
    ? await prisma.timeSlot.findMany({
        where: {
          startsAt: { gte: dayStart, lt: dayEnd },
          available: { gt: 0 },
          course: { isWorkshop: false, isActive: true },
        },
        include: { course: true },
        orderBy: { startsAt: "asc" },
      })
    : [];

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

  /** Deep link avec slotId : afficher le formulaire même si le créneau n'est plus listé. */
  const selectedSlotForForm =
    loadDaySlots
      ? selectedSlot ??
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
          : null)
      : null;

  const memberCards = member
    ? await prisma.memberCreditCard.findMany({
        where: {
          memberId: member.id,
          status: MemberCreditStatus.active,
          remainingCredits: { gt: 0 },
          expiresAt: { gt: new Date() },
        },
        include: { pack: true },
        orderBy: { expiresAt: "asc" },
      })
    : [];

  const phoneDisplay = formatPhoneDisplay(landing.footerPhone);
  const telHref = buildTelUrl(landing.footerPhone);
  const whatsappHref = buildWhatsAppUrl(
    landing.footerPhone,
    "Bonjour Basma, je souhaite prendre rendez-vous pour une séance individuelle YogaOps.",
  );

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <h1 className="section-title">Réserver un cours</h1>
        <p className="section-subtitle mt-3">
          Choisissez un créneau, puis payez à la séance (CB) ou avec une carte de crédits.
        </p>

        {!member ? (
          <div className="brand-card mt-6 rounded-xl p-5">
            <p className="font-medium">Connexion requise pour réserver</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Créez un compte ou connectez-vous pour payer une séance ou utiliser vos crédits.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/compte/connexion?next=${encodeURIComponent("/reserver")}`}
                className="brand-btn rounded-lg px-4 py-2 text-sm"
              >
                Se connecter
              </Link>
              <Link
                href={`/compte/inscription?next=${encodeURIComponent("/reserver")}`}
                className="brand-btn-secondary rounded-lg px-4 py-2 text-sm"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        ) : !isMemberProfileComplete(member) || !member.profileComplete ? (
          <div className="brand-card mt-6 rounded-xl p-5">
            <p className="font-medium">Complétez votre profil</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Nom, prénom et téléphone sont nécessaires avant une réservation.
            </p>
            <Link
              href={`/compte/profil?next=${encodeURIComponent("/reserver")}`}
              className="brand-btn mt-4 inline-flex rounded-lg px-4 py-2 text-sm"
            >
              Compléter mon profil
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Connectée en tant que <strong>{memberDisplayName(member)}</strong> ({member.email})
          </p>
        )}

        {errorParam === "stripe_checkout" ? (
          <p className="brand-alert mt-6 rounded-lg p-3 text-sm">
            Le paiement en ligne n&apos;a pas pu être initialisé. Vérifiez Stripe puis réessayez.
          </p>
        ) : null}

        <section className="mt-8">
          {typeSelected ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-medium">Offre choisie</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {bookingGroupLabels[bookingGroup]}
                  </p>
                </div>
                <Link
                  href="/reserver"
                  className="text-sm underline underline-offset-2 text-[var(--muted)]"
                >
                  Changer d&apos;offre
                </Link>
              </div>
              <div className="mt-6 max-w-md">
                {bookingGroup === "collective" ? (
                  <OfferCard
                    label={landing.offerCollectiveLabel}
                    title={landing.offerCollectiveTitle}
                    description={landing.offerCollectiveDescription}
                    imageUrl={landing.collectiveOfferImageUrl}
                    imageAlt="Cours de yoga collectif en ligne"
                    meta={landing.offerCollectiveMeta}
                    href="/reserver?type=collective#creneaux"
                    selected
                  />
                ) : null}
                {bookingGroup === "techWomen" ? (
                  <OfferCard
                    label={landing.offerTechLabel}
                    title={landing.offerTechTitle}
                    description={landing.offerTechDescription}
                    imageUrl={landing.techWomenOfferImageUrl}
                    imageAlt="Séance Femmes Tech en ligne"
                    meta={landing.offerTechMeta}
                    href="/reserver?type=techWomen#creneaux"
                    selected
                  />
                ) : null}
                {bookingGroup === "individual" ? (
                  <OfferCard
                    label={landing.offerIndividualLabel}
                    title={landing.offerIndividualTitle}
                    description={landing.offerIndividualDescription}
                    imageUrl={landing.individualOfferImageUrl}
                    imageAlt="Accompagnement individuel en yoga"
                    meta={landing.offerIndividualMeta}
                    href="/reserver?type=individual#creneaux"
                    selected
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-medium">Choisir une offre</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Chaque type de cours a son parcours. Cliquez sur une offre pour voir les créneaux.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <OfferCard
                  label={landing.offerCollectiveLabel}
                  title={landing.offerCollectiveTitle}
                  description={landing.offerCollectiveDescription}
                  imageUrl={landing.collectiveOfferImageUrl}
                  imageAlt="Cours de yoga collectif en ligne"
                  meta={landing.offerCollectiveMeta}
                  href="/reserver?type=collective#creneaux"
                />
                <OfferCard
                  label={landing.offerTechLabel}
                  title={landing.offerTechTitle}
                  description={landing.offerTechDescription}
                  imageUrl={landing.techWomenOfferImageUrl}
                  imageAlt="Séance Femmes Tech en ligne"
                  meta={landing.offerTechMeta}
                  href="/reserver?type=techWomen#creneaux"
                />
                <OfferCard
                  label={landing.offerIndividualLabel}
                  title={landing.offerIndividualTitle}
                  description={landing.offerIndividualDescription}
                  imageUrl={landing.individualOfferImageUrl}
                  imageAlt="Accompagnement individuel en yoga"
                  meta={landing.offerIndividualMeta}
                  href="/reserver?type=individual#creneaux"
                />
              </div>
              <div className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2 lg:grid-cols-3">
                <p>
                  <strong className="text-[var(--foreground)]">Collectif :</strong> séance à
                  l&apos;unité ou carte de crédits.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">Femmes Tech :</strong> séance à
                  l&apos;unité ou carte de crédits.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">Individuel :</strong> séance à
                  l&apos;unité, découverte ou carte de crédits.
                </p>
              </div>
            </>
          )}
        </section>

        {typeSelected ? (
          <section id="creneaux" className="booking-panel mt-8 scroll-mt-24">
            <h2 className="font-display text-lg font-medium">
              {bookingGroup === "individual"
                ? "Prendre rendez-vous"
                : `Créneaux — ${bookingGroupLabels[bookingGroup]}`}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {bookingGroup === "individual"
                ? "Pas de créneau fixe : on convient ensemble d'un horaire adapté."
                : bookingGroup === "techWomen"
                  ? "Séances Femmes Tech : vendredis uniquement."
                  : "Séances collectives : mardis uniquement."}
            </p>

            {bookingGroup === "individual" ? (
              <div className="brand-card mt-6 rounded-xl p-5">
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Séance à l&apos;unité :</strong> paiement CB
                  </li>
                  <li>
                    <strong>Carte de crédits :</strong> 1 crédit = 1 séance
                  </li>
                  <li>
                    <strong>Cours découverte :</strong> tarif défini par la professeure
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={telHref} className="brand-btn inline-flex justify-center rounded-lg px-5 py-2.5">
                    Appeler {phoneDisplay}
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="brand-btn-secondary inline-flex justify-center rounded-lg px-5 py-2.5"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70 md:text-sm md:normal-case md:tracking-normal">
                    Choisir une date
                  </p>
                  {visibleDays.length === 0 ? (
                    <div className="brand-alert rounded-xl p-4 text-sm">
                      <p>
                        Aucun créneau publié pour « {bookingGroupLabels[bookingGroup]} » dans les
                        2 prochaines semaines.
                      </p>
                      <p className="mt-2 opacity-90">
                        {bookingGroup === "techWomen" ? (
                          <>
                            Dans le backoffice → Créneaux, créez un créneau sur un cours dont le
                            titre contient « {landing.reserverTechWomenMatch} », avec des places
                            disponibles.
                          </>
                        ) : (
                          <>
                            Dans le backoffice → Créneaux, créez un créneau pour ce type de cours,
                            avec des places disponibles.
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--muted)]">
                        Seuls les jours avec créneau disponible sont affichés.
                      </p>
                      <div className="-mx-4 px-4 md:mx-0 md:px-0">
                        <div className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-hidden pb-1 md:flex-wrap md:overflow-visible">
                          {visibleDays.map((d) => {
                            const iso = toSiteDateKey(d);
                            const isActive = iso === selectedDateKey;
                            const isPast = iso < todayKey;
                            if (isPast) {
                              return (
                                <span
                                  key={iso}
                                  className="shrink-0 cursor-not-allowed rounded-xl px-4 py-3 text-center text-sm opacity-40 md:rounded-lg md:px-3 md:py-2"
                                  aria-disabled="true"
                                >
                                  <span className="block whitespace-nowrap capitalize">
                                    {formatSiteDate(d, { weekday: "short" })}
                                  </span>
                                  <span className="block whitespace-nowrap text-xs md:text-sm">
                                    {formatSiteDate(d, { day: "2-digit", month: "short" })}
                                  </span>
                                </span>
                              );
                            }
                            return (
                              <ReserverQueryLink
                                key={iso}
                                href={`/reserver?date=${iso}${typeQuery}#creneaux`}
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
                    </>
                  )}
                </div>

                {visibleDays.length > 0 ? (
                <>
                <p className="mt-6 text-xs font-medium uppercase tracking-wide opacity-70 md:mt-8 md:text-sm md:normal-case md:tracking-normal">
                  Créneaux disponibles
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
                  {slots.length === 0 ? (
                    <div className="brand-alert rounded-xl p-4 sm:col-span-2">
                      <p>
                        Aucun créneau disponible pour cette date dans «{" "}
                        {bookingGroupLabels[bookingGroup]} ».
                      </p>
                      {otherGroupsWithSlots.length > 0 ? (
                        <p className="mt-2 text-sm opacity-90">
                          Des créneaux existent ce jour-là dans :{" "}
                          {otherGroupsWithSlots
                            .map((group) => bookingGroupLabels[group])
                            .join(", ")}
                          . Choisissez une autre offre ci-dessus.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm opacity-90">
                          Vérifiez dans le backoffice que le créneau est bien publié, avec des
                          places disponibles, et que le type de cours correspond à l&apos;offre
                          choisie.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isOnline = slot.course.location === "en_ligne";
                    const placesLeft = slot.available;
                    return (
                      <article
                        key={slot.id}
                        className={`brand-card rounded-xl p-4 md:p-5 ${
                          isSelected
                            ? "ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--background)]"
                            : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-display text-2xl font-semibold tabular-nums tracking-tight"
                              style={{ color: "var(--brand)" }}
                            >
                              {formatTimeFR(slot.startsAt)}
                            </p>
                            <h3 className="mt-1 text-base font-medium leading-snug sm:text-lg">
                              {slot.course.title}
                            </h3>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              {slot.course.durationMin} min · {slot.course.priceEur} € ·{" "}
                              {isOnline ? "En ligne" : "Présentiel"} ·{" "}
                              {slot.course.type === "individuel" ? "Individuel" : "Collectif"}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {placesLeft <= 0
                                ? "Complet"
                                : placesLeft === 1
                                  ? "1 place restante"
                                  : `${placesLeft} places restantes`}
                              {slot.course.acceptsCreditPayment
                                ? " · Ouvert aux cartes de crédits"
                                : ""}
                              {slot.course.acceptsUnitPayment ? " · Paiement à l'unité" : ""}
                            </p>
                          </div>
                          <span className="brand-badge-ok shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium sm:px-3 sm:text-xs">
                            {isOnline ? "En ligne (Zoom)" : "Présentiel"}
                          </span>
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
                            href={`/reserver?date=${selectedDateKey}&type=${bookingGroup}&slotId=${slot.id}#creneaux`}
                            className={`brand-btn-sm inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium md:w-auto md:py-2 ${
                              isSelected ? "brand-btn" : "brand-btn-secondary"
                            }`}
                          >
                            {isSelected
                              ? "Créneau sélectionné — continuer"
                              : "Choisir ce créneau"}
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
                        Créneau ouvert via un lien direct. Vérifiez le type de cours avant de
                        confirmer.
                      </p>
                    ) : null}
                    {(() => {
                      const canUnit = selectedSlotForForm.course.acceptsUnitPayment;
                      const canCredit = selectedSlotForForm.course.acceptsCreditPayment;
                      const eligibleCards = memberCards.filter((card) =>
                        packMatchesCourseType(
                          card.pack.eligibility,
                          selectedSlotForForm.course.type,
                        ),
                      );
                      const defaultPayment =
                        canCredit && eligibleCards.length > 0
                          ? "credit_pack"
                          : canUnit
                            ? "stripe"
                            : "credit_pack";
                      const canBook =
                        !!member &&
                        isMemberProfileComplete(member) &&
                        member.profileComplete;

                      return (
                        <form action={reserveSlot} className="mt-4 grid gap-3 max-w-xl">
                          <input type="hidden" name="slotId" value={selectedSlotForForm.id} />
                          {!canBook ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                              Connectez-vous pour finaliser la réservation.
                            </p>
                          ) : (
                            <p className="rounded-lg bg-[var(--beige)] px-3 py-2 text-sm">
                              Réservation pour <strong>{memberDisplayName(member)}</strong> ·{" "}
                              {member.email}
                            </p>
                          )}
                          <fieldset className="grid gap-2 rounded-lg border border-[var(--border-soft)] p-3">
                            <legend className="px-1 text-sm font-medium opacity-90">
                              Mode de paiement
                            </legend>

                            {canCredit ? (
                              eligibleCards.length > 0 ? (
                                <div className="space-y-2 rounded-md px-2 py-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="radio"
                                      name="paymentMethod"
                                      value="credit_pack"
                                      defaultChecked={defaultPayment === "credit_pack"}
                                      className="shrink-0"
                                      disabled={!canBook}
                                    />
                                    Utiliser une carte de crédits (1 crédit)
                                  </label>
                                  <select
                                    name="creditCardId"
                                    className="brand-field ml-6 max-w-md rounded-md px-3 py-2 text-sm"
                                    defaultValue={eligibleCards[0]?.id}
                                    disabled={!canBook}
                                  >
                                    {eligibleCards.map((card) => (
                                      <option key={card.id} value={card.id}>
                                        {card.pack.name} — {card.remainingCredits} crédit
                                        {card.remainingCredits > 1 ? "s" : ""} restant
                                        {card.remainingCredits > 1 ? "s" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <p className="px-2 text-sm text-[var(--muted)]">
                                  Aucune carte éligible.{" "}
                                  <Link
                                    href="/compte/cartes"
                                    className="underline underline-offset-2"
                                  >
                                    Acheter une carte
                                  </Link>
                                </p>
                              )
                            ) : null}

                            {canUnit ? (
                              <label className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-[var(--brand-soft)]">
                                <span className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="stripe"
                                    defaultChecked={defaultPayment === "stripe"}
                                    className="shrink-0"
                                    disabled={!canBook}
                                  />
                                  Séance à l&apos;unité — {selectedSlotForForm.course.priceEur} €
                                  (carte bancaire)
                                </span>
                              </label>
                            ) : null}
                          </fieldset>
                          <p className="text-xs text-[var(--muted)]">
                            Paiement CB uniquement. Annulation : créneau libéré, crédit non
                            remboursé.
                          </p>
                          <button
                            type="submit"
                            disabled={!canBook}
                            className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                        </form>
                      );
                    })()}
                    <ReserverQueryLink
                      href={`/reserver?date=${selectedDateKey}&type=${bookingGroup}#creneaux`}
                      className="mt-3 inline-block text-sm opacity-80 underline"
                    >
                      Annuler
                    </ReserverQueryLink>
                  </section>
                ) : null}
                </>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {landing.presentielOfferImageUrl ? (
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--beige)] md:grid md:grid-cols-2">
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
                Seances en petit groupe ou en individuel sur place, en complement des cours en
                ligne.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
