export type CourseType = "individuel" | "collectif";
export type LocationType = "en_ligne" | "presentiel";

export type Course = {
  id: string;
  title: string;
  type: CourseType;
  durationMin: number;
  priceEur: number;
  capacity?: number;
  locationType: LocationType;
  description: string;
};

export type PackagePlan = {
  id: string;
  name: string;
  description: string;
  priceEur: number;
  sessionCount: number;
  validityDays: number;
};

export type TimeSlot = {
  id: string;
  courseId: string;
  startsAt: string;
  booked: number;
  available: number;
};

export const studio = {
  name: "YogaOps",
  domain: "yogaops.fr",
  currency: "EUR",
  adminEmail: "bigane123@gmail.com",
};

export const courses: Course[] = [
  {
    id: "c1",
    title: "Seance individuelle",
    type: "individuel",
    durationMin: 60,
    priceEur: 30,
    capacity: 1,
    locationType: "en_ligne",
    description:
      "Accompagnement personnalise pour progresser a votre rythme.",
  },
  {
    id: "c2",
    title: "Cours collectif",
    type: "collectif",
    durationMin: 60,
    priceEur: 15,
    capacity: 12,
    locationType: "en_ligne",
    description: "Cours de groupe accessible a tous les niveaux.",
  },
  {
    id: "c3",
    title: "Cours collectif studio",
    type: "collectif",
    durationMin: 60,
    priceEur: 15,
    capacity: 10,
    locationType: "presentiel",
    description: "Cours en presentiel avec ambiance studio.",
  },
];

export const packages: PackagePlan[] = [
  {
    id: "p1",
    name: "Nidra",
    description: "Abonnement bien-etre pour installer une pratique reguliere.",
    priceEur: 79,
    sessionCount: 6,
    validityDays: 30,
  },
];

export const slots: TimeSlot[] = [
  {
    id: "s1",
    courseId: "c1",
    startsAt: "2026-04-03T10:00:00+02:00",
    booked: 0,
    available: 1,
  },
  {
    id: "s2",
    courseId: "c2",
    startsAt: "2026-04-03T18:00:00+02:00",
    booked: 4,
    available: 8,
  },
  {
    id: "s3",
    courseId: "c3",
    startsAt: "2026-04-04T09:00:00+02:00",
    booked: 10,
    available: 0,
  },
];

export function formatDateFR(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}
