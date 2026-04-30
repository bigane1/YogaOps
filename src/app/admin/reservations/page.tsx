export const dynamic = "force-dynamic";

import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, updateBookingStatus, updateBookingZoomLink } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { bookingStatusLabelFr, paymentMethodLabelFr } from "@/lib/labels-fr";

const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export default async function AdminReservationsPage() {
  await ensureSeedData();
  const isLogged = (await cookies()).get("yogaops_admin")?.value === "1";
  if (!isLogged) {
    return (
      <div className="page-shell">
        <SiteNav />
        <main className="mx-auto w-full max-w-xl px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Backoffice prof</h1>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input name="pin" type="password" required placeholder="Code admin" className="brand-field w-full rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">Se connecter</button>
          </form>
        </main>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    include: { slot: { include: { course: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Reservations</h1>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">Deconnexion</button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-6">
          <ul className="space-y-3 text-sm">
            {bookings.map((booking) => (
              <li key={booking.id} className="brand-list-item p-3">
                <p className="opacity-90">
                  {booking.customerName} - {booking.customerEmail} - {booking.slot.course.title} - {formatDateFR(booking.slot.startsAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[#eee] px-2 py-0.5">Paiement: {paymentMethodLabelFr(booking.paymentMethod)}</span>
                  <span className={`rounded-full px-2 py-0.5 ${booking.status === "confirmed" ? "brand-badge-ok" : booking.status === "cancelled" ? "brand-badge-muted" : "brand-alert"}`}>
                    Statut: {bookingStatusLabelFr(booking.status)}
                  </span>
                </div>
                <form action={updateBookingZoomLink} className="mt-2 grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input name="zoomLink" type="url" placeholder="https://zoom.us/j/..." defaultValue={booking.zoomLink ?? booking.slot.zoomLink ?? ""} className={`sm:col-span-3 ${fieldSm}`} />
                  <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1">Enregistrer lien Zoom</button>
                </form>
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.status !== "confirmed" ? (
                    <form action={updateBookingStatus}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="targetStatus" value="confirmed" />
                      <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1">Accepter</button>
                    </form>
                  ) : null}
                  {booking.status !== "cancelled" ? (
                    <form action={updateBookingStatus}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="targetStatus" value="cancelled" />
                      <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Annuler</button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
