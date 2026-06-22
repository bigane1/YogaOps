import Link from "next/link";
import { getLandingContent } from "@/lib/landing-content";

export async function SiteFooter() {
  const landing = await getLandingContent();

  return (
    <footer className="mt-auto border-t border-[var(--border-soft)] bg-[var(--beige)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 text-sm md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-base font-medium">YogaOps</p>
            <p className="mt-2 text-[var(--muted)]">
              Yoga doux pour femmes actives du digital et de la tech.
            </p>
          </div>
          <div className="space-y-1 text-[var(--muted)]">
            <p>{landing.footerAddress}</p>
            <p>{landing.footerPhone}</p>
            <p>{landing.footerEmail}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/mentions-legales" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Mentions legales
            </Link>
            <Link href="/cgv" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              CGV
            </Link>
            <Link href="/cgu" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              CGU
            </Link>
            <Link href="/tarifs" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Tarifs
            </Link>
            <Link href="/abonnement" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Abonnement
            </Link>
            <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Admin
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--border-soft)] pt-6">
          <a
            href={landing.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="brand-btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5M17.5 6.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4"
              />
            </svg>
          </a>
          <a
            href={landing.linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="brand-btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="LinkedIn"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.9 8.1a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM5 9.5h3.8V20H5V9.5Zm6.1 0h3.7V11h.1c.5-.9 1.7-1.8 3.4-1.8 3.7 0 4.4 2.2 4.4 5.2V20H19v-4.9c0-1.2 0-2.7-1.8-2.7s-2 1.4-2 2.6V20h-4.1V9.5Z"
              />
            </svg>
          </a>
          <a
            href={landing.facebookUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="brand-btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.25 0-1.64.78-1.64 1.57V12h2.79l-.45 2.89h-2.34v6.99A10 10 0 0 0 22 12"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
