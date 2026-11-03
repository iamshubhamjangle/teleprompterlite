"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function Logo({ size = 24 }: { size?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Keep the static mark when viewport observation is unavailable.
    if (typeof IntersectionObserver === "undefined") return;
    let visible = false;
    const update = () => {
      element.dataset.running = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <span ref={ref} className="app-logo" aria-hidden="true" style={{ width: size, height: size }}>
      <Image src="/logo.svg" alt="" width={size} height={size} unoptimized />
      <span className="app-logo-sweep" />
      <span className="app-logo-sweep app-logo-sweep-delayed" />
    </span>
  );
}
