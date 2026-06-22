"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ReserverQueryLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Navigation interne reserver sans remonter la page (preserve scroll). */
export function ReserverQueryLink({ href, className, children }: ReserverQueryLinkProps) {
  return (
    <Link href={href} scroll={false} className={className}>
      {children}
    </Link>
  );
}
