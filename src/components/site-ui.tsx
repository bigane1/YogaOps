import Link from "next/link";
import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--terracotta)]">
      {children}
    </p>
  );
}

export function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[#4a5c44]">
      {children}
    </span>
  );
}

export function OfferCard({
  label,
  title,
  description,
  meta,
  href,
  cta,
  variant = "secondary",
  wide = false,
  className = "",
  imageUrl,
  imageAlt,
}: {
  label: string;
  title: string;
  description: string;
  meta?: string[];
  href: string;
  cta: string;
  variant?: "primary" | "secondary";
  wide?: boolean;
  className?: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  const btnClass =
    variant === "primary"
      ? "brand-btn brand-btn-sm"
      : "brand-btn-secondary brand-btn-sm";

  return (
    <article className={`offer-card overflow-hidden p-0 ${wide ? "md:col-span-2" : ""} ${className}`.trim()}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt ?? title}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-7">
        <SectionLabel>{label}</SectionLabel>
        <h3 className="font-display text-xl font-medium">{title}</h3>
        <p className="text-[var(--muted)] leading-relaxed">{description}</p>
        {meta && meta.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <MetaPill key={item}>{item}</MetaPill>
            ))}
          </div>
        ) : null}
        <Link href={href} className={`${btnClass} mt-auto w-fit rounded-lg px-4 py-2`}>
          {cta}
        </Link>
      </div>
    </article>
  );
}

export function excerptParagraphs(text: string, max = 3): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max);
}
