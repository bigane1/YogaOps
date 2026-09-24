import Stripe from "stripe";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** True uniquement en local (localhost) — pour bypass de test. */
export function isLocalDevEnvironment(): boolean {
  if (process.env.NODE_ENV === "production" && !/localhost|127\.0\.0\.1/i.test(getBaseUrl())) {
    return false;
  }
  return /localhost|127\.0\.0\.1/i.test(getBaseUrl());
}

function isLocalSite(): boolean {
  return isLocalDevEnvironment();
}

/** Vérifie la config Stripe avant un Checkout. */
export function assertStripeReadyForCheckout(): void {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!secretKey || /REMPLACER|xxx|your_key|sk_test_$/i.test(secretKey)) {
    throw new Error(
      "STRIPE_SECRET_KEY manquante ou placeholder. Ajoutez une clé sk_test_ dans .env.local",
    );
  }
  if (isLocalSite() && secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Clé Stripe LIVE refusée en local. Utilisez sk_test_ dans .env.local (Dashboard → Test mode).",
    );
  }
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error("STRIPE_SECRET_KEY invalide (attendu sk_test_… ou sk_live_…).");
  }
}

export function getStripeClient(): Stripe {
  assertStripeReadyForCheckout();
  const secretKey = process.env.STRIPE_SECRET_KEY!.trim();
  return new Stripe(secretKey);
}
