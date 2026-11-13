"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { resizeToWebP } from "@/lib/image-resize";
import { LOCALE_NAMES, type MenuLocale } from "@/lib/locales";
import { ABOUT_MAX, GALLERY_MAX, PRICE_RANGES, WEEKDAYS, type Hours, type Weekday } from "@/lib/venue-profile";
import { saveAbout, saveContact, saveHours, saveLinks, type LokalResult } from "./actions";

const card = "rounded-2xl bg-white p-5 ring-1 ring-onyx/10";
const input = "mt-1 w-full rounded-xl border border-onyx/20 bg-white px-3 py-2.5 text-base outline-none focus:border-onyx";
const labelCls = "text-base font-medium";
// PhotoUploader comes from the old admin and reads these colours.
const uploaderVars = "[--accent:#1c1917] [--color-border:#d6d3d1] [--color-dim:#57534e] [--color-muted:#78716c] [--color-text:#1c1917]";

/** Save bar shared by every part: one button, a short "saved" note, errors next to it. */
function useSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  function run(fn: () => Promise<LokalResult>) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? { ok: true, text: "Gespeichert — Gäste sehen es sofort." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  }
  const bar = (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className="rounded-xl bg-onyx px-6 py-3 font-medium text-white disabled:opacity-50">
        {pending ? "Wird gespeichert…" : "Speichern"}
      </button>
      {msg && <span className={`text-base ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</span>}
    </div>
  );
  return { run, bar };
}

// ── Auftritt: cover, photos of the place, a short text ─────────────────────

export function AppearanceForm({
  slug,
  venueId,
  cover,
  gallery: initialGallery,
  about: initialAbout,
  locales,
  translations,
}: {
  slug: string;
  venueId: string;
  cover: string | null;
  gallery: string[];
  about: string;
  locales: MenuLocale[];
  translations: Record<string, string>;
}) {
  const [coverUrl, setCoverUrl] = useState(cover);
  const [gallery, setGallery] = useState(initialGallery);
  const [about, setAbout] = useState(initialAbout);
  const [tr, setTr] = useState(translations);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, bar } = useSave();

  async function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPhotoError(null);
    try {
      const form = new FormData();
      form.append("target", "carta-venue-gallery");
      form.append("id", venueId);
      form.append("file", await resizeToWebP(file), "photo");
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Fehler ${res.status}`);
      setGallery((g) => [...g, j.url]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(url: string) {
    if (!confirm("Foto entfernen?")) return;
    const res = await fetch(`/api/admin/upload-photo?target=carta-venue-gallery-item&id=${venueId}&photoUrl=${encodeURIComponent(url)}`, { method: "DELETE" });
    if (res.ok) setGallery((g) => g.filter((u) => u !== url));
    else setPhotoError("Das Foto konnte nicht entfernt werden.");
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <p className={labelCls}>Titelbild</p>
        <p className="mt-0.5 text-base text-onyx/70">Das große Bild oben auf Ihrer Info-Seite. Am besten quer, z. B. der Gastraum oder die Terrasse.</p>
        <div className={`mt-3 ${uploaderVars}`}>
          <PhotoUploader target="carta-venue-cover" id={venueId} currentUrl={coverUrl} onChange={setCoverUrl} aspect="wide" label="+ Titelbild hochladen" />
        </div>
      </section>

      <section className={card}>
        <div className="flex items-baseline justify-between">
          <p className={labelCls}>Fotos vom Lokal</p>
          <span className="text-base tabular-nums text-onyx/60">{gallery.length} / {GALLERY_MAX}</span>
        </div>
        <p className="mt-0.5 text-base text-onyx/70">Innen, außen, Bar, Team — so wissen Gäste, was sie erwartet.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {gallery.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-onyx/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                aria-label="Foto entfernen"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-base text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {gallery.length < GALLERY_MAX && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-onyx/20 text-base text-onyx/70 disabled:opacity-50"
            >
              <span className="text-2xl leading-none">+</span>
              {uploading ? "Lädt…" : "Foto"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={addPhoto} className="hidden" />
        {photoError && <p className="mt-2 text-base text-red-700">{photoError}</p>}
      </section>

      <form onSubmit={(e) => { e.preventDefault(); run(() => saveAbout(slug, { about, translations: tr })); }} className={card}>
        <label className="block">
          <span className={labelCls}>Über Ihr Lokal</span>
          <span className="mt-0.5 block text-base text-onyx/70">Zwei, drei Sätze — erscheint unter Ihrem Namen oben in der Karte.</span>
          <textarea rows={4} maxLength={ABOUT_MAX} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Seit 1987 kochen wir hausgemachte Pasta mit Zutaten aus Italien…" className={input} />
        </label>
        <p className="mt-1 text-right text-sm tabular-nums text-onyx/60">{about.length} / {ABOUT_MAX}</p>
        {locales.length > 0 && (
          <details className="mt-2 rounded-xl ring-1 ring-onyx/10">
            <summary className="cursor-pointer px-3 py-2.5 text-base font-medium">
              Übersetzungen <span className="font-normal text-onyx/60">· {locales.filter((l) => tr[l]?.trim()).length} von {locales.length}</span>
            </summary>
            <div className="space-y-3 px-3 pb-3">
              {locales.map((l) => (
                <label key={l} className="block">
                  <span className="text-sm font-medium uppercase tracking-widest text-onyx/60">{LOCALE_NAMES[l]}</span>
                  <textarea rows={3} maxLength={ABOUT_MAX} value={tr[l] ?? ""} placeholder={about} onChange={(e) => setTr((t) => ({ ...t, [l]: e.target.value }))} className={input} />
                </label>
              ))}
            </div>
          </details>
        )}
        {bar}
      </form>
    </div>
  );
}

// ── Kontakt ─────────────────────────────────────────────────────────────────

export function ContactForm({ slug, phone: p0, address: a0, mapsUrl: m0, priceRange: r0 }: { slug: string; phone: string; address: string; mapsUrl: string; priceRange: string }) {
  const [phone, setPhone] = useState(p0);
  const [address, setAddress] = useState(a0);
  const [maps, setMaps] = useState(m0);
  const [price, setPrice] = useState(r0);
  const { run, bar } = useSave();
  const mapsFromAddress = address.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}` : "";

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => saveContact(slug, { phone, address, mapsUrl: maps, priceRange: price })); }} className={card}>
      <label className="block">
        <span className={labelCls}>Telefon</span>
        <span className="mt-0.5 block text-base text-onyx/70">Gäste rufen mit einem Tipp an, z. B. für Reservierungen.</span>
        <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+43 1 234 5678" className={input} />
      </label>
      <label className="mt-4 block">
        <span className={labelCls}>Adresse</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rennweg 12, 1030 Wien" maxLength={200} className={input} />
      </label>
      <label className="mt-4 block">
        <span className={labelCls}>Link zur Karte <span className="font-normal text-onyx/60">(optional)</span></span>
        <span className="mt-0.5 block text-base text-onyx/70">Ihr Eintrag in Google Maps. Leer lassen: der Knopf „Karte“ sucht Ihre Adresse.</span>
        <input type="url" inputMode="url" value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="https://maps.app.goo.gl/…" className={input} />
      </label>
      {address.trim() && (
        <a href={maps || mapsFromAddress} target="_blank" rel="noreferrer" className="mt-2 inline-block text-base font-medium underline">
          So finden Gäste Sie — in Google Maps prüfen ↗
        </a>
      )}
      <div className="mt-4">
        <span className={labelCls}>Preisklasse</span>
        <div className="mt-2 flex gap-2">
          {PRICE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={price === r}
              onClick={() => setPrice(price === r ? "" : r)}
              className={`min-w-14 rounded-full px-4 py-2 text-base ring-1 ${price === r ? "bg-onyx text-white ring-onyx" : "bg-white text-onyx/80 ring-onyx/20"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {bar}
    </form>
  );
}

// ── Öffnungszeiten ──────────────────────────────────────────────────────────

const DAY_LABEL: Record<Weekday, string> = { mon: "Montag", tue: "Dienstag", wed: "Mittwoch", thu: "Donnerstag", fri: "Freitag", sat: "Samstag", sun: "Sonntag" };
type Slot = { from: string; to: string };

export function HoursForm({ slug, hours }: { slug: string; hours: Hours | null }) {
  const [days, setDays] = useState<Record<Weekday, Slot[]>>(() =>
    Object.fromEntries(WEEKDAYS.map((d) => [d, (hours?.[d] ?? []).map(([from, to]) => ({ from, to }))])) as Record<Weekday, Slot[]>,
  );
  const { run, bar } = useSave();
  const set = (d: Weekday, slots: Slot[]) => setDays((x) => ({ ...x, [d]: slots }));

  function copyToAll(from: Weekday) {
    setDays((x) => Object.fromEntries(WEEKDAYS.map((d) => [d, x[from].map((s) => ({ ...s }))])) as Record<Weekday, Slot[]>);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveHours(slug, Object.fromEntries(WEEKDAYS.map((d) => [d, days[d].map((s) => [s.from, s.to])]))));
      }}
      className={card}
    >
      <p className="text-base text-onyx/70">Geschlossen = Ruhetag. Mittags Pause? Eine zweite Zeit hinzufügen. Nach Mitternacht geht auch, z. B. 18:00–02:00.</p>
      <ul className="mt-3 divide-y divide-onyx/10">
        {WEEKDAYS.map((d) => {
          const slots = days[d];
          const open = slots.length > 0;
          return (
            <li key={d} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{DAY_LABEL[d]}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={open}
                  aria-label={`${DAY_LABEL[d]} geöffnet`}
                  onClick={() => set(d, open ? [] : [{ from: "11:00", to: "22:00" }])}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${open ? "bg-emerald-600" : "bg-onyx/25"}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${open ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              {!open && <p className="mt-1 text-base text-onyx/60">Geschlossen</p>}
              {slots.map((s, i) => (
                <div key={i} className="mt-2 flex items-center gap-2">
                  <input type="time" aria-label={`${DAY_LABEL[d]} von`} value={s.from} onChange={(e) => set(d, slots.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} className="w-28 rounded-xl border border-onyx/20 px-2 py-2 text-base" />
                  <span className="text-onyx/60">–</span>
                  <input type="time" aria-label={`${DAY_LABEL[d]} bis`} value={s.to} onChange={(e) => set(d, slots.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} className="w-28 rounded-xl border border-onyx/20 px-2 py-2 text-base" />
                  {i === 1 && (
                    <button type="button" aria-label="Zweite Zeit entfernen" onClick={() => set(d, slots.slice(0, 1))} className="h-10 w-8 text-onyx/40">✕</button>
                  )}
                </div>
              ))}
              {open && (
                <div className="mt-2 flex gap-4 text-base">
                  {slots.length < 2 && (
                    <button type="button" onClick={() => set(d, [...slots, { from: "17:30", to: "22:00" }])} className="font-medium text-onyx/80">+ Zweite Zeit</button>
                  )}
                  {d === "mon" && <button type="button" onClick={() => copyToAll("mon")} className="font-medium text-onyx/80">Für alle Tage übernehmen</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {bar}
    </form>
  );
}

// ── Links ───────────────────────────────────────────────────────────────────

export function LinksForm({
  slug,
  website: w0,
  instagram: i0,
  facebook: f0,
  googleReview: g0,
  tripadvisor: t0,
}: {
  slug: string;
  website: string;
  instagram: string;
  facebook: string;
  googleReview: string;
  tripadvisor: string;
}) {
  const [v, setV] = useState({ website: w0, instagram: i0, facebook: f0, googleReview: g0, tripadvisor: t0 });
  const { run, bar } = useSave();
  const field = (key: keyof typeof v, label: string, placeholder: string, hint?: string) => (
    <label className="mt-4 block first:mt-0">
      <span className={labelCls}>{label}</span>
      {hint && <span className="mt-0.5 block text-base text-onyx/70">{hint}</span>}
      <input value={v[key]} onChange={(e) => setV((x) => ({ ...x, [key]: e.target.value }))} placeholder={placeholder} inputMode="url" autoCapitalize="off" autoCorrect="off" className={input} />
    </label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => saveLinks(slug, v)); }} className={card}>
      {field("website", "Website", "www.ihr-lokal.at")}
      {field("instagram", "Instagram", "@ihrlokal", "Name genügt, z. B. @trattoria.wien")}
      {field("facebook", "Facebook", "facebook.com/ihrlokal")}
      {field("googleReview", "Google-Bewertungen", "https://g.page/r/…/review", "Gäste bewerten Sie mit einem Tipp. Den Link finden Sie in Ihrem Google-Unternehmensprofil unter „Rezensionen erhalten“.")}
      {field("tripadvisor", "Tripadvisor", "tripadvisor.at/…")}
      {bar}
    </form>
  );
}

// ── Teilen ──────────────────────────────────────────────────────────────────

export function SharePanel({ url, name, qrSvg }: { url: string; name: string; qrSvg: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Unsere Speisekarte: ${url}`;

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: name, text: `Speisekarte von ${name}`, url }); } catch { /* cancelled */ } }
    else copy();
  }
  function downloadQr() {
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <p className={labelCls}>Ihr Link</p>
        <p className="mt-0.5 text-base text-onyx/70">Für Instagram-Bio, Google-Profil, Website, WhatsApp. Er bleibt immer gleich, auch wenn Sie die Karte ändern.</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-onyx/[0.03] px-3 py-3 ring-1 ring-onyx/10">
          <span className="min-w-0 flex-1 truncate font-medium">{url.replace(/^https?:\/\//, "")}</span>
          <button type="button" onClick={copy} className="shrink-0 rounded-lg px-3 py-1.5 text-base font-medium ring-1 ring-onyx/20">{copied ? "Kopiert ✓" : "Kopieren"}</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={share} className="rounded-xl bg-onyx py-3 font-medium text-white">Teilen…</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="rounded-xl py-3 text-center font-medium ring-1 ring-onyx/20">WhatsApp</a>
        </div>
      </section>

      <section className={card}>
        <p className={labelCls}>QR-Code für Flyer, Fenster, Visitenkarte</p>
        <p className="mt-0.5 text-base text-onyx/70">Führt zu Ihrer Karte, ohne Tisch. Für jeden Tisch gibt es eigene Codes unter „Tische“.</p>
        <div className="mx-auto mt-4 w-44 rounded-xl bg-white p-2 ring-1 ring-onyx/10" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <button type="button" onClick={downloadQr} className="mt-4 w-full rounded-xl py-3 font-medium ring-1 ring-onyx/20">QR-Code herunterladen</button>
      </section>

      <section className={card}>
        <p className={labelCls}>So sehen Gäste Ihr Lokal</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="rounded-xl py-3 text-center font-medium ring-1 ring-onyx/20">Speisekarte ↗</a>
          <a href={`${url}/profile`} target="_blank" rel="noreferrer" className="rounded-xl py-3 text-center font-medium ring-1 ring-onyx/20">Info-Seite ↗</a>
        </div>
      </section>
    </div>
  );
}
