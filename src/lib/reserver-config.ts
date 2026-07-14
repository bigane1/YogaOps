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
  collective: ["mardi", "jeudi"],
  techWomen: ["vendredi"],
  individual: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
};

export function parseReserverWeekdays(
  raw: string[] | null | undefined,
  fallback: string[],
): number[] {
  const source = raw && raw.length > 0 ? raw : fallback;
  const days = new Set<number>();
  for (const line of source) {
    const key = line.trim().toLowerCase();
    if (!key) continue;
    const asNumber = Number(key);
    if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber <= 6) {
      days.add(asNumber);
      continue;
    }
    const mapped = WEEKDAY_MAP[key];
    if (mapped !== undefined) days.add(mapped);
  }
  return days.size > 0 ? [...days].sort((a, b) => a - b) : parseReserverWeekdays(fallback, fallback);
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
