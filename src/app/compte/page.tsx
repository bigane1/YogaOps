export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberCreditStatus } from "@/generated/prisma/enums";
import { SiteNav } from "@/components/site-nav";
import { MemberSubnav } from "@/components/member-subnav";
import { cancelMemberBooking, logoutMember } from "@/app/member-actions";
import { getCurrentMember, memberDisplayName } from "@/lib/member-auth";
import { formatDateFR, formatTimeFR, toSiteDateKey } from "@/lib/db";
import { siteDayEndUtc, siteDayStartUtc } from "@/lib/site-timezone";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    cancelled?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

function isValidDateKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidMonthKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function ComptePage({ searchParams }: Props) {
  const member = await getCurrentMember();
  if (!member) redirect("/compte/connexion?next=/compte");
  const params = await searchParams;

  const now = new Date();
  const monthFilter = isValidMonthKey(params.month) ? params.month : "";
  const fromFilter = isValidDateKey(params.from) ? params.from : "";
  const toFilter = isValidDateKey(params.to) ? params.to : "";

  let rangeStart: Date | undefined;
  let rangeEnd: Date | undefined;
  if (fromFilter || toFilter) {
    rangeStart = fromFilter ? siteDayStartUtc(fromFilter) : undefined;
    rangeEnd = toFilter ? siteDayEndUtc(toFilter) : undefined;
  } else if (monthFilter) {
    const [y, m] = monthFilter.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    rangeStart = siteDayStartUtc(`${monthFilter}-01`);
    rangeEnd = siteDayEndUtc(
      `${monthFilter}-${String(lastDay).padStart(2, "0")}`,
    );
  }

  const startsAtFilter =
    rangeStart || rangeEnd
      ? {
          ...(rangeStart ? { gte: rangeStart } : {}),
          ...(rangeEnd ? { lt: rangeEnd } : {}),
        }
      : undefined;

  const [cards, bookings] = await Promise.all([
    prisma.memberCreditCard.findMany({
      where: { memberId: member.id },
      include: { pack: true },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        memberId: member.id,
        ...(startsAtFilter ? { slot: { startsAt: startsAtFilter } } : {}),
      },
      include: { slot: { include: { course: true } } },
      orderBy: { slot: { startsAt: "asc" } },
      take: 200,
    }),
  ]);

  const activeCards = cards.filter(
    (c) =>
      c.status === MemberCreditStatus.active &&
      c.remainingCredits > 0 &&
      c.expiresAt >= now,
  );
  const totalCredits = activeCards.reduce((sum, c) => sum + c.remainingCredits, 0);

  const upcoming = bookings.filter(
    (b) =>
      (b.status === "pending" || b.status === "confirmed") &&
      b.slot.startsAt >= now,
  );
  const history = bookings.filter(
    (b) => b.status === "cancelled" || b.slot.startsAt < now,
  );

  const byMonth = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = toSiteDateKey(b.slot.startsAt).slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(b);
    byMonth.set(key, list);
  }
  const monthKeys = [...byMonth.keys()].sort((a, b) => b.localeCompare(a));

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: monthLabel(key) };
  });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8">
        <p className="text-sm text-[var(--muted)]">Bonjour {memberDisplayName(member)}</p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Mon compte</h1>
        <MemberSubnav />
        <form action={logoutMember} className="mt-3">
          <button type="submit" className="brand-btn-secondary rounded-md px-3 py-1.5 text-sm">
            Se déconnecter
          </button>
        </form>

        {params.cancelled ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Réservation annulée. Le créneau est libéré. Le crédit n&apos;est pas remboursé.
          </p>
        ) : null}

        <section className="brand-card mt-8 rounded-xl p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-medium">Mes crédits</h2>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{totalCredits}</p>
              <p className="text-sm text-[var(--muted)]">
                crédit{totalCredits !== 1 ? "s" : ""} disponible
                {totalCredits !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/compte/cartes" className="brand-btn-secondary rounded-lg px-4 py-2 text-sm">
                Voir mes cartes
              </Link>
              <Link href="/reserver" className="brand-btn rounded-lg px-4 py-2 text-sm">
                Réserver une séance
              </Link>
            </div>
          </div>
          {activeCards.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Aucune carte active.{" "}
              <Link href="/compte/cartes" className="underline underline-offset-2">
                Acheter une carte
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {activeCards.map((card) => (
                <li
                  key={card.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--beige)] px-3 py-2"
                >
                  <span>
                    <strong>{card.pack.name}</strong> — {card.remainingCredits}/
                    {card.totalCredits} crédits
                  </span>
                  <span className="text-[var(--muted)]">
                    expire le{" "}
                    {card.expiresAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="brand-card mt-8 rounded-xl p-5">
          <h2 className="font-display text-xl font-medium">Mes cours</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Filtrez par mois ou entre deux dates.
          </p>
          <form className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-[var(--muted)] sm:col-span-2">
              Mois
              <select
                name="month"
                defaultValue={monthFilter}
                className="brand-field rounded-md px-3 py-2 text-sm"
              >
                <option value="">Tous / plage de dates</option>
                {monthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Du
              <input
                name="from"
                type="date"
                defaultValue={fromFilter}
                className="brand-field rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Au
              <input
                name="to"
                type="date"
                defaultValue={toFilter}
                className="brand-field rounded-md px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 text-sm sm:col-span-2"
            >
              Afficher
            </button>
          </form>
          {(monthFilter || fromFilter || toFilter) && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              <Link href="/compte" className="underline underline-offset-2">
                Réinitialiser les filtres
              </Link>
            </p>
          )}
        </section>

        {!monthFilter && !fromFilter && !toFilter ? (
          <>
            <section className="mt-8">
              <h2 className="font-display text-xl font-medium">À venir</h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Pas de réservation à venir.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.map((b) => (
                    <BookingRow key={b.id} booking={b} now={now} showCancel />
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8">
              <h2 className="font-display text-xl font-medium">Historique</h2>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Aucun cours passé pour le moment.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {history.slice(0, 12).map((b) => (
                    <BookingRow key={b.id} booking={b} now={now} />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <section className="mt-8">
            <h2 className="font-display text-xl font-medium">
              Résultats ({bookings.length})
            </h2>
            {bookings.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Aucun cours sur cette période.</p>
            ) : (
              <div className="mt-4 space-y-6">
                {monthKeys.map((key) => (
                  <div key={key}>
                    <h3
                      className="text-sm font-semibold uppercase tracking-wide"
                      style={{ color: "var(--brand)" }}
                    >
                      {monthLabel(key)}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {(byMonth.get(key) ?? []).map((b) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          now={now}
                          showCancel={
                            (b.status === "pending" || b.status === "confirmed") &&
                            b.slot.startsAt >= now
                          }
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function BookingRow({
  booking: b,
  now,
  showCancel = false,
}: {
  booking: {
    id: string;
    status: string;
    paymentMethod: string;
    slot: {
      startsAt: Date;
      course: { title: string };
    };
  };
  now: Date;
  showCancel?: boolean;
}) {
  const isPast = b.slot.startsAt < now;
  const cancelled = b.status === "cancelled";

  return (
    <li
      className={`brand-card flex flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
        cancelled || isPast ? "opacity-90" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{b.slot.course.title}</p>
        <p
          className="mt-1 font-display text-lg font-semibold tabular-nums"
          style={{ color: "var(--brand)" }}
        >
          {formatTimeFR(b.slot.startsAt)}
        </p>
        <p className="text-[var(--muted)]">{formatDateFR(b.slot.startsAt)}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {cancelled
            ? "Annulé"
            : isPast
              ? "Terminé"
              : b.paymentMethod === "credit_pack"
                ? "Payé avec une carte de crédits"
                : b.status === "pending"
                  ? "Paiement en attente"
                  : "Confirmée"}
        </p>
      </div>
      {showCancel ? (
        <form action={cancelMemberBooking} className="shrink-0">
          <input type="hidden" name="bookingId" value={b.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100"
          >
            Annuler
          </button>
        </form>
      ) : null}
    </li>
  );
}
