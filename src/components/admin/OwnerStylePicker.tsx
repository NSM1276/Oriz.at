"use client";

import { useState, useTransition } from "react";
import { COLOR_PRESETS, findPreset, type ColorPreset } from "@/lib/colorPresets";

type StyleUpdate = {
  color_bg?: string;
  color_primary?: string;
  menu_theme?: string;
};

type Props = {
  venueId: string;
  color_bg: string | null;
  color_primary: string | null;
  menu_theme: string | null | undefined;
  onUpdate: (updates: StyleUpdate) => void;
};

const THEMES = [
  { id: "classic", label: "Klassisch" },
  { id: "visual",  label: "Visual"    },
  { id: "modern",  label: "Modern"    },
] as const;

async function patchStyle(
  venueId: string,
  payload: { presetId?: string; theme?: string },
): Promise<string | null> {
  const res = await fetch("/api/admin/venue-style", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueId, ...payload }),
  });
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? "Fehler beim Speichern.";
}

export function OwnerStylePicker({ venueId, color_bg, color_primary, menu_theme, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activePreset = findPreset(color_bg);
  const accent = color_primary ?? "#C69B3C";
  const activeTheme = menu_theme ?? "classic";

  // ── Select color preset ────────────────────────────────────────
  function selectPreset(preset: ColorPreset) {
    if (preset.id === activePreset?.id) return;
    // Optimistic update
    onUpdate({ color_bg: preset.color_bg, color_primary: preset.color_primary });
    setError(null);
    startTransition(async () => {
      const err = await patchStyle(venueId, { presetId: preset.id });
      if (err) setError(err);
    });
  }

  // ── Select theme ───────────────────────────────────────────────
  function selectTheme(themeId: string) {
    if (activeTheme === themeId) return;
    onUpdate({ menu_theme: themeId });
    setError(null);
    startTransition(async () => {
      const err = await patchStyle(venueId, { theme: themeId });
      if (err) setError(err);
    });
  }

  return (
    <div
      className="mb-10 px-5 py-5"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {/* Section label */}
      <span
        className="font-sans text-[10px] tracking-regal uppercase block mb-4"
        style={{ color: "var(--color-muted)" }}
      >
        Stil &amp; Farbe
      </span>

      {/* ── Color chips ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-5">
        {COLOR_PRESETS.map((preset) => {
          const isSelected = preset.id === activePreset?.id;
          return (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={isSelected}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: preset.color_bg,
                border: `2px solid ${preset.color_primary}`,
                // Ring: gap (matches admin bg) + accent ring
                boxShadow: isSelected
                  ? `0 0 0 2px var(--color-bg, #F5F0EC), 0 0 0 4px ${preset.color_primary}`
                  : "none",
                transform: isSelected ? "scale(1.15)" : "scale(1)",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Active preset name */}
      {activePreset && (
        <p
          className="font-sans text-[10px] tracking-regal uppercase mb-5"
          style={{ color: accent }}
        >
          {activePreset.label}
        </p>
      )}

      {/* ── Theme buttons ────────────────────────────────────────── */}
      <div className="flex gap-2">
        {THEMES.map((t) => {
          const isActive = activeTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTheme(t.id)}
              className="flex-1 font-sans text-[10px] tracking-regal uppercase py-2.5 transition-colors duration-150"
              style={
                isActive
                  ? {
                      backgroundColor: accent,
                      color: "#fff",
                      border: `1px solid ${accent}`,
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--color-muted)",
                      border: "1px solid var(--color-border)",
                    }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 font-sans text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
