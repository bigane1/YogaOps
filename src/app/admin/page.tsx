import { SiteNav } from "@/components/site-nav";
import { cookies } from "next/headers";
import {
  adminLogin,
  adminLogout,
  createCourse,
  createPackage,
  createSlot,
  deleteCourse,
  deletePackage,
  deleteSlot,
  updateBookingZoomLink,
  updateBookingStatus,
  updateCourse,
  updatePackage,
  updateSlot,
} from "@/app/actions";
import { ensureSeedData, formatDateFR, formatTimeFR, startOfDay, addDays } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export default async function AdminPage() {
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
          <p className="mt-2 opacity-90">
            Entrez le code admin pour gerer cours, creneaux et abonnements.
          </p>
          <form action={adminLogin} className="brand-card mt-6 rounded-xl p-6">
            <input
              name="pin"
              type="password"
              required
              placeholder="Code admin"
              className={fieldMd + " w-full"}
            />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const weekStart = (() => {
    const d = new Date(today);
    const day = d.getDay(); // 0..6 (Sun..Sat)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(d, mondayOffset);
  })();
  const weekEnd = addDays(weekStart, 7);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const [courses, packages, slots, bookings, weekSlots, weekBookings] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.packagePlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timeSlot.findMany({
      include: { course: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      include: { slot: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.timeSlot.findMany({
      where: { startsAt: { gte: weekStart, lt: weekEnd } },
      include: { course: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { slot: { startsAt: { gte: weekStart, lt: weekEnd } } },
      include: { slot: { include: { course: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Backoffice prof
        </h1>
        <p className="mt-2 opacity-90">Gestion complete des cours YogaOps.</p>
        <form action={adminLogout} className="mt-3">
          <button
            type="submit"
            className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm"
          >
            Deconnexion
          </button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Planning (7 jours)
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Vue Calendly: gerer les reservations et les liens Zoom.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-7">
            {weekDays.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const daySlots = weekSlots.filter((s) => {
                return s.startsAt.toISOString().slice(0, 10) === iso;
              });
              return (
                <div key={iso} className="rounded-lg border border-[var(--border-soft)] bg-white/80 p-3">
                  <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    {d.toLocaleDateString("fr-FR", { weekday: "short" })}{" "}
                    {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </div>

                  <div className="mt-3 space-y-3">
                    {daySlots.length === 0 ? (
                      <div className="text-xs opacity-70">Pas de creneaux</div>
                    ) : null}

                    {daySlots.map((slot) => {
                      const bookingsForSlot = weekBookings
                        .filter((b) => b.slotId === slot.id)
                        .sort((a, b) => {
                          if (a.status === "pending" && b.status !== "pending") return -1;
                          if (a.status !== "pending" && b.status === "pending") return 1;
                          return 0;
                        });

                      return (
                        <div
                          key={slot.id}
                          className="rounded-md border border-[var(--border-soft)] bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold">{formatTimeFR(slot.startsAt)}</div>
                              <div className="text-xs opacity-85">{slot.course.title}</div>
                            </div>
                            <div className="text-xs rounded-full px-2 py-0.5 brand-badge-muted">
                              reste {slot.available}
                            </div>
                          </div>

                          <div className="mt-2 space-y-2">
                            {bookingsForSlot.length === 0 ? (
                              <div className="text-xs opacity-70">Aucune reservation</div>
                            ) : null}

                            {bookingsForSlot.map((booking) => (
                              <details
                                key={booking.id}
                                className="rounded-md border border-[var(--border-soft)] bg-[#fcfafe] p-2"
                              >
                                <summary className="cursor-pointer list-none">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{booking.customerName}</p>
                                      <p className="text-[11px] opacity-70 truncate">{booking.customerEmail}</p>
                                    </div>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                        booking.status === "confirmed"
                                          ? "brand-badge-ok"
                                          : booking.status === "cancelled"
                                            ? "brand-badge-muted"
                                            : "brand-alert"
                                      }`}
                                    >
                                      {booking.status}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] opacity-70">Details</p>
                                </summary>

                                <div className="mt-2 border-t border-[var(--border-soft)] pt-2">
                                  <p className="text-[11px] opacity-75">Ref: {booking.id}</p>
                                  <form action={updateBookingZoomLink} className="mt-2 grid gap-2">
                                    <input type="hidden" name="bookingId" value={booking.id} />
                                    <input
                                      name="zoomLink"
                                      type="url"
                                      placeholder="https://zoom.us/j/..."
                                      defaultValue={booking.zoomLink ?? booking.slot.zoomLink ?? ""}
                                      className={fieldSm}
                                    />
                                    <button
                                      type="submit"
                                      className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1 text-[12px]"
                                    >
                                      Enregistrer Zoom
                                    </button>
                                  </form>

                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    {booking.status !== "confirmed" ? (
                                      <form action={updateBookingStatus}>
                                        <input type="hidden" name="bookingId" value={booking.id} />
                                        <input type="hidden" name="targetStatus" value="confirmed" />
                                        <button
                                          type="submit"
                                          className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1 text-[12px]"
                                        >
                                          Accepter
                                        </button>
                                      </form>
                                    ) : null}

                                    {booking.status !== "cancelled" ? (
                                      <form action={updateBookingStatus}>
                                        <input type="hidden" name="bookingId" value={booking.id} />
                                        <input type="hidden" name="targetStatus" value="cancelled" />
                                        <button
                                          type="submit"
                                          className="rounded border border-red-300 bg-red-50 px-3 py-1 text-[12px] text-red-800 hover:bg-red-100"
                                        >
                                          Annuler
                                        </button>
                                      </form>
                                    ) : null}
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Ajouter un cours
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Type de cours: choisissez En ligne (Zoom) ou Presentiel.
          </p>
          <form action={createCourse} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Titre" className={fieldMd} />
            <input
              name="description"
              required
              placeholder="Description du cours"
              className={fieldMd}
            />
            <select name="type" className={fieldMd}>
              <option value="individuel">Individuel</option>
              <option value="collectif">Collectif</option>
            </select>
            <select name="location" className={fieldMd}>
              <option value="en_ligne">En ligne (Zoom)</option>
              <option value="presentiel">Presentiel</option>
            </select>
            <input
              name="durationMin"
              type="number"
              defaultValue={60}
              placeholder="Duree en minutes"
              className={fieldMd}
            />
            <input
              name="priceEur"
              type="number"
              defaultValue={15}
              placeholder="Prix en EUR"
              className={fieldMd}
            />
            <input
              name="capacity"
              type="number"
              defaultValue={10}
              placeholder="Capacite max"
              className={fieldMd}
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Creer le cours
            </button>
          </form>
        </section>

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Cours
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {courses.map((course) => (
              <li key={course.id} className="brand-list-item p-3">
                <form action={updateCourse} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={course.id} />
                  <input
                    name="title"
                    defaultValue={course.title}
                    placeholder="Titre du cours"
                    className={fieldSm}
                  />
                  <input
                    name="description"
                    defaultValue={course.description}
                    placeholder="Description du cours"
                    className={fieldSm}
                  />
                  <select name="type" defaultValue={course.type} className={fieldSm}>
                    <option value="individuel">Individuel</option>
                    <option value="collectif">Collectif</option>
                  </select>
                  <select name="location" defaultValue={course.location} className={fieldSm}>
                    <option value="en_ligne">En ligne</option>
                    <option value="presentiel">Presentiel</option>
                  </select>
                  <input
                    name="durationMin"
                    type="number"
                    defaultValue={course.durationMin}
                    placeholder="Duree (min)"
                    className={fieldSm}
                  />
                  <input
                    name="priceEur"
                    type="number"
                    defaultValue={course.priceEur}
                    placeholder="Prix EUR"
                    className={fieldSm}
                  />
                  <input
                    name="capacity"
                    type="number"
                    defaultValue={course.capacity}
                    placeholder="Capacite"
                    className={fieldSm}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">
                      Modifier
                    </button>
                  </div>
                </form>
                <form action={deleteCourse} className="mt-2">
                  <input type="hidden" name="id" value={course.id} />
                  <button
                    type="submit"
                    className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Abonnements
          </h2>
          <form action={createPackage} className="mb-4 mt-3 grid gap-2 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Nom abonnement (ex: Nidra)"
              className={fieldMd}
            />
            <input
              name="description"
              required
              placeholder="Description abonnement"
              className={fieldMd}
            />
            <input
              name="priceEur"
              type="number"
              defaultValue={79}
              placeholder="Prix EUR"
              className={fieldMd}
            />
            <input
              name="sessionCount"
              type="number"
              defaultValue={6}
              placeholder="Seances par semaine"
              className={fieldMd}
            />
            <select name="allowedCourseType" className={fieldMd} defaultValue={""}>
              <option value="">Les deux (individuel + collectif)</option>
              <option value="individuel">Seulement individuel</option>
              <option value="collectif">Seulement collectif</option>
            </select>
            <input
              name="validityDays"
              type="number"
              defaultValue={30}
              placeholder="Validite (jours)"
              className={fieldMd}
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Creer abonnement
            </button>
          </form>
          <ul className="mt-3 space-y-3 text-sm">
            {packages.map((item) => (
              <li key={item.id} className="brand-list-item p-3">
                <form action={updatePackage} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    name="name"
                    defaultValue={item.name}
                    placeholder="Nom abonnement"
                    className={fieldSm}
                  />
                  <input
                    name="description"
                    defaultValue={item.description}
                    placeholder="Description abonnement"
                    className={fieldSm}
                  />
                  <input
                    name="priceEur"
                    type="number"
                    defaultValue={item.priceEur}
                    placeholder="Prix EUR"
                    className={fieldSm}
                  />
                  <input
                    name="sessionCount"
                    type="number"
                    defaultValue={item.sessionCount}
                    placeholder="Seances / semaine"
                    className={fieldSm}
                  />
                  <select
                    name="allowedCourseType"
                    className={fieldSm}
                    defaultValue={item.allowedCourseType ?? ""}
                  >
                    <option value="">Les deux</option>
                    <option value="individuel">Seulement individuel</option>
                    <option value="collectif">Seulement collectif</option>
                  </select>
                  <input
                    name="validityDays"
                    type="number"
                    defaultValue={item.validityDays}
                    placeholder="Validite (jours)"
                    className={fieldSm}
                  />
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">
                    Modifier
                  </button>
                </form>
                <form action={deletePackage} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Creneaux
          </h2>
          <form action={createSlot} className="mb-4 mt-3 grid gap-2 sm:grid-cols-2">
            <select name="courseId" className={fieldMd}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              name="startsAt"
              type="datetime-local"
              required
              placeholder="Date et heure"
              className={fieldMd}
            />
            <input
              name="available"
              type="number"
              defaultValue={8}
              placeholder="Places disponibles"
              className={fieldMd}
            />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Ajouter creneau
            </button>
          </form>
          <ul className="mt-3 space-y-3 text-sm">
            {slots.map((slot) => (
              <li key={slot.id} className="brand-list-item p-3">
                <p className="mb-2 opacity-90">
                  {slot.course.title} - {formatDateFR(slot.startsAt)} -{" "}
                  {slot.course.location === "en_ligne" ? "En ligne" : "Presentiel"}
                </p>
                <form action={updateSlot} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={slot.id} />
                  <input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={new Date(slot.startsAt).toISOString().slice(0, 16)}
                    placeholder="Date et heure"
                    className={fieldSm}
                  />
                  <input
                    name="booked"
                    type="number"
                    defaultValue={slot.booked}
                    placeholder="Nb reserves"
                    className={fieldSm}
                  />
                  <input
                    name="available"
                    type="number"
                    defaultValue={slot.available}
                    placeholder="Nb disponibles"
                    className={fieldSm}
                  />
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">
                    Modifier
                  </button>
                </form>
                <form action={deleteSlot} className="mt-2">
                  <input type="hidden" name="id" value={slot.id} />
                  <button
                    type="submit"
                    className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Reservations recentes
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {bookings.map((booking) => (
              <li key={booking.id} className="brand-list-item p-3">
                <p className="opacity-90">
                  {booking.customerName} - {booking.customerEmail} - {booking.slot.course.title} -{" "}
                  <span className="brand-badge-ok inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                    {booking.status}
                  </span>
                </p>
                <form action={updateBookingZoomLink} className="mt-2 grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input
                    name="zoomLink"
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    defaultValue={booking.zoomLink ?? booking.slot.zoomLink ?? ""}
                    className={`sm:col-span-3 ${fieldSm}`}
                  />
                  <button
                    type="submit"
                    className="brand-btn-secondary brand-btn-sm rounded-md border px-3 py-1"
                  >
                    Enregistrer lien Zoom
                  </button>
                </form>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={updateBookingStatus}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="targetStatus" value="confirmed" />
                    <button
                      type="submit"
                      className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1"
                    >
                      Accepter
                    </button>
                  </form>
                  <form action={updateBookingStatus}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="targetStatus" value="cancelled" />
                    <button
                      type="submit"
                      className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100"
                    >
                      Annuler
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
