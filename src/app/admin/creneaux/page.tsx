export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { SiteNav } from "@/components/site-nav";
import { AdminSubnav } from "@/components/admin-subnav";
import {
  adminLogin,
  adminLogout,
  createSlot,
  createWeeklySlots,
  deleteSlot,
  updateSlot,
} from "@/app/actions";
import {
  ensureSeedData,
  formatDateFR,
  formatSiteDate,
  formatTimeFR,
  toSiteDateKey,
  toSiteDateTimeLocalInputValue,
} from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";
import {
  formatSlotCourseLabel,
  isReserverSlotCourse,
  matchCourseBookingGroup,
  type ReserverBookingGroup,
} from "@/lib/reserver-config";
import { siteDayEndUtc, siteDayStartUtc, startOfSiteDay } from "@/lib/site-timezone";
import { prisma } from "@/lib/prisma";

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

type Props = {
  searchParams: Promise<{
    type?: string;
    from?: string;
    to?: string;
    reserved?: string;
    view?: string;
  }>;
};

type SlotRow = {
  id: string;
  booked: number;
  available: number;
  startsAt: Date;
  zoomLink: string | null;
  course: { title: string; type: string; location: string };
  bookings: { id: string }[];
};

function isValidDateKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isSlotLocked(slot: { booked: number; bookings: { id: string }[] }): boolean {
  return slot.booked > 0 || slot.bookings.length > 0;
}

