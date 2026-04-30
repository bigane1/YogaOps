export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { bookingStatusLabelFr, paymentMethodLabelFr } from "@/lib/labels-fr";

type Props = {
  searchParams: Promise<{ bookingId?: string }>;
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingId = params.bookingId ?? "";

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

        {!booking ? (
          <p className="brand-card mt-4 rounded-xl p-4">
            Reservation introuvable. Retournez a la page de reservation.
          </p>
        ) : (
          <section className="brand-card mt-6 rounded-xl p-6">
            {/** For collective courses we can reuse slot-level zoomLink */}
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
                Votre reservation est bien enregistree. Un email de confirmation
                sera envoye des que la prof valide votre demande.
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
                Le lien Zoom sera affiche ici apres confirmation du paiement (ou saisie manuelle
                backoffice).
              </p>
            )}
                </>
              );
            })()}
          </section>
        )}

        <Link
          href="/reserver"
          className="brand-btn-secondary brand-btn-sm mt-6 inline-block rounded-lg px-4 py-2"
        >
          Retour aux creneaux
        </Link>
      </main>
    </div>
  );
}
