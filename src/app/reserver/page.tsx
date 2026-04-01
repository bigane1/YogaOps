import { SiteNav } from "@/components/site-nav";
import { reserveSlot } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export default async function ReserverPage() {
  await ensureSeedData();
  const slots = await prisma.timeSlot.findMany({
    include: { course: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Reserver un cours
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Les horaires complets ne sont plus affiches comme reservables.
        </p>

        <div className="mt-8 grid gap-4">
          {slots.map((slot) => {
            const isAvailable = slot.available > 0;

            return (
              <article key={slot.id} className="brand-card rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-medium">{slot.course.title}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isAvailable ? "brand-badge-ok" : "brand-badge-muted"
                    }`}
                  >
                    {isAvailable ? "Disponible" : "Complet"}
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-90">
                  {formatDateFR(slot.startsAt)} - {slot.course.durationMin} min -{" "}
                  {slot.course.priceEur} EUR
                </p>
                <p className="mt-1 text-sm opacity-80">
                  Format: {slot.course.type} | Type de cours:{" "}
                  {slot.course.location === "en_ligne" ? "En ligne" : "Presentiel"}
                </p>
                {isAvailable ? (
                  <form action={reserveSlot} className="mt-4 grid max-w-xl gap-2">
                    <input type="hidden" name="slotId" value={slot.id} />
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
                    <select
                      name="paymentMethod"
                      defaultValue="on_site"
                      className="brand-field px-3 py-2 text-sm"
                    >
                      <option value="on_site">Paiement sur place (carte/especes)</option>
                      <option value="stripe">Paiement en ligne (Stripe test)</option>
                    </select>
                    <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
                      Reserver ce creneau
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
