"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/ateliers", label: "Ateliers" },
  { href: "/blog", label: "Blog" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[100] border-b border-[var(--border-soft)] bg-[var(--background)]/95 backdrop-blur-sm">
      <nav
        className="relative z-[101] mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-5 py-4 md:px-8"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-medium tracking-tight text-[var(--foreground)] md:text-xl"
          onClick={() => setOpen(false)}
        >
          <BrandLogo size={30} className="shrink-0" />
          YogaOps
        </Link>

        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-medium md:hidden"
          aria-expanded={open}
          aria-controls="site-nav-mobile-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fermer" : "Menu"}
        </button>

        <ul className="hidden items-center gap-1 text-sm md:flex">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--beige)] hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/reserver"
              className="brand-btn brand-btn-sm ml-2 rounded-lg px-4 py-2"
            >
              Reserver
            </Link>
          </li>
        </ul>
      </nav>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[98] bg-black/20 md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="site-nav-mobile-panel"
            className="relative z-[99] border-t border-[var(--border-soft)] bg-white md:hidden"
          >
            <ul className="flex flex-col py-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-6 py-3.5 text-base hover:bg-[var(--beige)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="px-6 py-3">
                <Link
                  href="/reserver"
                  className="brand-btn brand-btn-sm inline-flex rounded-lg px-4 py-2"
                  onClick={() => setOpen(false)}
                >
                  Reserver une seance
                </Link>
              </li>
            </ul>
          </div>
        </>
      ) : null}
    </header>
  );
}
