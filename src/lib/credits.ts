import { CreditEligibility, CourseType } from "@/generated/prisma/enums";

export function eligibilityLabel(value: CreditEligibility | string): string {
  switch (value) {
    case CreditEligibility.individuel:
    case "individuel":
      return "Cours individuels";
    case CreditEligibility.collectif:
    case "collectif":
      return "Cours collectifs";
    default:
      return "Individuels et collectifs";
  }
}

export function packMatchesCourseType(
  eligibility: CreditEligibility | string,
  courseType: CourseType | string,
): boolean {
  if (eligibility === CreditEligibility.both || eligibility === "both") return true;
  return eligibility === courseType;
}

export function addValidityDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
