"use client";

import { useEffect, useState } from "react";
import type { MenuData } from "@/lib/supabase/types";
import { formatSchedule, getActiveMenuId } from "@/lib/menu-schedule";

const DAY_OPTIONS = [
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
  { key: "sun", label: "So" },
] as const;

type Props = {
  venueId: string;
  isDark: boolean;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
};

export function MenusManager({ venueId, isDark, text, dim, muted, border, accent }: Props) {
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDays, setFormDays] = useState<string[]>([]);
  const [formFrom, setFormFrom] = useState("09:00");
  const [formTo, setFormTo] = useState("22:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    color: text,
    borderColor: border,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    border: `1px solid ${border}`,
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  useEffect(() => {
    fetch(`/api/admin/menus?venueId=${venueId}`)
      .then((r) => r.json())
      .then((j) => setMenus(j.menus ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId]);

  function toggleDay(key: string) {
    setFormDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key],
    );
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueId,
          name: formName.trim(),
          active_days: formDays,
          time_from: formFrom || null,
          time_to: formTo || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { menu } = await res.json();
      setMenus((prev) => [...prev, menu].sort((a, b) => a.position - b.position));
      setShowForm(false);
      setFormName("");
      setFormDays([]);
      setFormFrom("09:00");
      setFormTo("22:00");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(menuId: string) {
    if (!confirm("Speisekarte löschen? Sektionen bleiben erhalten.")) return;
    const res = await fetch(`/api/admin/menus?id=${menuId}`, { method: "DELETE" });
    if (res.ok) setMenus((prev) => prev.filter((m) => m.id !== menuId));
  }

  const timeActiveId = getActiveMenuId(menus);

  const sectionBg: React.CSSProperties = {
    border: `1px solid ${border}`,
    borderRadius: 6,
    padding: "16px",
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "inherit",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 600,
          }}
        >
          Speisekarten
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: accent, opacity: 0.2 }} />
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: showForm ? accent : "transparent",
            color: showForm ? (isDark ? "#0A0A0A" : "#FFFFFF") : accent,
            border: `1px solid ${accent}`,
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          {showForm ? "Abbrechen" : "+ Neu"}
        </button>
      </div>

      {/* Menu list */}
      {loading ? (
        <p style={{ color: muted, fontSize: 13 }}>Lädt...</p>
      ) : menus.length === 0 && !showForm ? (
        <p style={{ color: dim, fontSize: 13 }}>
          Keine Speisekarten. Erstelle eine um Sektionen zeitgesteuert anzuzeigen.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {menus.map((m) => {
            const isActive = m.id === timeActiveId;
            const schedule = formatSchedule(m);
            return (
              <div key={m.id} style={{ ...sectionBg, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: text, fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: accent,
                          border: `1px solid ${accent}`,
                          borderRadius: 999,
                          padding: "1px 6px",
                        }}
                      >
                        Aktiv
                      </span>
                    )}
                  </div>
                  {schedule && (
                    <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{schedule}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: muted,
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    padding: "2px 6px",
                    flexShrink: 0,
                  }}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ ...sectionBg, marginTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", color: dim, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                Name
              </label>
              <input
                style={inputStyle}
                placeholder="z.B. Abendkarte"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", color: dim, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Tage
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAY_OPTIONS.map(({ key, label }) => {
                  const selected = formDays.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 12,
                        borderRadius: 4,
                        border: `1px solid ${selected ? accent : border}`,
                        background: selected ? accent : "transparent",
                        color: selected ? (isDark ? "#0A0A0A" : "#FFFFFF") : text,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: dim, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  Von
                </label>
                <input
                  type="time"
                  style={inputStyle}
                  value={formFrom}
                  onChange={(e) => setFormFrom(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: dim, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  Bis
                </label>
                <input
                  type="time"
                  style={inputStyle}
                  value={formTo}
                  onChange={(e) => setFormTo(e.target.value)}
                />
              </div>
            </div>

            {error && <p style={{ color: "#DC2626", fontSize: 12 }}>{error}</p>}

            <button
              onClick={handleCreate}
              disabled={saving || !formName.trim()}
              style={{
                background: accent,
                color: isDark ? "#0A0A0A" : "#FFFFFF",
                border: "none",
                borderRadius: 4,
                padding: "10px",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: saving ? "wait" : "pointer",
                opacity: saving || !formName.trim() ? 0.6 : 1,
              }}
            >
              {saving ? "Speichert..." : "Speisekarte erstellen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
