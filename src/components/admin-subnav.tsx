"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/app/actions";

const contentItems = [
  { href: "/admin/accueil", label: "Accueil" },
  { href: "/admin/yoga-femmes", label: "Yoga femmes" },
  { href: "/admin/entreprises", label: "Entreprise" },
  { href: "/admin/ateliers", label: "Ateliers" },
  { href: "/admin/blog", label: "Blog" },
];

const adminItems = [
  { href: "/admin/cours", label: "Cours" },
  { href: "/admin/creneaux", label: "Créneaux" },
  { href: "/admin/cartes", label: "Cartes crédits" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/reservations", label: "Réservations" },
];

function NavLinks({
  items,
  pathname,
  label,
  children,
}: {
  items: { href: string; label: string }[];
  pathname: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <nav
      className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
      aria-label={label}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              active ? "brand-badge-ok font-semibold" : "brand-btn-secondary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}

export function AdminSubnav() {
  const pathname = usePathname();
  const dashboardActive = pathname === "/admin";

  return (
    <div className="mt-6 grid gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Pages</p>
        <NavLinks items={contentItems} pathname={pathname} label="Pages du site" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          <Link
            href="/admin"
            className={dashboardActive ? "text-[var(--brand)]" : "hover:text-[var(--foreground)]"}
          >
            Admin
          </Link>
        </p>
        <NavLinks items={adminItems} pathname={pathname} label="Navigation backoffice">
          <form action={adminLogout}>
            <button
              type="submit"
              className="brand-btn-secondary shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm"
            >
              Deconnexion
            </button>
          </form>
        </NavLinks>
      </div>
    </div>
  );
}
