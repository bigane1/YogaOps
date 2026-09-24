import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import {
  loginMember,
  registerMember,
} from "@/app/member-actions";

const field = "brand-field rounded-md px-3 py-2.5 text-sm";

type AuthSearch = Promise<{ error?: string; next?: string }>;

function ErrorBanner({ code }: { code?: string }) {
  if (!code) return null;
  const messages: Record<string, string> = {
    credentials: "Email ou mot de passe incorrect.",
    exists: "Un compte existe déjà avec cet email. Connectez-vous.",
    invalid: "Mot de passe trop court (8 caractères minimum).",
    profile: "Merci de renseigner nom, prénom et téléphone.",
  };
  return (
    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {messages[code] ?? "Une erreur est survenue."}
    </p>
  );
}

export async function ConnexionPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  const params = await searchParams;
  const next = params.next || "/compte";

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-md px-5 py-10 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
          Espace membre
        </p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight">
          Connexion
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Accédez à vos cartes de crédits, réservations et historique.
        </p>
        <ErrorBanner code={params.error} />

        <form action={loginMember} className="brand-card mt-6 space-y-3 rounded-xl p-6">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm">
            Email
            <input name="email" type="email" required autoComplete="email" className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            Mot de passe
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`${field} mt-1`}
            />
          </label>
          <button type="submit" className="brand-btn w-full rounded-lg px-4 py-2.5 text-sm">
            Se connecter
          </button>
        </form>

        <div className="brand-card-soft mt-4 rounded-xl p-4 text-sm">
          <p className="font-medium">Pas encore de compte ?</p>
          <Link
            href={`/compte/inscription?next=${encodeURIComponent(next)}`}
            className="mt-2 inline-flex text-[var(--foreground)] underline underline-offset-2"
          >
            Créer un compte en 1 minute
          </Link>
          <p className="mt-3 text-[var(--muted)]">
            Google : disponible dès que l&apos;auth Google sera branchée. En attendant,
            utilisez l&apos;inscription email.
          </p>
        </div>
      </main>
    </div>
  );
}

export async function InscriptionPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  const params = await searchParams;
  const next = params.next || "/compte";

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-md px-5 py-10 md:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
          Espace membre
        </p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight">
          Créer mon compte
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Puis réservez une séance ou achetez une carte de crédits.
        </p>
        <ErrorBanner code={params.error} />

        <form action={registerMember} className="brand-card mt-6 space-y-3 rounded-xl p-6">
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Prénom
              <input name="firstName" required autoComplete="given-name" className={`${field} mt-1`} />
            </label>
            <label className="block text-sm">
              Nom
              <input name="lastName" required autoComplete="family-name" className={`${field} mt-1`} />
            </label>
          </div>
          <label className="block text-sm">
            Téléphone
            <input name="phone" type="tel" required autoComplete="tel" className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            Email
            <input name="email" type="email" required autoComplete="email" className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            Mot de passe (8 caractères min.)
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${field} mt-1`}
            />
          </label>
          <button type="submit" className="brand-btn w-full rounded-lg px-4 py-2.5 text-sm">
            Créer mon compte
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Déjà inscrite ?{" "}
          <Link
            href={`/compte/connexion?next=${encodeURIComponent(next)}`}
            className="text-[var(--foreground)] underline underline-offset-2"
          >
            Se connecter
          </Link>
        </p>
      </main>
    </div>
  );
}
