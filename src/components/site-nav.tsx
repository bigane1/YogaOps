import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/reserver", label: "Reserver" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/admin", label: "Backoffice" },
];

export function SiteNav() {
  return (
    <header className="border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: "var(--border-soft)" }}>
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold">
          <Image
            src="/logo-yogaops.png"
            alt="Logo YogaOps"
            width={46}
            height={46}
            className="rounded-md"
          />
          <span style={{ color: "var(--brand)" }}>YogaOps</span>
        </Link>
        <ul className="flex items-center gap-4 text-sm">
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
    </header>
  );
}
