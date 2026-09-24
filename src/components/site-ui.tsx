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
    <span className="inline-flex rounded-md bg-[var(--accent-soft)] px-3 py-1 text-xs text-[#4a5c44]">
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
  selected = false,
}: {
  label: string;
  title: string;
  description: string;
  meta?: string[];
  href: string;
  /** Si omis, toute la carte est cliquable (style landing classique). */
  cta?: string;
  variant?: "primary" | "secondary";
  wide?: boolean;
  className?: string;
  imageUrl?: string;
  imageAlt?: string;
  selected?: boolean;
}) {
  const btnClass =
    variant === "primary"
      ? "brand-btn brand-btn-sm"
      : "brand-btn-secondary brand-btn-sm";

  const shellClass = `offer-card overflow-hidden p-0 transition-shadow hover:shadow-md ${
    wide ? "md:col-span-2" : ""
  } ${
    selected ? "ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--background)]" : ""
  } ${className}`.trim();

  const inner = (
    <>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt ?? title}
          className="h-52 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
        <SectionLabel>{label}</SectionLabel>
        <h3 className="font-display text-xl font-semibold leading-snug md:text-[1.35rem]">
          {title}
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed md:text-base">{description}</p>
        {meta && meta.length > 0 ? (
          <div className={`flex flex-wrap gap-2 pt-1 ${cta ? "" : "mt-auto"}`}>
            {meta.map((item) => (
              <MetaPill key={item}>{item}</MetaPill>
            ))}
          </div>
        ) : null}
        {cta ? (
          <Link href={href} className={`${btnClass} mt-auto w-fit rounded-lg px-4 py-2`}>
            {cta}
          </Link>
        ) : null}
      </div>
    </>
  );

  if (!cta) {
    return (
      <Link href={href} className={`${shellClass} text-inherit no-underline`}>
        {inner}
      </Link>
    );
  }

  return <article className={shellClass}>{inner}</article>;
}

export function excerptParagraphs(text: string, max = 3): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function splitBioParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length > 0) return paragraphs;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
