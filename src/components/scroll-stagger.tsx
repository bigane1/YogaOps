"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

type ScrollStaggerProps = {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
};

export function ScrollStagger({
  children,
  className = "",
  staggerMs = 110,
}: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        const element = child as ReactElement<{ className?: string; style?: CSSProperties }>;
        const existingClass = element.props.className ?? "";

        return cloneElement(element, {
          className: `scroll-reveal ${visible ? "scroll-reveal--visible" : ""} ${existingClass}`.trim(),
          style: {
            ...element.props.style,
            transitionDelay: `${index * staggerMs}ms`,
          },
        });
      })}
    </div>
  );
}
