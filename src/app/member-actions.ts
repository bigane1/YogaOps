"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CreditEligibility, MemberCreditStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { addValidityDays } from "@/lib/credits";
import {
  clearMemberSession,
  createMemberSession,
  getCurrentMember,
  hashPassword,
  isMemberProfileComplete,
  verifyPassword,
} from "@/lib/member-auth";

function toText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function revalidateMemberPaths() {
  revalidatePath("/compte");
  revalidatePath("/compte/cartes");
  revalidatePath("/reserver");
  revalidatePath("/admin/cartes");
  revalidatePath("/admin/clients");
}

export async function registerMember(formData: FormData) {
  const email = toText(formData.get("email")).toLowerCase();
  const password = toText(formData.get("password"));
  const firstName = toText(formData.get("firstName"));
  const lastName = toText(formData.get("lastName"));
  const phone = toText(formData.get("phone"));
  const next = toText(formData.get("next")) || "/compte";

  if (!email || !password || password.length < 8) {
    redirect(`/compte/inscription?error=invalid&next=${encodeURIComponent(next)}`);
  }
  if (!firstName || !lastName || !phone) {
    redirect(`/compte/inscription?error=profile&next=${encodeURIComponent(next)}`);
  }

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    redirect(`/compte/connexion?error=exists&next=${encodeURIComponent(next)}`);
  }

  const member = await prisma.member.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone,
      profileComplete: true,
    },
  });

  await createMemberSession(member.id);
  revalidateMemberPaths();
  redirect(next);
}

