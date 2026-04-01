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
import { ensureSeedData, formatDateFR } from "@/lib/db";
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

  const [courses, packages, slots, bookings] = await Promise.all([
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

        <section className="brand-card mt-8 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Ajouter un cours
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Type de cours: choisissez En ligne (Zoom) ou Presentiel.
          </p>
          <form action={createCourse} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Titre" className={fieldMd} />
            <input name="description" required placeholder="Description" className={fieldMd} />
            <select name="type" className={fieldMd}>
              <option value="individuel">Individuel</option>
              <option value="collectif">Collectif</option>
            </select>
            <select name="location" className={fieldMd}>
              <option value="en_ligne">En ligne (Zoom)</option>
              <option value="presentiel">Presentiel</option>
            </select>
            <input name="durationMin" type="number" defaultValue={60} className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={15} className={fieldMd} />
            <input name="capacity" type="number" defaultValue={10} className={fieldMd} />
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
                  <input name="title" defaultValue={course.title} className={fieldSm} />
                  <input name="description" defaultValue={course.description} className={fieldSm} />
                  <select name="type" defaultValue={course.type} className={fieldSm}>
                    <option value="individuel">Individuel</option>
                    <option value="collectif">Collectif</option>
                  </select>
                  <select name="location" defaultValue={course.location} className={fieldSm}>
                    <option value="en_ligne">En ligne</option>
                    <option value="presentiel">Presentiel</option>
                  </select>
                  <input name="durationMin" type="number" defaultValue={course.durationMin} className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={course.priceEur} className={fieldSm} />
                  <input name="capacity" type="number" defaultValue={course.capacity} className={fieldSm} />
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
            <input name="name" required placeholder="Nom abonnement" className={fieldMd} />
            <input name="description" required placeholder="Description" className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={79} className={fieldMd} />
            <input name="sessionCount" type="number" defaultValue={6} className={fieldMd} />
            <input name="validityDays" type="number" defaultValue={30} className={fieldMd} />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">
              Creer abonnement
            </button>
          </form>
          <ul className="mt-3 space-y-3 text-sm">
            {packages.map((item) => (
              <li key={item.id} className="brand-list-item p-3">
                <form action={updatePackage} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="name" defaultValue={item.name} className={fieldSm} />
                  <input name="description" defaultValue={item.description} className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={item.priceEur} className={fieldSm} />
                  <input name="sessionCount" type="number" defaultValue={item.sessionCount} className={fieldSm} />
                  <input name="validityDays" type="number" defaultValue={item.validityDays} className={fieldSm} />
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
            <input name="startsAt" type="datetime-local" required className={fieldMd} />
            <input name="available" type="number" defaultValue={8} className={fieldMd} />
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
                    className={fieldSm}
                  />
                  <input name="booked" type="number" defaultValue={slot.booked} className={fieldSm} />
                  <input name="available" type="number" defaultValue={slot.available} className={fieldSm} />
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
                    defaultValue={booking.zoomLink ?? ""}
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
