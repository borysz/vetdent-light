"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** 210 mm in CSS pixels. */
const A4_WIDTH_PX = (210 / 25.4) * 96;

/**
 * Shows a fixed-width A4 page scaled down to fit the available width (never up), so the preview
 * never causes horizontal scrolling. When printing, the scaling is removed.
 */
export function ScaledPage({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outerEl = outer.current;
    const innerEl = inner.current;
    if (!outerEl || !innerEl) return;
    const measure = () => {
      const next = Math.min(1, outerEl.clientWidth / A4_WIDTH_PX);
      setScale(next);
      setHeight(innerEl.offsetHeight * next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outerEl);
    observer.observe(innerEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outer} className="w-full overflow-hidden print:h-auto! print:overflow-visible" style={{ height }}>
      <div
        ref={inner}
        className="w-[210mm] origin-top-left shadow-md print:w-auto print:transform-none! print:shadow-none"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
