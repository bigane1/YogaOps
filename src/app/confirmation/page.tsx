export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { bookingStatusLabelFr, paymentMethodLabelFr } from "@/lib/labels-fr";
import { fulfillPaidCheckoutSession } from "@/lib/stripe-fulfill";

export const metadata: Metadata = {
  title: "Confirmation de réservation - YogaOps",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ bookingId?: string; session_id?: string; cancelled?: string }>;
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingId = params.bookingId ?? "";

  if (params.session_id) {
    await fulfillPaidCheckoutSession(params.session_id);
  }

  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { slot: { include: { course: true } } },
      })
    : null;

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Confirmation de reservation
        </h1>

        {params.cancelled ? (
          <p className="brand-alert mt-4 rounded-xl p-4 text-sm">
            Paiement annulé. Vous pouvez réessayer depuis la page Réserver.
          </p>
        ) : null}

        {!booking ? (
          <p className="brand-card mt-4 rounded-xl p-4">
            Reservation introuvable. Retournez a la page de reservation.
          </p>
        ) : (
          <section className="brand-card mt-6 rounded-xl p-6">
            {(() => {
              const displayZoomLink = booking.zoomLink ?? booking.slot.zoomLink;
              return (
                <>
                  <p className="text-sm opacity-80">
                    Statut:{" "}
                    <span className="brand-badge-ok inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                      {bookingStatusLabelFr(booking.status)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm opacity-80">
                    Paiement: {paymentMethodLabelFr(booking.paymentMethod)}
                  </p>
                  {booking.status === "pending" ? (
                    <p className="brand-alert mt-3 rounded-lg p-3 text-sm">
                      Paiement en cours de confirmation. Rafraîchissez la page dans quelques
                      secondes si le statut reste en attente.
                    </p>
                  ) : null}
                  {booking.status === "confirmed" ? (
                    <p className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                      Réservation confirmée.
                    </p>
                  ) : null}
                  <h2 className="mt-3 text-xl font-medium">{booking.slot.course.title}</h2>
                  <p className="mt-2 opacity-90">
                    {formatDateFR(booking.slot.startsAt)} - {booking.slot.course.priceEur} EUR
                  </p>
                  <p className="mt-2 opacity-90">Client: {booking.customerName}</p>

                  {displayZoomLink ? (
                    <p className="brand-alert mt-4 rounded-lg p-3 text-sm break-all">
                      Lien Zoom: {displayZoomLink}
                    </p>
                  ) : (
                    <p className="brand-alert mt-4 rounded-lg p-3 text-sm opacity-90">
                      Le lien Zoom sera affiché ici après confirmation (ou saisie manuelle
                      backoffice).
                    </p>
                  )}
                </>
              );
            })()}
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/compte"
            className="brand-btn brand-btn-sm inline-block rounded-lg px-4 py-2"
          >
            Mon compte
          </Link>
          <Link
            href="/reserver"
            className="brand-btn-secondary brand-btn-sm inline-block rounded-lg px-4 py-2"
          >
            Retour aux creneaux
          </Link>
        </div>
      </main>
    </div>
  );
}
