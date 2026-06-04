"use client";

import { useState } from "react";
import { MenuView } from "./MenuView";
import type { MenuPayload } from "@/lib/supabase/types";

type Theme = "classic" | "visual" | "modern";

const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: "classic", label: "Classic", hint: "Elegante Liste" },
  { value: "visual",  label: "Visual",  hint: "Foto-Grid"      },
  { value: "modern",  label: "Modern",  hint: "Editorial"      },
];

export function ThemeDemoShell({ payload }: { payload: MenuPayload }) {
  const [theme, setTheme] = useState<Theme>("classic");

  const overridden: MenuPayload = {
    ...payload,
    venue: { ...payload.venue, menu_theme: theme },
  };

  return (
    <div>
      {/* Sticky theme switcher */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between gap-4 px-5 py-2.5"
        style={{
          backgroundColor: "#1C1208",
          borderBottom: "1px solid rgba(200,150,62,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          className="font-sans text-[10px] tracking-regal uppercase hidden sm:block"
          style={{ color: "rgba(200,150,62,0.45)" }}
        >
          ORIZ · Theme Demo
        </span>

        <div className="flex gap-1.5 mx-auto sm:mx-0">
          {THEMES.map(t => {
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className="flex flex-col items-center px-5 py-1.5 transition-all duration-200"
                style={{
                  background: active ? "#C8963E" : "transparent",
                  color: active ? "#1C1208" : "rgba(200,150,62,0.50)",
                  border: `1px solid ${active ? "#C8963E" : "rgba(200,150,62,0.18)"}`,
                }}
              >
                <span className="font-sans text-[10px] tracking-regal uppercase leading-none">
                  {t.label}
                </span>
                <span
                  className="font-sans text-[8px] leading-none mt-0.5 normal-case tracking-normal hidden sm:block"
                  style={{ color: active ? "rgba(28,18,8,0.55)" : "rgba(200,150,62,0.28)" }}
                >
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>

        <a
          href="/carta"
          className="font-sans text-[9px] tracking-regal uppercase hidden sm:block transition-opacity hover:opacity-70"
          style={{ color: "rgba(200,150,62,0.35)" }}
        >
          Mehr erfahren →
        </a>
      </div>

      {/* Menu view — key forces full remount on theme change */}
      <MenuView key={theme} initial={overridden} />
    </div>
  );
}
