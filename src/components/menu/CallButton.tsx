"use client";

import { useCallback, useEffect, useState } from "react";
import type { CallKind, CallStatus } from "@/lib/service";
import { callText, tableText } from "@/lib/call-i18n";
import { RTL_LOCALES } from "@/lib/locales";

// Floating "Service" button for guests who sat down through a table sticker.
// The table itself is never sent from here — the server reads it from the
// httpOnly cookie the sticker set. It floats just above the menu's own
// bottom action bar (StickyActionBar, ~58px) so it never covers it.

type Active = { id: string; secret: string | null; kind: CallKind; status: CallStatus };

const POLL_MS = 5000;

/** Relative luminance (WCAG) of a #rrggbb colour; unknown colours count as mid-grey. */
function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
}

const ICONS: Record<CallKind | "bell", string> = {
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0",
  order: "M4 5h16M4 12h16M4 19h10",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6",
  help: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01",
};

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function CallButton({
  slug,
  tableLabel,
  bg,
  accent,
  initialLocale,
}: {
  slug: string;
  tableLabel: string;
  bg: string | null;
  accent: string | null;
  initialLocale: string;
}) {
  const storageKey = `oriz-call-${slug}`;
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(initialLocale);
  const [active, setActive] = useState<Active | null>(null);
  const [sending, setSending] = useState<CallKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const t = callText(locale);
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const background = bg ?? "#F5F0EC";
  const color = accent ?? "#C69B3C";
  const text = luminance(background) < 0.4 ? "#F5F0EC" : "#1C1917";
  // Text on the accent: whichever of black/white has more contrast (same rule as the menu's --accent-ink).
  const ink = luminance(color) > 0.18 ? "#0A0A0A" : "#FFFFFF";

  const remember = useCallback((a: Active | null) => {
    setActive(a);
    try {
      if (a) sessionStorage.setItem(storageKey, JSON.stringify(a));
      else sessionStorage.removeItem(storageKey);
    } catch { /* private mode */ }
  }, [storageKey]);

  // Pick up a call placed before a reload, and the language the menu is showing.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setActive(JSON.parse(saved) as Active);
    } catch { /* ignore */ }
  }, [storageKey]);

  function syncLocale() {
    try {
      const saved = localStorage.getItem(`oriz-lang-${slug}`);
      if (saved) setLocale(saved);
    } catch { /* ignore */ }
  }

  const pending = active && (active.status === "open" || active.status === "accepted");

  useEffect(() => {
    if (!pending || !active) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/service/call?id=${active.id}`, { cache: "no-store" });
        if (stopped) return;
        if (res.status === 404) { remember(null); return; }
        const { status } = (await res.json()) as { status: CallStatus };
        if (status === active.status) return;
        if (status === "done" || status === "cancelled") {
          remember(null);
          if (status === "done") setNotice(t.done);
        } else {
          remember({ ...active, status });
        }
      } catch { /* try again next tick */ }
    }, POLL_MS);
    return () => { stopped = true; clearInterval(timer); };
  }, [pending, active, remember, t.done]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function call(kind: CallKind) {
    setSending(kind);
    setNotice(null);
    try {
      const res = await fetch("/api/service/call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (res.status === 429) { setNotice(t.limit); return; }
      if (!res.ok) { setNotice(t.error); return; }
      const data = (await res.json()) as { id: string; secret: string | null; status: CallStatus };
      remember({ id: data.id, secret: data.secret, kind, status: data.status });
      navigator.vibrate?.(30);
    } catch {
      setNotice(t.error);
    } finally {
      setSending(null);
    }
  }

  async function cancel() {
    if (!active?.secret) return;
    const { id, secret } = active;
    remember(null);
    try {
      await fetch("/api/service/call", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, secret }),
      });
    } catch { /* the board drops stale calls anyway */ }
  }

  const status = pending ? (active!.status === "accepted" ? t.accepted : t.sent) : null;

  return (
    <>
      <button
        type="button"
        dir={dir}
        onClick={() => { syncLocale(); setOpen(true); }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-1/2 z-40 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-full py-2.5 pe-5 ps-2.5 font-sans text-[15px] font-semibold transition-transform active:scale-95"
        style={{ backgroundColor: color, color: ink, boxShadow: "0 10px 30px -8px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.18)" }}
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: ink === "#FFFFFF" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)" }}>
          <Icon d={pending && active ? ICONS[active.kind] : ICONS.bell} size={18} />
          {active?.status === "open" && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full" style={{ backgroundColor: ink }} />
          )}
        </span>
        <span className="truncate">{status && active ? `${t[active.kind][0]} · ${status}` : t.button}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={t.title} dir={dir}>
          <button type="button" aria-label={t.close} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-t-[28px] px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 font-sans shadow-2xl"
            style={{ backgroundColor: background, color: text }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full opacity-25" style={{ backgroundColor: text }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color }}>{tableText(tableLabel, locale)}</p>
                <p className="mt-1 text-xl font-semibold">{t.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${text} 18%, transparent)` }}
              >
                <Icon d="M6 6l12 12M18 6L6 18" size={16} />
              </button>
            </div>

            {pending && active ? (
              <div className="mt-5 flex items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ backgroundColor: color, color: ink }}>
                  <Icon d={ICONS[active.kind]} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold">{t[active.kind][0]}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-sm opacity-80">
                    {active.status === "open" && <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: color }} />}
                    {status}
                  </span>
                  {active.secret && active.status === "open" && (
                    <button type="button" onClick={cancel} className="mt-2 text-sm font-medium underline underline-offset-2 opacity-80">
                      {t.cancel}
                    </button>
                  )}
                </span>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {(["order", "bill", "help"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={sending !== null}
                    onClick={() => call(kind)}
                    className="flex min-h-[132px] flex-col items-center justify-start gap-2 rounded-2xl px-2 pb-3 pt-4 text-center transition-[opacity,transform] active:scale-[0.97] disabled:opacity-50"
                    style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 7%, transparent)` }}
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: color, color: ink }}>
                      {sending === kind ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon d={ICONS[kind]} size={22} />}
                    </span>
                    <span className="text-[15px] font-semibold leading-tight">{t[kind][0]}</span>
                    <span className="text-sm leading-snug opacity-70">{t[kind][1]}</span>
                  </button>
                ))}
              </div>
            )}

            {notice && <p className="mt-4 text-sm opacity-80" role="status">{notice}</p>}
          </div>
        </div>
      )}

      {!open && notice && (
        <p
          role="status"
          dir={dir}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+132px)] left-1/2 z-40 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full px-4 py-2 text-center font-sans text-sm shadow-lg"
          style={{ backgroundColor: background, color: text }}
        >
          {notice}
        </p>
      )}
    </>
  );
}