export default async function AdminCreneauxPage({ searchParams }: Props) {
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
            <input
              name="pin"
              type="password"
              required
              placeholder="Code admin"
              className="brand-field w-full rounded-md px-3 py-2 text-sm"
            />
            <button type="submit" className="brand-btn brand-btn-sm mt-4 rounded-lg px-4 py-2">
              Se connecter
            </button>
          </form>
        </main>
      </div>
    );
  }

  const params = await searchParams;
  const typeFilter = (params.type ?? "all") as "all" | ReserverBookingGroup;
  const reservedFilter =
    params.reserved === "reserved" || params.reserved === "free" ? params.reserved : "all";
  const viewMode = params.view === "planning" ? "planning" : "list";
  const todayKey = toSiteDateKey(new Date());
  const fromKey = isValidDateKey(params.from) ? params.from : todayKey;
  const defaultTo = (() => {
    const d = startOfSiteDay();
    d.setUTCDate(d.getUTCDate() + 60);
    return toSiteDateKey(d);
  })();
  const toKey = isValidDateKey(params.to) ? params.to : defaultTo;
  const rangeStart = siteDayStartUtc(fromKey);
  const rangeEnd = siteDayEndUtc(toKey);

  const landing = await getLandingContent();
  const [courses, slots] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, isWorkshop: false },
      orderBy: { title: "asc" },
    }),
    prisma.timeSlot.findMany({
      where: {
        startsAt: { gte: rangeStart, lt: rangeEnd },
        course: { isWorkshop: false, isActive: true },
      },
      include: {
        course: true,
        bookings: {
          where: { status: { in: ["pending", "confirmed"] } },
          select: { id: true },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const slotCourses = courses.filter((course) => isReserverSlotCourse(course));
  const filteredSlots = slots.filter((slot) => {
    if (typeFilter !== "all") {
      if (matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch) !== typeFilter) {
        return false;
      }
    }
    const locked = isSlotLocked(slot);
    if (reservedFilter === "reserved") return locked;
    if (reservedFilter === "free") return !locked;
    return true;
  });

  const typeLabels: Record<ReserverBookingGroup, string> = {
    collective: landing.offerCollectiveLabel,
    techWomen: landing.offerTechLabel,
    individual: landing.offerIndividualLabel,
  };

  const dayKeys = [...new Set(filteredSlots.map((s) => toSiteDateKey(s.startsAt)))];

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Créneaux
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Planifiez les séances à l&apos;unité ou en série hebdomadaire. Un créneau déjà réservé ne
          peut plus être modifié (sauf le lien Zoom).
        </p>
        <AdminSubnav />
        <form action={adminLogout} className="mt-3">
          <button
            type="submit"
            className="brand-btn-secondary brand-btn-sm rounded-md px-3 py-1 text-sm"
          >
            Déconnexion
          </button>
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="brand-card rounded-xl p-6">
            <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
              Ajouter un créneau
            </h2>
            <form action={createSlot} className="mt-3 grid gap-2">
              <select name="courseId" className={fieldMd} required>
                {slotCourses.length === 0 ? (
                  <option value="">Aucun cours disponible</option>
                ) : (
                  slotCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {formatSlotCourseLabel(course, landing.reserverTechWomenMatch)}
                    </option>
                  ))
                )}
              </select>
              <input name="startsAt" type="datetime-local" required className={fieldMd} />
              <input
                name="available"
                type="number"
                defaultValue={8}
                min={1}
                placeholder="Places"
                className={fieldMd}
              />
              <button
                type="submit"
                disabled={slotCourses.length === 0}
                className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Ajouter
              </button>
            </form>
          </section>

          <section className="brand-card rounded-xl p-6">
            <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
              Série hebdomadaire
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Même jour et heure, chaque semaine. Les doublons sont ignorés.
            </p>
            <form action={createWeeklySlots} className="mt-3 grid gap-2">
              <select name="courseId" className={fieldMd} required>
                {slotCourses.length === 0 ? (
                  <option value="">Aucun cours disponible</option>
                ) : (
                  slotCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {formatSlotCourseLabel(course, landing.reserverTechWomenMatch)}
                    </option>
                  ))
                )}
              </select>
              <input name="startsAt" type="datetime-local" required className={fieldMd} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="weeks"
                  type="number"
                  defaultValue={8}
                  min={1}
                  max={52}
                  placeholder="Nb semaines"
                  className={fieldMd}
                />
                <input
                  name="available"
                  type="number"
                  defaultValue={8}
                  min={1}
                  placeholder="Places"
                  className={fieldMd}
                />
              </div>
              <button
                type="submit"
                disabled={slotCourses.length === 0}
                className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Créer la série
              </button>
            </form>
          </section>
        </div>

        <section className="brand-card mt-6 rounded-xl p-4">
          <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Affichage
              <select name="view" defaultValue={viewMode} className={fieldMd}>
                <option value="list">Liste</option>
                <option value="planning">Planning (par jour)</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Type
              <select name="type" defaultValue={typeFilter} className={fieldMd}>
                <option value="all">Tous les types</option>
                <option value="collective">{typeLabels.collective}</option>
                <option value="techWomen">{typeLabels.techWomen}</option>
                <option value="individual">{typeLabels.individual}</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Réservation
              <select name="reserved" defaultValue={reservedFilter} className={fieldMd}>
                <option value="all">Tous</option>
                <option value="free">Libres</option>
                <option value="reserved">Réservés</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Du
              <input name="from" type="date" defaultValue={fromKey} className={fieldMd} />
            </label>
            <label className="grid gap-1 text-xs text-[var(--muted)]">
              Au
              <input name="to" type="date" defaultValue={toKey} className={fieldMd} />
            </label>
            <button
              type="submit"
              className="brand-btn brand-btn-sm self-end rounded-md px-3 py-2 text-sm"
            >
              Filtrer
            </button>
          </form>
        </section>

        <section className="brand-card mt-4 rounded-xl p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
              {viewMode === "planning" ? "Planning" : "Liste"} ({filteredSlots.length})
            </h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/admin/creneaux?view=list&type=${typeFilter}&reserved=${reservedFilter}&from=${fromKey}&to=${toKey}`}
                className={
                  viewMode === "list"
                    ? "font-semibold underline underline-offset-2"
                    : "opacity-80 underline underline-offset-2"
                }
              >
                Liste
              </Link>
              <Link
                href={`/admin/creneaux?view=planning&type=${typeFilter}&reserved=${reservedFilter}&from=${fromKey}&to=${toKey}`}
                className={
                  viewMode === "planning"
                    ? "font-semibold underline underline-offset-2"
                    : "opacity-80 underline underline-offset-2"
                }
              >
                Planning
              </Link>
              <Link href="/admin/cours" className="opacity-80 underline underline-offset-2">
                Gérer les cours
              </Link>
            </div>
          </div>

          {filteredSlots.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Aucun créneau pour ces filtres. Élargissez les dates ou créez une série.
            </p>
          ) : viewMode === "planning" ? (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {dayKeys.map((iso) => {
                const daySlots = filteredSlots.filter((s) => toSiteDateKey(s.startsAt) === iso);
                const dayDate = siteDayStartUtc(iso);
                return (
                  <div
                    key={iso}
                    className="w-[300px] shrink-0 rounded-lg border border-[var(--border-soft)] bg-white/80 p-3"
                  >
                    <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                      {formatSiteDate(dayDate, {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="mt-3 space-y-3">
                      {daySlots.map((slot) => (
                        <SlotEditor
                          key={slot.id}
                          slot={slot}
                          typeLabel={
                            typeLabels[
                              matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch)
                            ]
                          }
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {filteredSlots.map((slot) => (
                <li key={slot.id}>
                  <SlotEditor
                    slot={slot}
                    typeLabel={
                      typeLabels[
                        matchCourseBookingGroup(slot.course, landing.reserverTechWomenMatch)
                      ]
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function SlotEditor({
  slot,
  typeLabel,
  compact = false,
}: {
  slot: SlotRow;
  typeLabel: string;
  compact?: boolean;
}) {
  const locked = isSlotLocked(slot);

  return (
    <div className={`brand-list-item p-3 ${compact ? "bg-white" : ""}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {compact ? (
          <>
            <p className="font-semibold tabular-nums" style={{ color: "var(--brand)" }}>
              {formatTimeFR(slot.startsAt)}
            </p>
            <p className="text-xs opacity-90">{slot.course.title}</p>
          </>
        ) : (
          <p className="font-medium opacity-90">
            {slot.course.title} — {formatDateFR(slot.startsAt)}
          </p>
        )}
        <span className="rounded-full bg-[var(--beige)] px-2 py-0.5 text-[11px]">{typeLabel}</span>
        {locked ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">
            Réservé ({slot.booked || slot.bookings.length})
            {compact ? "" : " — non modifiable"}
          </span>
        ) : (
          <span className="rounded-full brand-badge-ok px-2 py-0.5 text-[11px]">
            Libre · {slot.available} places
          </span>
        )}
      </div>

      {locked ? (
        <form action={updateSlot} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="id" value={slot.id} />
          <input
            name="zoomLink"
            type="url"
            placeholder="Lien Zoom"
            defaultValue={slot.zoomLink ?? ""}
            className={fieldSm}
          />
          <button type="submit" className="brand-btn-secondary brand-btn-sm rounded px-3 py-1">
            Zoom
          </button>
        </form>
      ) : (
        <>
          <form
            action={updateSlot}
            className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-4"}`}
          >
            <input type="hidden" name="id" value={slot.id} />
            <input type="hidden" name="booked" value={slot.booked} />
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={toSiteDateTimeLocalInputValue(slot.startsAt)}
              className={fieldSm}
            />
            <input
              name="available"
              type="number"
              defaultValue={slot.available}
              min={0}
              placeholder="Places"
              className={fieldSm}
            />
            <input
              name="zoomLink"
              type="url"
              placeholder="Lien Zoom"
              defaultValue={slot.zoomLink ?? ""}
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
        </>
      )}
    </div>
  );
}
