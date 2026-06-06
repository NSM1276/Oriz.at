import type { MenuData } from "@/lib/supabase/types";
import { formatSchedule, getActiveMenuId } from "@/lib/menu-schedule";
import type { ThemeTokens } from "./types";

export function MenusSection({
  menus,
  t,
}: {
  menus: MenuData[];
  t: ThemeTokens;
}) {
  if (!menus.length) return null;
  const timeActiveId = getActiveMenuId(menus);

  return (
    <div style={{ marginTop: 32 }}>
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: t.accent,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        Speisekarten
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {menus.map((m) => {
          const isActive = m.id === timeActiveId;
          const schedule = formatSchedule(m);
          return (
            <div
              key={m.id}
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                backgroundColor: isActive
                  ? t.isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)"
                  : "transparent",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: t.text, fontSize: 14, fontWeight: 500 }}>
                    {m.name}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: t.accent,
                        border: `1px solid ${t.accent}`,
                        borderRadius: 999,
                        padding: "1px 6px",
                      }}
                    >
                      Aktiv
                    </span>
                  )}
                </div>
                {schedule && (
                  <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>
                    {schedule}
                  </div>
                )}
              </div>
              {isActive && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: t.accent,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
