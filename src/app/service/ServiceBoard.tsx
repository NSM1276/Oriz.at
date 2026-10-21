"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardCall } from "@/app/api/service/board/route";
import { KIND_LABEL_DE } from "@/lib/service";
import { tableDisplayName } from "@/lib/tables";

const POLL_VISIBLE_MS = 3000;
const POLL_HIDDEN_MS = 15000;

const KIND_STYLE = {
  bill: "bg-amber-100 text-amber-900 ring-amber-300",
  order: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  help: "bg-sky-100 text-sky-900 ring-sky-300",
} as const;

function minutesSince(iso: string, now: number): string {
  const min = Math.floor((now - Date.parse(iso)) / 60_000);
  return min < 1 ? "gerade eben" : `seit ${min} Min.`;
}

// Two short rising tones — audible over a busy room without being a siren.
function chime(ctx: AudioContext) {
  const t = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.4, t + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.18);
    osc.stop(t + i * 0.18 + 0.18);
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type PushState = "unsupported" | "needs-install" | "off" | "on" | "denied" | "busy";

export function ServiceBoard({
  venueName,
  deviceName,
  callsEnabled,
  vapidPublicKey,
}: {
  venueName: string;
  deviceName: string;
  callsEnabled: boolean;
  vapidPublicKey: string | null;
}) {
  const [calls, setCalls] = useState<BoardCall[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [offline, setOffline] = useState(false);
  const [unpaired, setUnpaired] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [awake, setAwake] = useState(false);
  const [push, setPush] = useState<PushState>("busy");
  const [canWake, setCanWake] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const audio = useRef<AudioContext | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/service/board", { cache: "no-store" });
      if (res.status === 401) { setUnpaired(true); return; }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { deviceId: string; calls: BoardCall[]; now: string };
      setOffline(false);
      setDeviceId(data.deviceId);
      setNow(Date.parse(data.now));
      setCalls(data.calls);

      // Alert once per new open call; the first load only learns what is there.
      const openIds = data.calls.filter((c) => c.status === "open").map((c) => c.id);
      if (seen.current) {
        const fresh = openIds.filter((id) => !seen.current!.has(id));
        if (fresh.length) {
          if (audio.current && audio.current.state === "running") chime(audio.current);
          navigator.vibrate?.([200, 100, 200]);
        }
      }
      seen.current = new Set([...(seen.current ?? []), ...openIds]);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      await load();
      if (!stopped) timer = setTimeout(tick, document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS);
    };
    tick();
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const openCount = calls.filter((c) => c.status === "open").length;
  useEffect(() => {
    document.title = openCount ? `(${openCount}) Service — ORIZ` : "Service — ORIZ";
  }, [openCount]);

  // Remember the sound choice; browsers still need one tap per page load to allow audio.
  useEffect(() => {
    try { if (localStorage.getItem("oriz-service-sound") === "1") setSoundOn(true); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!soundOn) return;
    const unlock = () => {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    };
    unlock();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, [soundOn]);

  useEffect(() => setCanWake("wakeLock" in navigator), []);

  // Push: what this browser can do, and whether it is already subscribed.
  useEffect(() => {
    (async () => {
      if (!vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setPush(ios && !standalone && vapidPublicKey ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") { setPush("denied"); return; }
      const reg = await navigator.serviceWorker.register("/service-sw.js", { scope: "/service" });
      const sub = await reg.pushManager.getSubscription();
      setPush(sub ? "on" : "off");
    })().catch(() => setPush("unsupported"));
  }, [vapidPublicKey]);

  async function togglePush() {
    if (!vapidPublicKey) return;
    setPush("busy");
    try {
      const reg = await navigator.serviceWorker.register("/service-sw.js", { scope: "/service" });
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        await fetch("/api/service/push", { method: "DELETE" });
        setPush("off");
        return;
      }
      if ((await Notification.requestPermission()) !== "granted") { setPush("denied"); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/service/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPush(res.ok ? "on" : "off");
    } catch {
      setPush("off");
    }
  }

  async function toggleAwake() {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      setAwake(false);
      return;
    }
    try {
      wakeLock.current = await navigator.wakeLock.request("screen");
      wakeLock.current.addEventListener("release", () => { wakeLock.current = null; setAwake(false); });
      setAwake(true);
    } catch { /* not supported or refused */ }
  }

  async function act(id: string, action: "accept" | "done" | "release") {
    setBusyId(id);
    try {
      const res = await fetch("/api/service/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.status === 409) navigator.vibrate?.(60);
    } finally {
      await load();
      setBusyId(null);
    }
  }

  if (unpaired) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-100 p-6 text-center font-sans text-stone-900">
        <div>
          <p className="text-lg font-semibold">Gerät getrennt</p>
          <p className="mt-1 text-sm text-stone-600">Die Leitung hat dieses Gerät entfernt. Für einen neuen Zugang bitte neu verbinden.</p>
        </div>
      </div>
    );
  }

  const active = calls.filter((c) => c.status === "open" || c.status === "accepted");
  const finished = calls.filter((c) => c.status === "done" || c.status === "cancelled").reverse();

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100 [color-scheme:dark]">
      <header className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/95 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{venueName}</p>
            <p className="text-xs text-stone-400">
              {deviceName} · {offline ? <span className="text-red-400">keine Verbindung</span> : "verbunden"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${openCount ? "bg-amber-400 text-stone-950" : "bg-stone-800 text-stone-300"}`}>
            {openCount} offen
          </span>
        </div>
        <div className="mx-auto mt-3 flex max-w-3xl gap-2 overflow-x-auto text-sm" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              try { localStorage.setItem("oriz-service-sound", next ? "1" : "0"); } catch { /* ignore */ }
              if (next) { audio.current ??= new AudioContext(); void audio.current.resume().then(() => chime(audio.current!)); }
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 ring-1 ${soundOn ? "bg-stone-100 text-stone-950 ring-stone-100" : "ring-stone-700"}`}
          >
            {soundOn ? "Ton an" : "Ton aus"}
          </button>
          {push !== "unsupported" && (
            <button
              type="button"
              disabled={push === "busy" || push === "denied" || push === "needs-install"}
              onClick={togglePush}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 ring-1 disabled:opacity-60 ${push === "on" ? "bg-stone-100 text-stone-950 ring-stone-100" : "ring-stone-700"}`}
            >
              {push === "on" && "Benachrichtigungen an"}
              {push === "off" && "Benachrichtigungen aus"}
              {push === "busy" && "Benachrichtigungen …"}
              {push === "denied" && "Benachrichtigungen blockiert"}
              {push === "needs-install" && "Benachrichtigungen: erst zum Home-Bildschirm"}
            </button>
          )}
          {canWake && (
            <button
              type="button"
              onClick={toggleAwake}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 ring-1 ${awake ? "bg-stone-100 text-stone-950 ring-stone-100" : "ring-stone-700"}`}
            >
              {awake ? "Bildschirm bleibt an" : "Bildschirm wach halten"}
            </button>
          )}
        </div>
        {push === "needs-install" && (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-stone-400">
            iPhone: unten auf „Teilen“ → „Zum Home-Bildschirm“, dann die App von dort öffnen.
          </p>
        )}
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 pb-16 pt-4">
        {!callsEnabled && (
          <p className="rounded-xl bg-stone-900 px-4 py-3 text-sm text-stone-300 ring-1 ring-stone-800">
            Gäste können gerade nicht rufen — die Leitung hat die Funktion ausgeschaltet.
          </p>
        )}

        {active.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-2xl font-semibold text-stone-300">Alles ruhig</p>
            <p className="mt-1 text-sm text-stone-500">Neue Rufe erscheinen hier sofort.</p>
          </div>
        )}

        {active.map((c) => {
          const mine = c.accepted_by === deviceId;
          return (
            <article
              key={c.id}
              className={`rounded-2xl p-4 ring-1 ${c.status === "open" ? "bg-stone-100 text-stone-950 ring-stone-100" : "bg-stone-900 ring-stone-800"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold leading-tight">{tableDisplayName(c.table_label)}</p>
                  <p className={`text-sm ${c.status === "open" ? "text-stone-600" : "text-stone-400"}`}>{minutesSince(c.created_at, now)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-base font-semibold ring-1 ${KIND_STYLE[c.kind]}`}>
                  {KIND_LABEL_DE[c.kind]}
                </span>
              </div>

              {c.status === "open" ? (
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => act(c.id, "accept")}
                  className="mt-4 w-full rounded-xl bg-stone-950 py-4 text-lg font-semibold text-white disabled:opacity-50"
                >
                  Übernehmen
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <p className="flex-1 text-sm text-stone-300">
                    {mine ? "Sie gehen hin" : `${c.accepted_by_name ?? "Jemand"} geht hin`}
                  </p>
                  {mine && (
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => act(c.id, "release")}
                      className="rounded-xl px-3 py-2.5 text-sm text-stone-400 ring-1 ring-stone-700"
                    >
                      Zurückgeben
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => act(c.id, "done")}
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-stone-950"
                  >
                    Erledigt
                  </button>
                </div>
              )}
            </article>
          );
        })}

        {finished.length > 0 && (
          <section className="pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Zuletzt</p>
            <ul className="mt-2 divide-y divide-stone-900 text-sm text-stone-500">
              {finished.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 py-2">
                  <span>{tableDisplayName(c.table_label)} · {KIND_LABEL_DE[c.kind]}</span>
                  <span>{c.status === "cancelled" ? "vom Gast zurückgenommen" : `erledigt${c.accepted_by_name ? ` · ${c.accepted_by_name}` : ""}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
