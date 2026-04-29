"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/reserver", label: "Reserver" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/abonnement", label: "Abonnement" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/blog", label: "Blog" },
  { href: "/admin", label: "Backoffice" },
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
    <header
      className="sticky top-0 z-[100] border-b bg-white/95 backdrop-blur-sm"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <nav
        className="relative z-[101] mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-4"
        aria-label="Navigation principale"
      >
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 md:gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo-yogaops.png"
            alt="Logo YogaOps"
            width={44}
            height={44}
            className="size-10 shrink-0 rounded-md md:size-[46px]"
          />
          <span className="truncate text-lg font-semibold md:text-xl" style={{ color: "var(--brand)" }}>
            YogaOps
          </span>
        </Link>

        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-medium text-[var(--brand)] md:hidden"
          aria-expanded={open}
          aria-controls="site-nav-mobile-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fermer" : "Menu"}
        </button>

        <ul className="hidden items-center gap-1 text-sm md:flex md:gap-2">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-md px-3 py-2 hover:bg-[var(--brand-soft)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[98] bg-black/25 md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="site-nav-mobile-panel"
            className="relative z-[99] border-t border-[var(--border-soft)] bg-white shadow-[0_12px_24px_rgba(95,69,99,0.12)] md:hidden"
          >
            <ul className="flex flex-col py-1">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-5 py-3.5 text-base hover:bg-[var(--brand-soft)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </header>
  );
}
