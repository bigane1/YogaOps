"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!prefersReduced);
  }, []);

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
      }}
    >
      {children}
    </ReactLenis>
  );
}
