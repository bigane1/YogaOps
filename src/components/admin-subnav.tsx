"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/cours", label: "Cours & creneaux" },
  { href: "/admin/abonnements", label: "Abonnements & abonnes" },
];

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-hide mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
      aria-label="Navigation backoffice"
    >
      {items.map((item) => {
        const active = pathname === item.href;
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
    </nav>
  );
}
