"use client";

import { useEffect, useState } from "react";
import type { MenuData, Section } from "@/lib/supabase/types";
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
  sections?: Section[];
};

export function MenusManager({ venueId, isDark, text, dim, muted, border, accent, sections: initialSections = [] }: Props) {
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // sections with optimistic menu_id tracking
  const [sections, setSections] = useState<Section[]>(initialSections);
  // which menu card has the assign panel open
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  // toggling in-flight per sectionId
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

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
    if (res.ok) {
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
      // unassign sections that were pointing at this menu optimistically
      setSections((prev) =>
        prev.map((s) => (s.menu_id === menuId ? { ...s, menu_id: null } : s)),
      );
      if (expandedMenuId === menuId) setExpandedMenuId(null);
    }
  }

  async function handleToggleSection(sectionId: string, menuId: string, currentlyAssigned: boolean) {
    // optimistic update
    const newMenuId = currentlyAssigned ? null : menuId;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, menu_id: newMenuId } : s)),
    );
    setTogglingIds((prev) => new Set(prev).add(sectionId));
    try {
      const res = await fetch("/api/admin/section-update", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sectionId, menuId: newMenuId }),
      });
      if (!res.ok) {
        // revert on error
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, menu_id: currentlyAssigned ? menuId : null } : s,
          ),
        );
      }
    } catch {
      // revert
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, menu_id: currentlyAssigned ? menuId : null } : s,
        ),
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
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
            const isExpanded = expandedMenuId === m.id;
            const assignedSections = sections.filter((s) => s.menu_id === m.id);
            return (
              <div key={m.id} style={{ ...sectionBg }}>
                {/* Menu header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  {/* Assign toggle button */}
                  {sections.length > 0 && (
                    <button
                      onClick={() => setExpandedMenuId(isExpanded ? null : m.id)}
                      style={{
                        background: isExpanded ? accent : "transparent",
                        color: isExpanded ? (isDark ? "#0A0A0A" : "#FFFFFF") : accent,
                        border: `1px solid ${accent}`,
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 11,
                        cursor: "pointer",
                        letterSpacing: "0.06em",
                        flexShrink: 0,
                      }}
                      title="Abschnitte zuweisen"
                    >
                      {isExpanded ? "Fertig" : `Bereiche${assignedSections.length > 0 ? ` (${assignedSections.length})` : ""}`}
                    </button>
                  )}
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

                {/* Section assignment panel */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: `1px solid ${border}`,
                      paddingTop: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: dim,
                        marginBottom: 8,
                      }}
                    >
                      Abschnitte diesem Menü zuweisen
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {sections
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((s) => {
                          const assigned = s.menu_id === m.id;
                          const toggling = togglingIds.has(s.id);
                          // section belongs to a DIFFERENT menu — show dimmed
                          const otherMenu = s.menu_id != null && s.menu_id !== m.id;
                          return (
                            <button
                              key={s.id}
                              disabled={toggling || otherMenu}
                              onClick={() => {
                                if (!otherMenu) handleToggleSection(s.id, m.id, assigned);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minHeight: 44,
                                padding: "6px 8px",
                                background: assigned
                                  ? isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.04)"
                                  : "transparent",
                                border: `1px solid ${assigned ? accent : border}`,
                                borderRadius: 4,
                                cursor: otherMenu ? "not-allowed" : toggling ? "wait" : "pointer",
                                opacity: toggling ? 0.6 : otherMenu ? 0.4 : 1,
                                textAlign: "left",
                                width: "100%",
                              }}
                            >
                              {/* Checkbox indicator */}
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 3,
                                  border: `1.5px solid ${assigned ? accent : border}`,
                                  background: assigned ? accent : "transparent",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {assigned && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke={isDark ? "#0A0A0A" : "#FFFFFF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span style={{ color: text, fontSize: 13, flex: 1 }}>{s.name}</span>
                              {otherMenu && (
                                <span style={{ color: muted, fontSize: 11 }}>
                                  {menus.find((mx) => mx.id === s.menu_id)?.name ?? "anderes Menü"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    {sections.length === 0 && (
                      <p style={{ color: muted, fontSize: 13 }}>Keine Bereiche vorhanden.</p>
                    )}
                  </div>
                )}
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
