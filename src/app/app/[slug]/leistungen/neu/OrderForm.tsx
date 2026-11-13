"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_NAMES, PACKAGE_LOCALES } from "@/lib/locales";
import {
  MENU_SETUP_EXTRA_DISH_CENTS,
  MENU_SETUP_INCLUDED_DISHES,
  PHOTO_MIN,
  SERVICE_INFO,
  allowedTypes,
  checkFiles,
  euro,
  fileType,
  orderPrice,
  type ServiceKind,
} from "@/lib/services";
import { startOrder, submitOrder } from "../actions";

const card = "rounded-2xl bg-white p-5 ring-1 ring-onyx/10";
const input = "mt-1 w-full rounded-xl border border-onyx/20 bg-white px-3 py-2.5 text-base outline-none focus:border-onyx";

const sizeLabel = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function OrderForm({ slug, kind, email }: { slug: string; kind: ServiceKind; email: string }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dishes, setDishes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState(email);
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const meta = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
  const check = checkFiles(kind, meta, !!linkUrl.trim());
  const price = useMemo(() => orderPrice(kind, kind === "menu_setup" ? Number(dishes) : files.length), [kind, files.length, dishes]);
  const busy = progress !== null;
  const accept = allowedTypes(kind).join(",") + (kind === "photo_edit" ? ",.heic,.heif" : ",.heic,.heif,.doc,.docx,.xls,.xlsx");

  function addFiles(list: FileList | null) {
    if (!list) return;
    // Copy now: clearing the picker below empties this live FileList before React runs the updater.
    const picked = Array.from(list);
    setError(null);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...picked.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
    if (picker.current) picker.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!check.ok) { setError(check.error); return; }
    if (!price.ok) { setError(price.error); return; }
    setProgress({ done: 0, total: files.length });
    try {
      const started = await startOrder(slug, { kind, files: meta, linkUrl, languages, notes, dishes: Number(dishes), contactName, contactEmail, contactPhone });
      if (!started.ok) { setError(started.error); setProgress(null); return; }

      const storage = createClient().storage.from("service-uploads");
      for (let i = 0; i < started.uploads.length; i++) {
        const slot = started.uploads[i];
        const { error: upErr } = await storage.uploadToSignedUrl(slot.path, slot.token, files[i], { contentType: fileType(files[i].name, files[i].type) });
        if (upErr) { setError(`„${files[i].name}“ konnte nicht hochgeladen werden. Bitte erneut versuchen.`); setProgress(null); return; }
        setProgress({ done: i + 1, total: files.length });
      }

      const sent = await submitOrder(slug, started.orderId);
      if (!sent.ok) { setError(sent.error); setProgress(null); return; }
      router.push(`/app/${slug}/leistungen`);
      router.refresh();
    } catch {
      setError("Verbindung unterbrochen. Bitte erneut versuchen.");
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <Link href={`/app/${slug}/leistungen`} className="text-base font-medium text-onyx/70">‹ Leistungen</Link>
      </div>

      <section className={card}>
        <h1 className="text-lg font-semibold">{SERVICE_INFO[kind].title}</h1>
        <p className="mt-1 text-base text-onyx/70">{SERVICE_INFO[kind].short}</p>
      </section>

      <section className={card}>
        <p className="text-base font-medium">{kind === "photo_edit" ? `Fotos (mindestens ${PHOTO_MIN})` : "Ihre Speisekarte"}</p>
        <p className="mt-0.5 text-base text-onyx/70">
          {kind === "photo_edit"
            ? "Am besten von oben oder schräg, bei Tageslicht, ein Gericht pro Foto. JPG, PNG oder HEIC, bis 25 MB."
            : "Fotos der Seiten, PDF, Word oder Excel — bis 25 MB pro Datei. Oder einfach ein Link zu Ihrer Karte."}
        </p>
        <input ref={picker} type="file" multiple accept={accept} className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <button type="button" disabled={busy} onClick={() => picker.current?.click()} className="mt-3 w-full rounded-xl border-2 border-dashed border-onyx/20 py-6 text-base font-medium text-onyx/80 disabled:opacity-50">
          + Dateien auswählen
        </button>
        {files.length > 0 && (
          <ul className="mt-3 divide-y divide-onyx/10 text-base">
            {files.map((f, i) => (
              <li key={`${f.name}:${f.size}`} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{f.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-onyx/60">
                  {sizeLabel(f.size)}
                  <button type="button" disabled={busy} aria-label={`${f.name} entfernen`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="h-8 w-8 rounded-lg hover:bg-onyx/5">✕</button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {kind === "menu_setup" && (
          <label className="mt-4 block">
            <span className="text-base font-medium">Oder Link zu Ihrer Karte</span>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} inputMode="url" placeholder="https://…" className={input} />
          </label>
        )}
      </section>

      {kind === "menu_setup" && (
        <section className={card}>
          <label className="block">
            <span className="text-base font-medium">Wie viele Gerichte hat Ihre Karte ungefähr?</span>
            <input required value={dishes} onChange={(e) => setDishes(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="z. B. 60" className={input} />
          </label>
          <p className="mt-1.5 text-base text-onyx/70">
            Bis {MENU_SETUP_INCLUDED_DISHES} Gerichte sind im Preis enthalten, jedes weitere kostet {euro(MENU_SETUP_EXTRA_DISH_CENTS)}. Getränke zählen mit.
          </p>
        </section>
      )}

      {kind === "menu_setup" && (
        <section className={card}>
          <p className="text-base font-medium">Übersetzungen dazu?</p>
          <p className="mt-0.5 text-base text-onyx/70">Im Preis enthalten.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PACKAGE_LOCALES.map((l) => {
              const on = languages.includes(l);
              return (
                <button key={l} type="button" aria-pressed={on} onClick={() => setLanguages((ls) => (on ? ls.filter((x) => x !== l) : [...ls, l]))} className={`rounded-full px-3.5 py-2 text-base ring-1 ${on ? "bg-onyx text-white ring-onyx" : "bg-white text-onyx/80 ring-onyx/20"}`}>
                  {LOCALE_NAMES[l]}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className={card}>
        <label className="block">
          <span className="text-base font-medium">Wünsche <span className="font-normal text-onyx/60">(optional)</span></span>
          <textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={kind === "photo_edit" ? "z. B. heller Holztisch als Hintergrund" : "z. B. Mittagsmenü als eigener Bereich"} className={input} />
        </label>
      </section>

      <section className={card}>
        <p className="text-base font-medium">Kontakt für Rückfragen</p>
        <label className="mt-3 block">
          <span className="text-base text-onyx/70">Name</span>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" className={input} />
        </label>
        <label className="mt-3 block">
          <span className="text-base text-onyx/70">Telefon</span>
          <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+43 …" className={input} />
        </label>
        <label className="mt-3 block">
          <span className="text-base text-onyx/70">E-Mail</span>
          <input required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" autoComplete="email" className={input} />
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-onyx/10 bg-parchment/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          {error && <p className="mb-2 text-base text-red-700">{error}</p>}
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 text-base">
              {price.ok ? <><span className="font-semibold">{euro(price.priceCents)}</span>{kind === "photo_edit" && <span className="text-onyx/60"> · {price.quantity} Fotos</span>}</> : <span className="text-onyx/60">{price.error}</span>}
            </span>
            <button type="submit" disabled={busy || !check.ok || !price.ok} className="rounded-xl bg-onyx px-6 py-3 font-medium text-white disabled:opacity-40">
              {progress ? `Wird gesendet… ${progress.done}/${progress.total}` : "Auftrag senden"}
            </button>
          </div>
          <p className="mt-1 text-sm text-onyx/60">Bezahlt wird erst danach — per Karte oder nach Absprache.</p>
        </div>
      </div>
    </form>
  );
}
