"use client";

import React from "react";
import { useT } from "@/lib/locale-context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  return (
    <div
      className="fixed top-5 right-5 z-[100] flex items-center gap-1"
      style={{
        backgroundColor: "rgba(10,10,10,0.70)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(198,155,60,0.20)",
        padding: "6px 10px",
      }}
    >
      {(["de", "en"] as const).map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span className="font-sans text-[9px] text-parchment/20">|</span>}
          <button
            onClick={() => setLocale(l)}
            className="font-sans text-[10px] tracking-regal uppercase transition-colors"
            style={{ color: locale === l ? "#C69B3C" : "rgba(245,240,236,0.35)" }}
          >
            {l.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
