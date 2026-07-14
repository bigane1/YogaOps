import { CourseType, LocationType } from "@/generated/prisma/enums";
import { seedBlogIfMissing } from "@/lib/blog";
import { seedLandingContentIfMissing } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";
import {
  parseSiteDateTimeLocal,
  siteDayEndUtc,
  siteDayStartUtc,
  startOfSiteDay,
  toSiteDateKey,
} from "@/lib/site-timezone";

export {
  formatSiteDate,
  parseSiteDateTimeLocal,
  siteDayEndUtc,
  siteDayStartUtc,
  startOfSiteDay,
  toSiteDateKey,
  toSiteDateTimeLocalInputValue,
} from "@/lib/site-timezone";

export function formatDateFR(date: Date): string {
  return date.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

export function formatTimeFR(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** @deprecated Utiliser toSiteDateKey (fuseau Europe/Paris). */
export function toLocalDateKey(date: Date): string {
  return toSiteDateKey(date);
}

/** @deprecated Utiliser siteDayStartUtc. */
export function parseLocalDateKey(isoDate: string): Date {
  return siteDayStartUtc(isoDate);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Semaine calendrier (lundi 00:00) pour les quotas abonnement
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // Sun=0..Sat=6
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function ensureSeedData() {
  await seedLandingContentIfMissing();
  await seedBlogIfMissing();

  const existing = await prisma.course.count();
  if (existing > 0) return;

  const individual = await prisma.course.create({
    data: {
      title: "Seance individuelle",
      description: "Accompagnement personnalise en ligne ou en presentiel.",
      type: CourseType.individuel,
      location: LocationType.en_ligne,
      durationMin: 60,
      priceEur: 30,
      capacity: 1,
    },
  });

  const collectiveOnline = await prisma.course.create({
    data: {
      title: "Cours collectif",
      description: "Cours de groupe tous niveaux en direct.",
      type: CourseType.collectif,
      location: LocationType.en_ligne,
      durationMin: 60,
      priceEur: 15,
      capacity: 12,
    },
  });

  await prisma.course.create({
    data: {
      title: "Cours collectif studio",
      description: "Cours en presentiel au studio.",
      type: CourseType.collectif,
      location: LocationType.presentiel,
      durationMin: 60,
      priceEur: 15,
      capacity: 10,
    },
  });

  await prisma.packagePlan.create({
    data: {
      name: "Nidra",
      description: "Abonnement par defaut, modifiable dans le backoffice.",
      priceEur: 79,
      sessionCount: 6,
      validityDays: 30,
    },
  });

  const now = new Date();
  const slots = [
    { days: 2, hour: 10, courseId: individual.id, available: 1 },
    { days: 2, hour: 18, courseId: collectiveOnline.id, available: 8 },
    { days: 3, hour: 9, courseId: collectiveOnline.id, available: 10 },
  ];

  await prisma.timeSlot.createMany({
    data: slots.map((slot) => {
      const startsAt = new Date(now);
      startsAt.setDate(startsAt.getDate() + slot.days);
      startsAt.setHours(slot.hour, 0, 0, 0);
      return {
        courseId: slot.courseId,
        startsAt,
        available: slot.available,
      };
    }),
  });
}
