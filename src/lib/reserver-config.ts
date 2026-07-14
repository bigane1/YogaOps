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

export const DEFAULT_RESERVER_WEEKDAYS: Record<ReserverBookingGroup, string[]> = {
  collective: [],
  techWomen: [],
  individual: [],
};

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function normalizeLegacyReserverWeekdays(raw: string[] | null | undefined): string[] {
  if (!raw || raw.length === 0) return [];
  const normalized = raw.map((line) => line.trim().toLowerCase()).filter(Boolean);
  const key = [...new Set(normalized)].sort().join(",");
  if (key === "jeudi,mardi" || key === "mardi" || key === "jeudi") return [];
  if (key === "vendredi") return [];
  if (normalized.length >= 7) return [];
  return raw.map((line) => line.trim()).filter(Boolean);
}
export function parseReserverWeekdays(raw: string[] | null | undefined): number[] {
  const cleaned = normalizeLegacyReserverWeekdays(raw);
  if (cleaned.length === 0) return ALL_WEEKDAYS;
  const days = new Set<number>();
  for (const line of cleaned) {
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

/** Cours proposés dans le formulaire « Ajouter creneau » (collectif en ligne, hors Femmes Tech). */
export function isOnlineCollectiveSlotCourse(
  course: { type: string; title: string; location: string; isWorkshop: boolean },
  techWomenMatch: string,
): boolean {
  if (course.isWorkshop) return false;
  if (course.type !== "collectif") return false;
  if (course.location !== "en_ligne") return false;
  return matchCourseBookingGroup(course, techWomenMatch) === "collective";
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
    return parseReserverWeekdays(config.reserverTechWomenWeekdays);
  }
  if (group === "individual") {
    return parseReserverWeekdays(config.reserverIndividualWeekdays);
  }
  return parseReserverWeekdays(config.reserverCollectiveWeekdays);
}

export function getVisibleReserverDays(
  allDays: Date[],
  enabledWeekdays: number[],
  slotDayKeys: ReadonlySet<string>,
  toDateKey: (date: Date) => string,
): Date[] {
  const restrictsWeekdays =
    enabledWeekdays.length > 0 && enabledWeekdays.length < ALL_WEEKDAYS.length;

  if (!restrictsWeekdays) {
    if (slotDayKeys.size > 0) {
      return allDays.filter((day) => slotDayKeys.has(toDateKey(day)));
    }
    return allDays;
  }

  return allDays.filter((day) => {
    const key = toDateKey(day);
    if (slotDayKeys.has(key)) return true;
    return isDateOnEnabledWeekday(day, enabledWeekdays);
  });
}
