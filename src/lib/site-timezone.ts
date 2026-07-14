export const SITE_TIMEZONE = "Europe/Paris";

export function toSiteDateKey(date: Date, timeZone = SITE_TIMEZONE): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone }).format(date);
}

/** Convertit une date/heure saisie dans le backoffice (sans fuseau) en instant UTC. */
export function parseSiteDateTimeLocal(value: string, timeZone = SITE_TIMEZONE): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date();
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const [datePart, timePart = "00:00"] = trimmed.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);
  if (!year || !month || !day) return new Date(trimmed);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const parts = formatter.formatToParts(new Date(utcMs));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const deltaMs =
      Date.UTC(year, month - 1, day, hour, minute, second) -
      Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    if (deltaMs === 0) break;
    utcMs += deltaMs;
  }

  return new Date(utcMs);
}

export function siteDayStartUtc(dateKey: string, timeZone = SITE_TIMEZONE): Date {
  return parseSiteDateTimeLocal(`${dateKey}T00:00`, timeZone);
}

export function siteDayEndUtc(dateKey: string, timeZone = SITE_TIMEZONE): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const nextDayKey = toSiteDateKey(new Date(Date.UTC(year, month - 1, day + 1, 12)), timeZone);
  return siteDayStartUtc(nextDayKey, timeZone);
}

export function startOfSiteDay(date = new Date(), timeZone = SITE_TIMEZONE): Date {
  return siteDayStartUtc(toSiteDateKey(date, timeZone), timeZone);
}

export function formatSiteDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone = SITE_TIMEZONE,
): string {
  return date.toLocaleDateString("fr-FR", { ...options, timeZone });
}

/** Valeur pour input HTML datetime-local (heure Paris). */
export function toSiteDateTimeLocalInputValue(date: Date, timeZone = SITE_TIMEZONE): string {
  const dateKey = toSiteDateKey(date, timeZone);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${dateKey}T${hour}:${minute}`;
}
