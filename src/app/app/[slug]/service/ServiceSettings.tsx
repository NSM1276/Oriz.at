"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPairing, pairThisDevice, revokeDevice, setServiceEnabled, type PairingResult } from "./actions";
import type { DeviceRow } from "./page";

const timeFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function lastSeen(iso: string): string {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 10) return "gerade aktiv";
  if (min < 60) return `vor ${min} Min.`;
  return `zuletzt ${timeFmt.format(new Date(iso))}`;
}

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";

export function ServiceSettings({
  slug,
  enabled,
  devices,
  tableCount,
  thisDeviceVenueOther,
}: {
  slug: string;
  enabled: boolean;
  devices: DeviceRow[];
  tableCount: number;
  thisDeviceVenueOther: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<Extract<PairingResult, { ok: true }> | null>(null);
  const [copied, setCopied] = useState(false);
  const thisDevice = devices.find((d) => d.current);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, then?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Fehler.");
      else then?.();
    });
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Gäste können rufen</p>
            <p className="mt-0.5 text-sm text-stone-600">
              Am Tisch erscheint ein Knopf: Bestellen, Zahlen oder Frage. Ihr Team sieht den Ruf sofort auf dem Service-Bildschirm.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Gäste können rufen"
            disabled={pending}
            onClick={() => run(() => setServiceEnabled(slug, !enabled))}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-stone-300"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        {enabled && devices.length === 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            Noch kein Gerät verbunden — Rufe der Gäste würde gerade niemand sehen.
          </p>
        )}
        {tableCount === 0 && (
          <p className="mt-3 text-sm text-stone-600">
            Der Knopf erscheint nur bei Gästen, die den QR-Code eines Tisches gescannt haben.{" "}
            <Link href={`/app/${slug}/tische`} className="font-medium text-stone-900 underline">Tische anlegen</Link>
          </p>
        )}
      </section>

      <section className={card}>
        <p className="font-semibold">Geräte des Teams</p>
        <p className="mt-0.5 text-sm text-stone-600">
          Handys der Kellner oder ein Tablet an der Bar. Ohne Passwort: QR-Code scannen, Namen eingeben, fertig.
        </p>

        {devices.length > 0 && (
          <ul className="mt-4 divide-y divide-stone-100">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {d.name}
                    {d.current && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">dieses Gerät</span>}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {lastSeen(d.last_seen_at)} · {d.push ? "Benachrichtigungen an" : "keine Benachrichtigungen"}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`„${d.name}“ trennen? Das Gerät sieht danach keine Rufe mehr.`)) run(() => revokeDevice(slug, d.id));
                  }}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Trennen
                </button>
              </li>
            ))}
          </ul>
        )}

        {pairing ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-4 text-center ring-1 ring-stone-200">
            <div className="mx-auto w-56 rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: pairing.svg }} />
            <p className="mt-3 text-sm font-medium">Mit der Kamera des Handys scannen</p>
            <p className="text-xs text-stone-500">
              Gültig bis {new Date(pairing.expiresAt).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })} Uhr, nur einmal.
            </p>
            <button
              type="button"
              onClick={async () => {
                try { await navigator.clipboard.writeText(pairing.url); setCopied(true); } catch { /* ignore */ }
              }}
              className="mt-3 text-sm font-medium text-stone-700 underline"
            >
              {copied ? "Link kopiert" : "Link kopieren (z. B. per WhatsApp senden)"}
            </button>
            <button
              type="button"
              onClick={() => { setPairing(null); setCopied(false); router.refresh(); }}
              className="mt-3 block w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white"
            >
              Fertig
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(async () => {
                const res = await createPairing(slug);
                if (res.ok) setPairing(res);
                return res;
              })}
              className="flex-1 rounded-xl bg-stone-900 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Gerät verbinden
            </button>
            {thisDevice ? (
              <Link href="/service" className="flex-1 rounded-xl bg-white py-3 text-center text-sm font-medium ring-1 ring-stone-300">
                Service-Bildschirm öffnen
              </Link>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const name = prompt("Name für dieses Gerät:", "Bar-Tablet");
                  if (name !== null) run(() => pairThisDevice(slug, name), () => router.push("/service"));
                }}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-medium ring-1 ring-stone-300 disabled:opacity-50"
              >
                Dieses Gerät verwenden
              </button>
            )}
          </div>
        )}
        {thisDeviceVenueOther && (
          <p className="mt-3 text-xs text-stone-500">Dieser Browser ist gerade mit einem anderen Lokal verbunden.</p>
        )}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
