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
    <nav className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm ${
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
