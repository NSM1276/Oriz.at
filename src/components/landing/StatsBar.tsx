"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { number: "< 24h", label: "Einrichtungszeit" },
  { number: "0 Apps", label: "für Gäste" },
  { number: "100%", label: "papierlos" },
];

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ backgroundColor: "#1C1208" }}
      className="py-20 px-6"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-0 text-center">
        {STATS.map(({ number, label }, i) => (
          <div
            key={label}
            className={[
              "flex flex-col items-center gap-3",
              "sm:border-r sm:last:border-r-0",
            ].join(" ")}
            style={{ borderColor: "rgba(200,150,62,0.15)" }}
          >
            <span
              className={[
                "font-display font-light text-parchment",
                visible ? "stat-visible" : "opacity-0",
                i === 0 ? "delay-100" : i === 1 ? "delay-300" : "delay-500",
              ].join(" ")}
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", lineHeight: 1 }}
            >
              {number}
            </span>
            <span
              className={[
                "font-sans text-[10px] tracking-regal uppercase",
                visible ? "stat-visible" : "opacity-0",
                i === 0 ? "delay-200" : i === 1 ? "delay-400" : "delay-600",
              ].join(" ")}
              style={{ color: "rgba(200,150,62,0.55)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
