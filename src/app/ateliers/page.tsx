export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { reserveSlot } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ateliers thématiques yoga | YogaOps",
  description:
    "Découvrez les prochains ateliers yoga thématiques : stress, flexibilité, respiration, méditation. Inscription en ligne.",
};

export default async function AteliersPage() {
  await ensureSeedData();

  const now = new Date();

  // Tous les créneaux futurs dont le cours est un atelier
  const slots = await prisma.timeSlot.findMany({
    where: {
      startsAt: { gt: now },
      course: { isActive: true, isWorkshop: true },
    },
    include: { course: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--brand)" }}
        >
          Ateliers thématiques
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Des événements ponctuels pour approfondir une pratique, explorer un thème ou vivre une
          expérience yoga particulière. Places limitées.
        </p>

        {slots.length === 0 ? (
          <div className="brand-card mt-10 rounded-xl p-8 text-center">
            <p className="text-lg opacity-70">Aucun atelier programmé pour le moment.</p>
            <p className="mt-2 text-sm opacity-60">
              Revenez prochainement ou inscrivez-vous à la newsletter pour être prévenu(e).
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {slots.map((slot) => {
              const placesRestantes = slot.available;
              const complet = placesRestantes <= 0;

              return (
                <article
                  key={slot.id}
                  className="brand-card flex flex-col rounded-xl p-6"
                >
                  {/* Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      Atelier
                    </span>
                    {complet ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Complet
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {placesRestantes} place{placesRestantes > 1 ? "s" : ""} restante{placesRestantes > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Titre & description */}
                  <h2 className="mt-3 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                    {slot.course.title}
                  </h2>
                  <p className="mt-1 text-sm opacity-80">{slot.course.description}</p>

                  {/* Infos */}
                  <div className="mt-4 space-y-1 text-sm opacity-80">
                    <p>📅 {formatDateFR(slot.startsAt)}</p>
                    <p>⏱ {slot.course.durationMin} min</p>
                    <p>
                      📍{" "}
                      {slot.course.location === "en_ligne"
                        ? "En ligne (Zoom)"
                        : "Présentiel"}
                    </p>
                  </div>

                  {/* Prix */}
                  <p className="mt-4 text-xl font-bold" style={{ color: "var(--brand)" }}>
                    {slot.course.priceEur} EUR
                  </p>

                  {/* Formulaire d'inscription */}
                  {complet ? (
                    <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                      Cet atelier est complet. Contactez-nous pour être mis(e) sur liste d&apos;attente.
                    </p>
                  ) : (
                    <form action={reserveSlot} className="mt-4 grid gap-2">
                      <input type="hidden" name="slotId" value={slot.id} />
                      <input type="hidden" name="paymentMethod" value="stripe" />
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
                        className="brand-field px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="brand-btn brand-btn-sm mt-1 rounded-lg px-4 py-2 font-medium"
                      >
                        S&apos;inscrire via Stripe →
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
