"use client";

import { useState, useTransition } from "react";
import { COLOR_PRESETS, findPreset, type ColorPreset } from "@/lib/colorPresets";

type StyleUpdate = {
  color_bg?: string;
  color_primary?: string;
  casa_theme?: string;
};

type Props = {
  propertyId: string;
  color_bg: string | null;
  color_primary: string | null;
  casa_theme: string | null | undefined;
  onUpdate: (updates: StyleUpdate) => void;
};

const THEMES = [
  { id: "classic", label: "Classic" },
  { id: "light",   label: "Light"   },
  { id: "modern",  label: "Modern"  },
] as const;

async function patchStyle(
  propertyId: string,
  payload: { presetId?: string; theme?: string },
): Promise<string | null> {
  const res = await fetch("/api/admin/casa/style", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ propertyId, ...payload }),
  });
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? "Fehler beim Speichern.";
}

export function CasaStylePicker({ propertyId, color_bg, color_primary, casa_theme, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activePreset = findPreset(color_bg);
  const accent = color_primary ?? "#C69B3C";
  const activeTheme = casa_theme ?? "classic";

  function selectPreset(preset: ColorPreset) {
    if (preset.id === activePreset?.id) return;
    onUpdate({ color_bg: preset.color_bg, color_primary: preset.color_primary });
    setError(null);
    startTransition(async () => {
      const err = await patchStyle(propertyId, { presetId: preset.id });
      if (err) setError(err);
    });
  }

  function selectTheme(themeId: string) {
    if (activeTheme === themeId) return;
    onUpdate({ casa_theme: themeId });
    setError(null);
    startTransition(async () => {
      const err = await patchStyle(propertyId, { theme: themeId });
      if (err) setError(err);
    });
  }

  return (
    <div
      className="mb-10 px-5 py-5"
      style={{ border: "1px solid rgba(10,10,10,0.10)" }}
    >
      <span
        className="font-sans text-[10px] tracking-regal uppercase block mb-4"
        style={{ color: "rgba(10,10,10,0.40)" }}
      >
        Stil &amp; Farbe
      </span>

      {/* Color chips */}
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
                boxShadow: isSelected
                  ? `0 0 0 2px #F5F0EC, 0 0 0 4px ${preset.color_primary}`
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

      {activePreset && (
        <p
          className="font-sans text-[10px] tracking-regal uppercase mb-5"
          style={{ color: accent }}
        >
          {activePreset.label}
        </p>
      )}

      {/* Theme buttons */}
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
                  ? { backgroundColor: accent, color: "#fff", border: `1px solid ${accent}` }
                  : { backgroundColor: "transparent", color: "rgba(10,10,10,0.35)", border: "1px solid rgba(10,10,10,0.10)" }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 font-sans text-xs text-red-600">{error}</p>}
    </div>
  );
}
