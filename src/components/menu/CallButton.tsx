"use client";

import { useCallback, useEffect, useState } from "react";
import type { CallKind, CallStatus } from "@/lib/service";

// Floating "Service" button for guests who sat down through a table sticker.
// The table itself is never sent from here — the server reads it from the
// httpOnly cookie the sticker set. It floats just above the menu's own
// bottom action bar (StickyActionBar, ~58px) so it never covers it.

const STRINGS = {
  de: {
    button: "Service",
    title: "Wie können wir helfen?",
    kinds: {
      order: ["Bestellen", "Wir kommen an den Tisch"],
      bill: ["Zahlen", "Die Rechnung, bitte"],
      help: ["Frage", "Jemand kommt kurz vorbei"],
    },
    sent: "Gesendet — das Team weiß Bescheid",
    accepted: "Kommt gleich zu Ihnen",
    done: "Erledigt",
    cancel: "Zurücknehmen",
    close: "Schließen",
    limit: "Das Team ist schon informiert. Bitte einen Moment Geduld.",
    error: "Hat leider nicht geklappt. Bitte sprechen Sie das Personal direkt an.",
  },
  en: {
    button: "Service",
    title: "How can we help?",
    kinds: {
      order: ["Order", "We'll come to your table"],
      bill: ["Pay", "The bill, please"],
      help: ["Question", "Someone will stop by"],
    },
    sent: "Sent — the team has been notified",
    accepted: "On the way to you",
    done: "Done",
    cancel: "Cancel",
    close: "Close",
    limit: "The team already knows. Please bear with us for a moment.",
    error: "That didn't work. Please ask the staff directly.",
  },
} as const;

type Active = { id: string; secret: string | null; kind: CallKind; status: CallStatus };

const POLL_MS = 5000;

function isDark(hex: string | null): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

export function CallButton({
  slug,
  tableName,
  bg,
  accent,
  initialLocale,
}: {
  slug: string;
  tableName: string;
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

  const t = locale === "de" ? STRINGS.de : STRINGS.en;
  const background = bg ?? "#F5F0EC";
  const color = accent ?? "#C69B3C";
  const text = isDark(background) ? "#F5F0EC" : "#1C1917";

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
        onClick={() => { syncLocale(); setOpen(true); }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-sans text-sm font-semibold shadow-lg"
        style={{ backgroundColor: color, color: background }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 8V6M10 6h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{status && active ? `${t.kinds[active.kind][0]} · ${status}` : t.button}</span>
        {active?.status === "open" && <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: background }} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={t.title}>
          <button type="button" aria-label={t.close} className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-5 font-sans shadow-2xl"
            style={{ backgroundColor: background, color: text }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full opacity-30" style={{ backgroundColor: text }} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color }}>{tableName}</p>
            <p className="mt-1 text-xl font-semibold">{t.title}</p>

            {pending && active ? (
              <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                <p className="text-lg font-semibold">{t.kinds[active.kind][0]}</p>
                <p className="mt-0.5 text-sm opacity-80">{status}</p>
                {active.secret && active.status === "open" && (
                  <button type="button" onClick={cancel} className="mt-3 text-sm font-medium underline opacity-80">
                    {t.cancel}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-5 grid gap-2">
                {(["order", "bill", "help"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={sending !== null}
                    onClick={() => call(kind)}
                    className="flex items-center justify-between rounded-2xl px-4 py-4 text-left ring-1 transition-opacity disabled:opacity-50"
                    style={{ borderColor: color, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)` }}
                  >
                    <span>
                      <span className="block text-base font-semibold">{t.kinds[kind][0]}</span>
                      <span className="block text-sm opacity-70">{t.kinds[kind][1]}</span>
                    </span>
                    <span aria-hidden style={{ color }}>{sending === kind ? "…" : "›"}</span>
                  </button>
                ))}
              </div>
            )}

            {notice && <p className="mt-4 text-sm opacity-80">{notice}</p>}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-2xl py-3 text-sm font-semibold"
              style={{ backgroundColor: color, color: background }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {!open && notice && (
        <p
          role="status"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+128px)] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 font-sans text-sm shadow"
          style={{ backgroundColor: background, color: text }}
        >
          {notice}
        </p>
      )}
    </>
  );
}
