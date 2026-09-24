import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MEMBER_COOKIE = "yogaops_member";
const SESSION_DAYS = 30;

function authSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.ADMIN_BACKOFFICE_PIN ||
    "dev-member-secret"
  );
}

function sign(value: string): string {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createMemberSession(memberId: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${memberId}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(MEMBER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearMemberSession() {
  (await cookies()).delete(MEMBER_COOKIE);
}

export async function getSessionMemberId(): Promise<string | null> {
  const raw = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [memberId, expStr, sig] = parts;
  const payload = `${memberId}.${expStr}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return memberId;
}

export async function getCurrentMember() {
  const id = await getSessionMemberId();
  if (!id) return null;
  return prisma.member.findUnique({ where: { id } });
}

export function isMemberProfileComplete(member: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}): boolean {
  return Boolean(
    member.firstName.trim() &&
      member.lastName.trim() &&
      member.phone.trim() &&
      member.email.trim(),
  );
}

export function memberDisplayName(member: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const full = `${member.firstName} ${member.lastName}`.trim();
  return full || member.email;
}
