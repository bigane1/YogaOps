"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/cartes", label: "Mes cartes" },
  { href: "/reserver", label: "Réserver" },
  { href: "/compte/profil", label: "Mon profil" },
];

export function MemberSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-hide mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
      aria-label="Espace membre"
    >
      {items.map((item) => {
        const active =
          item.href === "/compte"
            ? pathname === "/compte"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
