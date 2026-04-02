import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import { cookies } from "next/headers";
import { adminLogin, adminLogout, createCourse, createSlot, deleteCourse, deleteSlot, updateCourse, updateSlot } from "@/app/actions";
import { ensureSeedData, formatDateFR } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export default async function AdminCoursPage() {
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

  const [courses, slots] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.timeSlot.findMany({ include: { course: true }, orderBy: { startsAt: "asc" } }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>Cours & creneaux</h1>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm">Deconnexion</button>
        </form>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Ajouter un cours</h2>
          <form action={createCourse} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Titre" className={fieldMd} />
            <input name="description" required placeholder="Description du cours" className={fieldMd} />
            <select name="type" className={fieldMd}><option value="individuel">Individuel</option><option value="collectif">Collectif</option></select>
            <select name="location" className={fieldMd}><option value="en_ligne">En ligne (Zoom)</option><option value="presentiel">Presentiel</option></select>
            <input name="durationMin" type="number" defaultValue={60} placeholder="Duree en minutes" className={fieldMd} />
            <input name="priceEur" type="number" defaultValue={15} placeholder="Prix en EUR" className={fieldMd} />
            <input name="capacity" type="number" defaultValue={10} placeholder="Capacite max" className={fieldMd} />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">Creer le cours</button>
          </form>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Liste des cours</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {courses.map((course) => (
              <li key={course.id} className="brand-list-item p-3">
                <form action={updateCourse} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={course.id} />
                  <input name="title" defaultValue={course.title} placeholder="Titre du cours" className={fieldSm} />
                  <input name="description" defaultValue={course.description} placeholder="Description du cours" className={fieldSm} />
                  <select name="type" defaultValue={course.type} className={fieldSm}><option value="individuel">Individuel</option><option value="collectif">Collectif</option></select>
                  <select name="location" defaultValue={course.location} className={fieldSm}><option value="en_ligne">En ligne</option><option value="presentiel">Presentiel</option></select>
                  <input name="durationMin" type="number" defaultValue={course.durationMin} placeholder="Duree (min)" className={fieldSm} />
                  <input name="priceEur" type="number" defaultValue={course.priceEur} placeholder="Prix EUR" className={fieldSm} />
                  <input name="capacity" type="number" defaultValue={course.capacity} placeholder="Capacite" className={fieldSm} />
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">Modifier</button>
                </form>
                <form action={deleteCourse} className="mt-2">
                  <input type="hidden" name="id" value={course.id} />
                  <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="brand-card mt-6 rounded-xl p-6">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>Creneaux</h2>
          <form action={createSlot} className="mb-4 mt-3 grid gap-2 sm:grid-cols-2">
            <select name="courseId" className={fieldMd}>{courses.map((course) => (<option key={course.id} value={course.id}>{course.title}</option>))}</select>
            <input name="startsAt" type="datetime-local" required placeholder="Date et heure" className={fieldMd} />
            <input name="available" type="number" defaultValue={8} placeholder="Places disponibles" className={fieldMd} />
            <button type="submit" className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2">Ajouter creneau</button>
          </form>
          <ul className="mt-3 space-y-3 text-sm">
            {slots.map((slot) => (
              <li key={slot.id} className="brand-list-item p-3">
                <p className="mb-2 opacity-90">{slot.course.title} - {formatDateFR(slot.startsAt)} - {slot.course.location === "en_ligne" ? "En ligne" : "Presentiel"}</p>
                <form action={updateSlot} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={slot.id} />
                  <input name="startsAt" type="datetime-local" defaultValue={new Date(slot.startsAt).toISOString().slice(0, 16)} className={fieldSm} />
                  <input name="booked" type="number" defaultValue={slot.booked} placeholder="Nb reserves" className={fieldSm} />
                  <input name="available" type="number" defaultValue={slot.available} placeholder="Nb disponibles" className={fieldSm} />
                  <button type="submit" className="brand-btn brand-btn-sm rounded px-3 py-1 text-white">Modifier</button>
                </form>
                <form action={deleteSlot} className="mt-2">
                  <input type="hidden" name="id" value={slot.id} />
                  <button type="submit" className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
