export type ReserverBookingGroup = "collective" | "techWomen" | "individual";

export const RESERVER_BOOKING_GROUPS: ReserverBookingGroup[] = [
  "collective",
  "techWomen",
  "individual",
];

const WEEKDAY_MAP: Record<string, number> = {
  dimanche: 0,
  sunday: 0,
  sun: 0,
  lundi: 1,
  monday: 1,
  mon: 1,
  mardi: 2,
  tuesday: 2,
  tue: 2,
  mercredi: 3,
  wednesday: 3,
  wed: 3,
  jeudi: 4,
  thursday: 4,
  thu: 4,
  vendredi: 5,
  friday: 5,
  fri: 5,
  samedi: 6,
  saturday: 6,
  sat: 6,
};

/** Collectif = mardi, Femmes Tech = vendredi. Individuel = contact, pas de calendrier. */
export const DEFAULT_RESERVER_WEEKDAYS: Record<ReserverBookingGroup, string[]> = {
  collective: ["mardi"],
  techWomen: ["vendredi"],
  individual: [],
};

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function normalizeLegacyReserverWeekdays(raw: string[] | null | undefined): string[] {
  if (!raw || raw.length === 0) return [];
  const normalized = raw.map((line) => line.trim().toLowerCase()).filter(Boolean);
  const key = [...new Set(normalized)].sort().join(",");
  // Ancien défaut de test « mardi + jeudi » → on bascule sur mardi seul
  if (key === "jeudi,mardi") return ["mardi"];
  // Ancien « tous les jours » (7 lignes)
  if (normalized.length >= 7) return [];
  return raw.map((line) => line.trim()).filter(Boolean);
}

export function parseReserverWeekdays(
  raw: string[] | null | undefined,
  fallback: string[] = [],
): number[] {
  const cleaned = normalizeLegacyReserverWeekdays(raw);
  const source = cleaned.length > 0 ? cleaned : fallback;
  if (source.length === 0) return ALL_WEEKDAYS;
  const days = new Set<number>();
  for (const line of source) {
    const key = line.trim().toLowerCase();
    if (!key) continue;
    if (key === "tous" || key === "all" || key === "*") {
      return ALL_WEEKDAYS;
    }
    const asNumber = Number(key);
    if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber <= 6) {
      days.add(asNumber);
      continue;
    }
    const mapped = WEEKDAY_MAP[key];
    if (mapped !== undefined) days.add(mapped);
  }
  return days.size > 0 ? [...days].sort((a, b) => a - b) : ALL_WEEKDAYS;
}

export function isDateOnEnabledWeekday(date: Date, enabledWeekdays: number[]): boolean {
  if (enabledWeekdays.length === 0) return true;
  return enabledWeekdays.includes(date.getDay());
}

export function resolveReserverBookingGroup(
  value: string | null | undefined,
): ReserverBookingGroup {
  if (value === "techWomen" || value === "individual" || value === "collective") {
    return value;
  }
  return "collective";
}

export function matchCourseBookingGroup(
  course: { type: string; title: string },
  techWomenMatch: string,
): ReserverBookingGroup {
  if (course.type === "individuel") return "individual";
  const keyword = techWomenMatch.trim().toLowerCase();
  if (keyword && course.title.toLowerCase().includes(keyword)) return "techWomen";
  return "collective";
}

/** Cours éligibles aux créneaux de la page Réserver (hors ateliers). */
export function isReserverSlotCourse(course: { isWorkshop: boolean }): boolean {
  return !course.isWorkshop;
}

export function formatSlotCourseLabel(
  course: { title: string; type: string; location: string },
  techWomenMatch: string,
): string {
  const group = matchCourseBookingGroup(course, techWomenMatch);
  const locationLabel = course.location === "presentiel" ? "présentiel" : "en ligne";
  const groupLabels: Record<ReserverBookingGroup, string> = {
    collective: "Collectif",
    techWomen: "Femmes Tech",
    individual: "Individuel",
  };
  return `${course.title} — ${groupLabels[group]} · ${locationLabel}`;
}

export function getReserverWeekdaysForGroup(
  group: ReserverBookingGroup,
  config: {
    reserverCollectiveWeekdays: string[];
    reserverTechWomenWeekdays: string[];
    reserverIndividualWeekdays: string[];
  },
): number[] {
  if (group === "techWomen") {
    return parseReserverWeekdays(
      config.reserverTechWomenWeekdays,
      DEFAULT_RESERVER_WEEKDAYS.techWomen,
    );
  }
  if (group === "individual") {
    return parseReserverWeekdays(
      config.reserverIndividualWeekdays,
      DEFAULT_RESERVER_WEEKDAYS.individual,
    );
  }
  return parseReserverWeekdays(
    config.reserverCollectiveWeekdays,
    DEFAULT_RESERVER_WEEKDAYS.collective,
  );
}

export function getVisibleReserverDays(
  allDays: Date[],
  enabledWeekdays: number[],
  slotDayKeys: ReadonlySet<string>,
  toDateKey: (date: Date) => string,
): Date[] {
  // Page publique : n'afficher que les jours avec au moins un créneau publié.
  // (Les jours de la semaine configurés sans créneau ne doivent pas apparaître vides.)
  if (slotDayKeys.size > 0) {
    return allDays.filter((day) => slotDayKeys.has(toDateKey(day)));
  }

  // Aucun créneau dans la fenêtre : pas de jours fantômes.
  void enabledWeekdays;
  return [];
}
