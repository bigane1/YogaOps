export const dynamic = "force-dynamic";

import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, updateBookingStatus, updateBookingZoomLink, updateSlot } from "@/app/actions";
import { addDays, ensureSeedData, formatSiteDate, formatTimeFR, startOfDay, toSiteDateKey } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { bookingStatusLabelFr, paymentMethodLabelFr } from "@/lib/labels-fr";

const fieldSm = "brand-field rounded px-2 py-1 text-sm";

type Props = {
  searchParams: Promise<{
    status?: string;
    type?: string;
    payment?: string;
    q?: string;
  }>;
};

export default async function AdminPlanningPage({ searchParams }: Props) {
  await ensureSeedData();
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";
  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
            Backoffice prof
          </h1>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input name="pin" type="password" required placeholder="Code admin" className="brand-field w-full rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const typeFilter = params.type ?? "all";
  const paymentFilter = params.payment ?? "all";
  const q = (params.q ?? "").trim().toLowerCase();

  const today = startOfDay(new Date());
  const weekStart = (() => {
    const d = new Date(today);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(d, mondayOffset);
  })();
  const weekEnd = addDays(weekStart, 7);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const [weekSlots, weekBookings] = await Promise.all([
    prisma.timeSlot.findMany({
      where: { startsAt: { gte: weekStart, lt: weekEnd } },
      include: { course: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { slot: { startsAt: { gte: weekStart, lt: weekEnd } } },
      include: { slot: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Planning (7 jours)
        </h1>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">
            Deconnexion
          </button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-4">
          <form className="grid gap-2 sm:grid-cols-4">
            <select name="status" defaultValue={statusFilter} className="brand-field rounded-md px-3 py-2 text-sm">
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <select name="type" defaultValue={typeFilter} className="brand-field rounded-md px-3 py-2 text-sm">
              <option value="all">Tous types</option>
              <option value="individuel">Individuel</option>
              <option value="collectif">Collectif</option>
            </select>
            <select name="payment" defaultValue={paymentFilter} className="brand-field rounded-md px-3 py-2 text-sm">
              <option value="all">Tous paiements</option>
              <option value="stripe">Carte en ligne (Stripe)</option>
              <option value="on_site">Sur place</option>
              <option value="subscription">Abonnement</option>
            </select>
            <input name="q" defaultValue={q} placeholder="Nom, email, reference" className="brand-field rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-md px-3 py-2 text-sm">
              Filtrer
            </button>
          </form>
        </section>

        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {weekDays.map((d) => {
            const iso = toSiteDateKey(d);
            const daySlots = weekSlots.filter((s) => toSiteDateKey(s.startsAt) === iso);
            return (
              <div key={iso} className="w-[330px] shrink-0 rounded-lg border border-[var(--border-soft)] bg-white/80 p-3">
                <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                  {formatSiteDate(d, { weekday: "short", day: "2-digit", month: "2-digit" })}
                </div>
                <div className="mt-3 space-y-3">
                  {daySlots.map((slot) => {
                    const bookingsForSlot = weekBookings
                      .filter((b) => b.slotId === slot.id)
                      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
                      .filter((b) => (typeFilter === "all" ? true : b.slot.course.type === typeFilter))
                      .filter((b) => (paymentFilter === "all" ? true : b.paymentMethod === paymentFilter))
                      .filter((b) =>
                        q
                          ? [b.customerName, b.customerEmail, b.id].join(" ").toLowerCase().includes(q)
                          : true
                      )
                      .sort((a, b) => {
                        if (a.status === "pending" && b.status !== "pending") return -1;
                        if (a.status !== "pending" && b.status === "pending") return 1;
                        return 0;
                      });

                    const cancelledCount = bookingsForSlot.filter((b) => b.status === "cancelled").length;
                    const visibleBookings = bookingsForSlot.filter((b) => b.status !== "cancelled");
                    const cancelledBookings = bookingsForSlot.filter((b) => b.status === "cancelled");

                    return (
                      <div key={slot.id} className="rounded-md border border-[var(--border-soft)] bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{formatTimeFR(slot.startsAt)}</div>
                            <div className="text-xs opacity-85">{slot.course.title}</div>
                          </div>
                          <div className="text-xs rounded-full px-2 py-0.5 brand-badge-muted">reste {slot.available}</div>
                        </div>

                        {/* Zoom du créneau — se propage à toutes les réservations confirmées */}
                        <form action={updateSlot} className="mt-2 flex gap-1">
                          <input type="hidden" name="id" value={slot.id} />
                          <input type="hidden" name="startsAt" value={slot.startsAt.toISOString()} />
                          <input type="hidden" name="available" value={slot.available} />
                          <input type="hidden" name="booked" value={slot.booked} />
                          <input
                            name="zoomLink"
                            type="url"
                            placeholder="Zoom du créneau (propagé à tous)"
                            defaultValue={slot.zoomLink ?? ""}
                            className={`${fieldSm} flex-1 text-xs`}
                          />
                          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded px-2 py-1 text-[11px] whitespace-nowrap">
                            Définir Zoom
                          </button>
                        </form>

                        <div className="mt-2 space-y-2">
                          {visibleBookings.map((booking) => (
                            <details key={booking.id} className="rounded-md border border-[var(--border-soft)] bg-[#fcfafe] p-2">
                              <summary className="cursor-pointer list-none">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium">{booking.customerName}</p>
                                    <p className="truncate text-[11px] opacity-70">{booking.customerEmail}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <span className="rounded-full bg-[#eee] px-2 py-0.5 text-[11px]">
                                      {paymentMethodLabelFr(booking.paymentMethod)}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${booking.status === "confirmed" ? "brand-badge-ok" : "brand-alert"}`}>
                                      {bookingStatusLabelFr(booking.status)}
                                    </span>
                                  </div>
                                </div>
                              </summary>
                              <div className="mt-2 border-t border-[var(--border-soft)] pt-2">
                                <p className="text-[11px] opacity-75">Ref: {booking.id}</p>
                                <form action={updateBookingZoomLink} className="mt-2 grid gap-2">
                                  <input type="hidden" name="bookingId" value={booking.id} />
                                  <input name="zoomLink" type="url" placeholder="https://zoom.us/j/..." defaultValue={booking.zoomLink ?? booking.slot.zoomLink ?? ""} className={fieldSm} />
                                  <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1 text-[12px]">
                                    Enregistrer Zoom
                                  </button>
                                </form>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {booking.status !== "confirmed" ? (
                                    <form action={updateBookingStatus}>
                                      <input type="hidden" name="bookingId" value={booking.id} />
                                      <input type="hidden" name="targetStatus" value="confirmed" />
                                      <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1 text-[12px]">Accepter</button>
                                    </form>
                                  ) : null}
                                  {booking.status !== "cancelled" ? (
                                    <form action={updateBookingStatus}>
                                      <input type="hidden" name="bookingId" value={booking.id} />
                                      <input type="hidden" name="targetStatus" value="cancelled" />
                                      <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-[12px] text-red-800 hover:bg-red-100">Annuler</button>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            </details>
                          ))}

                          {cancelledCount > 0 ? (
                            <details className="rounded-md border border-[var(--border-soft)] bg-[#f8f8fb] p-2">
                              <summary className="cursor-pointer text-xs opacity-80">Annulees ({cancelledCount})</summary>
                              <div className="mt-2 space-y-1">
                                {cancelledBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between text-[11px]">
                                    <span className="truncate">{booking.customerName}</span>
                                    <span className="opacity-70">{paymentMethodLabelFr(booking.paymentMethod)}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
