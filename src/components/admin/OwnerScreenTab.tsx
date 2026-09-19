"use client";

import { useEffect, useRef, useState } from "react";
import { COLOR_PRESETS, findPreset } from "@/lib/colorPresets";
import { computeBoardFit } from "@/components/screen/board-fit";
import type { Item, ScreenMode, ScreenSettingsRow, Section } from "@/lib/supabase/types";

// Admin tab «Screen» — six knobs + live preview of /screen/[slug].
// Every change PATCHes immediately (optimistic, revert + alert on error).

type Props = {
  venueId: string;
  slug: string;
  sections: (Section & { items: Item[] })[];
  isDark: boolean;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
};

const ROTATION_OPTIONS = [5, 10, 15, 20];

type Patch = Partial<{
  active: boolean;
  mode: ScreenMode;
  spotlight: boolean;
  rotation_sec: number;
  presetId: string | null;
  sections: string[] | null;
  hero_items: Record<string, string>;
}>;

const DEFAULTS: Omit<ScreenSettingsRow, "venue_id" | "updated_at"> = {
  active: true,
  mode: "showcase",
  rotation_sec: 10,
  spotlight: true,
  color_bg: null,
  color_primary: null,
  sections: null,
  hero_items: {},
  style: {},
};

export function OwnerScreenTab({ venueId, slug, sections, isDark, text, dim, muted, border, accent }: Props) {
  const [settings, setSettings] = useState<typeof DEFAULTS>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Preview scaling: render the board at 1920×1080 and scale to the container width.
  const previewBox = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920));
    ro.observe(el);
    setScale(el.clientWidth / 1920);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/screen-settings?venueId=${venueId}`)
      .then((r) => r.json())
      .then((j: { settings: ScreenSettingsRow | null }) => {
        if (cancelled) return;
        if (j.settings) setSettings({ ...DEFAULTS, ...j.settings });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [venueId]);

  async function save(patch: Patch, optimistic: Partial<typeof DEFAULTS>) {
    const before = settings;
    setSettings((prev) => ({ ...prev, ...optimistic }));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/screen-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ venueId, ...patch }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const { settings: row } = (await res.json()) as { settings: ScreenSettingsRow };
      setSettings({ ...DEFAULTS, ...row });
      setPreviewKey((k) => k + 1);
    } catch (err: unknown) {
      setSettings(before);
      alert(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  const sorted = sections.slice().sort((a, b) => a.position - b.position);
  const allIds = sorted.map((s) => s.id);
  // Effective ordered list of visible section ids (null = all in position order)
  const visibleIds = settings.sections ?? allIds;
  const currentPreset = findPreset(settings.color_bg);
  const inheritsColors = settings.color_bg == null;

  function commitSections(next: string[]) {
    const isDefault = next.length === allIds.length && next.every((id, i) => id === allIds[i]);
    const value = isDefault ? null : next;
    save({ sections: value }, { sections: value });
  }
  function toggleSection(id: string) {
    if (visibleIds.includes(id)) {
      commitSections(visibleIds.filter((x) => x !== id));
    } else {
      // Re-insert at its natural position among the currently visible ones
      const next = allIds.filter((x) => x === id || visibleIds.includes(x));
      // keep the owner's custom order for the already-visible ones
      const ordered = [...visibleIds];
      const naturalIdx = next.indexOf(id);
      ordered.splice(Math.min(naturalIdx, ordered.length), 0, id);
      commitSections(ordered);
    }
  }
  function moveSection(id: string, dir: -1 | 1) {
    const idx = visibleIds.indexOf(id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= visibleIds.length) return;
    const next = [...visibleIds];
    [next[idx], next[to]] = [next[to], next[idx]];
    commitSections(next);
  }
  function setHero(sectionId: string, itemId: string | "") {
    const next = { ...settings.hero_items };
    if (itemId) next[sectionId] = itemId; else delete next[sectionId];
    save({ hero_items: next }, { hero_items: next });
  }

  // On a static Tafel the whole menu must fit one screen. If it cannot, say so
  // here, where the operator can act: drop sections or switch back to Vitrine.
  const tafelFit =
    settings.mode === "tafel"
      ? computeBoardFit(sorted.filter((s) => visibleIds.includes(s.id)))
      : null;

  const pill = (active: boolean): React.CSSProperties => ({
    borderColor: active ? accent : border,
    backgroundColor: active ? accent : "transparent",
    color: active ? (isDark ? "#0A0A0A" : "#FFFFFF") : text,
  });

  const screenUrl = `/screen/${slug}`;

  return (
    <div className="space-y-10">
      {/* Status + links */}
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          disabled={!loaded || saving}
          onClick={() => save({ active: !settings.active }, { active: !settings.active })}
          className="font-sans text-[11px] tracking-regal uppercase px-4 py-2.5 border transition-colors"
          style={pill(settings.active)}
        >
          {settings.active ? "Screen aktiv" : "Screen pausiert"}
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-sans text-xs" style={{ color: muted }}>
            Am TV öffnen: <span style={{ color: dim }}>oriz.at{screenUrl}</span>
          </span>
          <a
            href={screenUrl}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-80"
            style={{ backgroundColor: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}
          >
            Vollbild testen ↗
          </a>
        </div>
      </section>

      {/* Live preview */}
      <section>
        <Title text={text} muted={muted} accent={accent}>Vorschau</Title>
        <div
          ref={previewBox}
          className="mt-4 relative w-full overflow-hidden"
          style={{ aspectRatio: "16 / 9", border: `1px solid ${border}`, background: "#000" }}
        >
          <iframe
            key={previewKey}
            src={`${screenUrl}?preview=1`}
            title="Screen Vorschau"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1920,
              height: 1080,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          />
        </div>
      </section>

      {/* Darstellung */}
      <section>
        <Title text={text} muted={muted} accent={accent}>Darstellung</Title>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {([
            { id: "showcase" as const, label: "Vitrine", body: "Ein Bereich nach dem anderen, mit großem Empfehlungsbild. Für Restaurant, Bar, Lounge." },
            { id: "tafel" as const, label: "Tafel", body: "Die ganze Karte auf einmal, ohne Blättern. Für Theke, Imbiss, Bäckerei." },
          ]).map(({ id, label, body }) => {
            const active = settings.mode === id;
            return (
              <button
                key={id}
                type="button"
                disabled={!loaded || saving}
                onClick={() => save({ mode: id }, { mode: id })}
                className="text-left px-4 py-3 border transition-colors"
                style={{
                  borderColor: active ? accent : border,
                  backgroundColor: active ? accent : "transparent",
                  color: active ? (isDark ? "#0A0A0A" : "#FFFFFF") : text,
                }}
              >
                <span className="font-sans text-[11px] tracking-regal uppercase block">{label}</span>
                <span
                  className="font-sans text-xs block mt-1"
                  style={{ color: active ? (isDark ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.8)") : muted }}
                >
                  {body}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {tafelFit && !tafelFit.readable && (
        <p
          className="font-sans text-xs leading-relaxed px-4 py-3"
          style={{ border: `1px solid ${accent}`, color: text, backgroundColor: `${accent}14` }}
        >
          Diese Karte passt nicht lesbar auf einen Bildschirm. Blenden Sie unten
          Bereiche aus, verteilen Sie die Karte auf zwei Bildschirme oder wechseln
          Sie auf „Vitrine“. Kleiner wird die Schrift nicht — sie wäre aus fünf
          Metern nicht mehr zu lesen.
        </p>
      )}

      {/* Rotation + Spotlight — meaningless on a static Tafel */}
      {settings.mode !== "tafel" && (
      <section>
        <Title text={text} muted={muted} accent={accent}>Wechsel</Title>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {ROTATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              disabled={!loaded || saving}
              onClick={() => save({ rotation_sec: sec }, { rotation_sec: sec })}
              className="font-sans text-sm px-4 py-2 border transition-colors"
              style={pill(settings.rotation_sec === sec)}
            >
              {sec} s
            </button>
          ))}
          <span className="font-sans text-xs ml-2" style={{ color: muted }}>pro Seite</span>
          <span className="flex-1" />
          <button
            type="button"
            disabled={!loaded || saving}
            onClick={() => save({ spotlight: !settings.spotlight }, { spotlight: !settings.spotlight })}
            className="font-sans text-[11px] tracking-regal uppercase px-4 py-2 border transition-colors"
            style={pill(settings.spotlight)}
          >
            Spotlight {settings.spotlight ? "an" : "aus"}
          </button>
        </div>
        <p className="font-sans text-xs mt-2" style={{ color: muted }}>
          Spotlight zeigt nach jedem Bereich ein Gericht bildschirmfüllend.
        </p>
      </section>
      )}

      {/* Colors */}
      <section>
        <Title text={text} muted={muted} accent={accent}>Farben am Screen</Title>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={!loaded || saving}
            onClick={() => save({ presetId: null }, { color_bg: null, color_primary: null })}
            className="font-sans text-[11px] tracking-regal uppercase px-4 py-2 border transition-colors"
            style={pill(inheritsColors)}
          >
            Wie Speisekarte
          </button>
          {COLOR_PRESETS.map((p) => {
            const selected = !inheritsColors && currentPreset?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                title={p.label}
                disabled={!loaded || saving}
                onClick={() => save({ presetId: p.id }, { color_bg: p.color_bg, color_primary: p.color_primary })}
                className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${p.color_bg} 50%, ${p.color_primary} 50%)`,
                  borderColor: selected ? accent : border,
                  boxShadow: selected ? `0 0 0 2px ${accent}` : "none",
                }}
                aria-label={p.label}
              />
            );
          })}
        </div>
      </section>

      {/* Sections */}
      <section>
        <Title text={text} muted={muted} accent={accent}>Bereiche am Screen</Title>
        <ul className="mt-4 space-y-2">
          {[...visibleIds.map((id) => sorted.find((s) => s.id === id)).filter(Boolean) as typeof sorted,
            ...sorted.filter((s) => !visibleIds.includes(s.id))].map((s) => {
            const visible = visibleIds.includes(s.id);
            const idx = visibleIds.indexOf(s.id);
            return (
              <li key={s.id} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!loaded || saving}
                  onClick={() => toggleSection(s.id)}
                  className="w-6 h-6 border flex items-center justify-center font-sans text-xs shrink-0"
                  style={pill(visible)}
                  aria-label={visible ? "Ausblenden" : "Einblenden"}
                >
                  {visible ? "✓" : ""}
                </button>
                <span className="font-sans text-sm flex-1" style={{ color: visible ? text : muted }}>
                  {s.name}
                  <span className="ml-2 text-xs" style={{ color: muted }}>{s.items.length}</span>
                </span>
                {visible && (
                  <span className="flex gap-1">
                    <button type="button" disabled={!loaded || saving || idx === 0} onClick={() => moveSection(s.id, -1)}
                      className="w-7 h-7 border font-sans text-xs disabled:opacity-30" style={{ borderColor: border, color: dim }} aria-label="Nach oben">▲</button>
                    <button type="button" disabled={!loaded || saving || idx === visibleIds.length - 1} onClick={() => moveSection(s.id, 1)}
                      className="w-7 h-7 border font-sans text-xs disabled:opacity-30" style={{ borderColor: border, color: dim }} aria-label="Nach unten">▼</button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Hero per section — there is no hero panel on a Tafel */}
      {settings.mode !== "tafel" && sorted.some((s) => s.items.some((it) => it.image_url)) && (
        <section>
          <Title text={text} muted={muted} accent={accent}>Empfehlung pro Bereich</Title>
          <p className="font-sans text-xs mt-2" style={{ color: muted }}>
            Das große Bild links. «Automatisch» wechselt alle 6 Sekunden durch alle Gerichte mit Foto.
          </p>
          <div className="mt-4 space-y-2">
            {sorted.filter((s) => s.items.some((it) => it.image_url)).map((s) => (
              <label key={s.id} className="flex items-center gap-3">
                <span className="font-sans text-sm w-40 shrink-0 truncate" style={{ color: text }}>{s.name}</span>
                <select
                  disabled={!loaded || saving}
                  value={settings.hero_items[s.id] ?? ""}
                  onChange={(e) => setHero(s.id, e.target.value)}
                  className="border px-3 py-2 font-sans text-sm outline-none bg-transparent flex-1"
                  style={{ borderColor: border, color: text }}
                >
                  <option value="" style={{ color: "#0A0A0A" }}>Automatisch</option>
                  {s.items.filter((it) => it.image_url).sort((a, b) => a.position - b.position).map((it) => (
                    <option key={it.id} value={it.id} style={{ color: "#0A0A0A" }}>{it.name}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Title({ children, text, muted, accent }: { children: React.ReactNode; text: string; muted: string; accent: string }) {
  return (
    <header className="flex items-center gap-4">
      <span className="font-sans text-sm tracking-regal uppercase shrink-0" style={{ color: accent, fontWeight: 600 }}>{children}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.25 }} />
      <span className="sr-only" style={{ color: text }}>{muted}</span>
    </header>
  );
}