export async function loginMember(formData: FormData) {
  const email = toText(formData.get("email")).toLowerCase();
  const password = toText(formData.get("password"));
  const next = toText(formData.get("next")) || "/compte";

  const member = await prisma.member.findUnique({ where: { email } });
  if (!member?.passwordHash || !(await verifyPassword(password, member.passwordHash))) {
    redirect(`/compte/connexion?error=credentials&next=${encodeURIComponent(next)}`);
  }

  await createMemberSession(member.id);
  revalidateMemberPaths();

  if (!isMemberProfileComplete(member) || !member.profileComplete) {
    redirect(`/compte/profil?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function logoutMember() {
  await clearMemberSession();
  revalidateMemberPaths();
  redirect("/");
}

/** Annulation membre : libère le créneau, ne rembourse pas le crédit. */
export async function cancelMemberBooking(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) redirect("/compte/connexion?next=/compte");

  const bookingId = toText(formData.get("bookingId"));
  if (!bookingId) redirect("/compte");

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        memberId: member.id,
        status: { in: ["pending", "confirmed"] },
      },
      include: { slot: true },
    });
    if (!booking) return;
    if (booking.slot.startsAt < new Date()) return;

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });
    await tx.timeSlot.update({
      where: { id: booking.slotId },
      data: {
        available: booking.slot.available + 1,
        booked: Math.max(booking.slot.booked - 1, 0),
      },
    });
    // Pas de remboursement de crédit (règle métier).
  });

  revalidateMemberPaths();
  redirect("/compte?cancelled=1");
}

export async function completeMemberProfile(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) redirect("/compte/connexion");

  const firstName = toText(formData.get("firstName"));
  const lastName = toText(formData.get("lastName"));
  const phone = toText(formData.get("phone"));
  const next = toText(formData.get("next")) || "/compte";

  if (!firstName || !lastName || !phone) {
    redirect(`/compte/profil?error=profile&next=${encodeURIComponent(next)}`);
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { firstName, lastName, phone, profileComplete: true },
  });

  revalidateMemberPaths();
  redirect(next);
}

async function requireAdminPin(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get("yogaops_admin")?.value === "1";
}

export async function createCreditPack(formData: FormData) {
  if (!(await requireAdminPin())) return;

  const eligibilityRaw = toText(formData.get("eligibility"));
  const eligibility =
    eligibilityRaw === "individuel"
      ? CreditEligibility.individuel
      : eligibilityRaw === "collectif"
        ? CreditEligibility.collectif
        : CreditEligibility.both;

  await prisma.creditPack.create({
    data: {
      name: toText(formData.get("name")) || "Carte de crédits",
      description: toText(formData.get("description")),
      creditCount: Math.max(1, Number(formData.get("creditCount") ?? 5)),
      priceEur: Math.max(1, Number(formData.get("priceEur") ?? 50)),
      validityDays: Math.max(1, Number(formData.get("validityDays") ?? 365)),
      eligibility,
      isActive: true,
    },
  });

  revalidateMemberPaths();
  redirect("/admin/cartes");
}

export async function updateCreditPack(formData: FormData) {
  if (!(await requireAdminPin())) return;
  const id = toText(formData.get("id"));
  if (!id) return;

  const eligibilityRaw = toText(formData.get("eligibility"));
  const eligibility =
    eligibilityRaw === "individuel"
      ? CreditEligibility.individuel
      : eligibilityRaw === "collectif"
        ? CreditEligibility.collectif
        : CreditEligibility.both;

  await prisma.creditPack.update({
    where: { id },
    data: {
      name: toText(formData.get("name")),
      description: toText(formData.get("description")),
      creditCount: Math.max(1, Number(formData.get("creditCount") ?? 1)),
      priceEur: Math.max(1, Number(formData.get("priceEur") ?? 1)),
      validityDays: Math.max(1, Number(formData.get("validityDays") ?? 365)),
      eligibility,
      isActive: formData.getAll("isActive").includes("1"),
    },
  });

  revalidateMemberPaths();
  redirect("/admin/cartes");
}

export async function deleteCreditPack(formData: FormData) {
  if (!(await requireAdminPin())) return;
  const id = toText(formData.get("id"));
  if (!id) return;
  await prisma.creditPack.update({
    where: { id },
    data: { isActive: false },
  });
  revalidateMemberPaths();
  redirect("/admin/cartes");
}

export async function buyCreditPack(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/compte/connexion?next=/compte/cartes");
  }
  if (!isMemberProfileComplete(member) || !member.profileComplete) {
    redirect("/compte/profil?next=/compte/cartes");
  }

  const packId = toText(formData.get("packId"));
  const pack = await prisma.creditPack.findFirst({
    where: { id: packId, isActive: true },
  });
  if (!pack) redirect("/compte/cartes?error=pack");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      customer_email: member.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: pack.priceEur * 100,
            product_data: {
              name: pack.name,
              description: `${pack.creditCount} crédit${pack.creditCount > 1 ? "s" : ""} — validité ${pack.validityDays} jours`,
            },
          },
        },
      ],
      metadata: {
        type: "credit_pack",
        packId: pack.id,
        memberId: member.id,
      },
      success_url: `${baseUrl}/compte/cartes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/compte/cartes?cancelled=1`,
    });

    if (!session.url) redirect("/compte/cartes?error=stripe");
    redirect(session.url);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[buyCreditPack]", error);
    const message = error instanceof Error ? error.message : "";
    if (/sk_test_|LIVE|STRIPE_SECRET|placeholder|manquante/i.test(message)) {
      redirect("/compte/cartes?error=stripe_config");
    }
    redirect("/compte/cartes?error=stripe");
  }
}

/** Bypass local : attribue une carte sans Stripe (localhost uniquement). */
export async function grantCreditPackLocalDev(formData: FormData) {
  const { isLocalDevEnvironment } = await import("@/lib/stripe");
  if (!isLocalDevEnvironment()) {
    redirect("/compte/cartes?error=stripe");
  }

  const member = await getCurrentMember();
  if (!member) {
    redirect("/compte/connexion?next=/compte/cartes");
  }
  if (!isMemberProfileComplete(member) || !member.profileComplete) {
    redirect("/compte/profil?next=/compte/cartes");
  }

  const packId = toText(formData.get("packId"));
  const pack = await prisma.creditPack.findFirst({
    where: { id: packId, isActive: true },
  });
  if (!pack) redirect("/compte/cartes?error=pack");

  const now = new Date();
  await prisma.memberCreditCard.create({
    data: {
      memberId: member.id,
      packId: pack.id,
      remainingCredits: pack.creditCount,
      totalCredits: pack.creditCount,
      status: MemberCreditStatus.active,
      purchasedAt: now,
      expiresAt: addValidityDays(now, pack.validityDays),
      stripeSessionId: `local_dev_${member.id}_${pack.id}_${now.getTime()}`,
    },
  });

  revalidateMemberPaths();
  redirect("/compte/cartes?success=1");
}

/** Called from Stripe webhook when a credit pack is paid. */
export async function activateCreditPackFromStripe(args: {
  packId: string;
  memberId: string;
  stripeSessionId: string;
}) {
  const existing = await prisma.memberCreditCard.findUnique({
    where: { stripeSessionId: args.stripeSessionId },
  });
  if (existing) return existing;

  const pack = await prisma.creditPack.findUnique({ where: { id: args.packId } });
  const member = await prisma.member.findUnique({ where: { id: args.memberId } });
  if (!pack || !member) return null;

  const now = new Date();
  return prisma.memberCreditCard.create({
    data: {
      memberId: member.id,
      packId: pack.id,
      remainingCredits: pack.creditCount,
      totalCredits: pack.creditCount,
      status: MemberCreditStatus.active,
      purchasedAt: now,
      expiresAt: addValidityDays(now, pack.validityDays),
      stripeSessionId: args.stripeSessionId,
    },
  });
}
