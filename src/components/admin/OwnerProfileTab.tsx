"use client";

import { useState, useRef, useEffect } from "react";
import { resizeToWebP } from "@/lib/image-resize";
import { PhotoUploader } from "@/components/admin/PhotoUploader";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DaySlot = { open: boolean; from: string; to: string };
type VenueEvent = { id: string; title: string; event_date: string; time_start: string | null; duration_hours: number | null };

const WEEKDAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mo" }, { key: "tue", label: "Di" }, { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" }, { key: "fri", label: "Fr" }, { key: "sat", label: "Sa" }, { key: "sun", label: "So" },
];

const PRICE_OPTIONS = ["€", "€€", "€€€", "€€€€"];

function parseHours(raw: Record<string, [string, string][]> | null | undefined): Record<DayKey, DaySlot> {
  const defaults: Record<DayKey, DaySlot> = {} as Record<DayKey, DaySlot>;
  for (const { key } of WEEKDAYS) {
    const slots = raw?.[key];
    defaults[key] = slots?.length ? { open: true, from: slots[0][0], to: slots[0][1] } : { open: false, from: "09:00", to: "22:00" };
  }
  return defaults;
}

type Props = {
  venueId: string;
  isDark: boolean;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
  initialPhone: string | null;
  initialAddress: string | null;
  initialWebsite: string | null;
  initialGoogleReview: string | null;
  initialTripadvisor: string | null;
  initialFacebook: string | null;
  initialPriceRange: string | null;
  initialOpeningHours: Record<string, [string, string][]> | null;
  initialGallery: string[] | null;
  initialCoverUrl: string | null;
};

export function OwnerProfileTab({
  venueId, isDark, text, dim, muted, border, accent,
  initialPhone, initialAddress, initialWebsite, initialGoogleReview,
  initialTripadvisor, initialFacebook, initialPriceRange, initialOpeningHours,
  initialGallery, initialCoverUrl,
}: Props) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [website, setWebsite] = useState(initialWebsite ?? "");
  const [googleReview, setGoogleReview] = useState(initialGoogleReview ?? "");
  const [tripadvisor, setTripadvisor] = useState(initialTripadvisor ?? "");
  const [facebook, setFacebook] = useState(initialFacebook ?? "");
  const [priceRange, setPriceRange] = useState(initialPriceRange ?? "");
  const [hours, setHours] = useState<Record<DayKey, DaySlot>>(() => parseHours(initialOpeningHours));
  const [gallery, setGallery] = useState<string[]>(initialGallery ?? []);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);

  // Events
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDuration, setNewEventDuration] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/venue-events?venueId=${venueId}`)
      .then((r) => r.json())
      .then((j) => { if (j.events) setEvents(j.events); })
      .catch(() => {});
  }, [venueId]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputBase: React.CSSProperties = {
    color: text, borderColor: border,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
  };

  function setDay(key: DayKey, patch: Partial<DaySlot>) {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setSaveError(null);
    try {
      const opening_hours: Record<string, [string, string][]> = {};
      for (const { key } of WEEKDAYS) {
        const d = hours[key];
        if (d.open) opening_hours[key] = [[d.from, d.to]];
      }
      const res = await fetch("/api/admin/venue-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueId, phone: phone || null, address: address || null, website_url: website || null,
          google_review_url: googleReview || null, tripadvisor_url: tripadvisor || null,
          facebook_url: facebook || null, price_range: priceRange || null,
          opening_hours: Object.keys(opening_hours).length ? opening_hours : null,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `HTTP ${res.status}`); }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally { setSaving(false); }
  }

  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const webp = await resizeToWebP(file);
      const form = new FormData();
      form.append("target", "carta-venue-gallery");
      form.append("id", venueId);
      form.append("file", webp, "photo.webp");
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `HTTP ${res.status}`); }
      const { url } = await res.json();
      setGallery((prev) => [...prev, url]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoRemove(photoUrl: string) {
    if (!confirm("Foto entfernen?")) return;
    try {
      const res = await fetch(`/api/admin/upload-photo?target=carta-venue-gallery-item&id=${venueId}&photoUrl=${encodeURIComponent(photoUrl)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Entfernen");
      setGallery((prev) => prev.filter((u) => u !== photoUrl));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Fehler"); }
  }

  async function handleEventAdd() {
    if (!newEventTitle.trim() || !newEventDate) return;
    setAddingEvent(true);
    try {
      const res = await fetch("/api/admin/venue-events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueId, title: newEventTitle.trim(), event_date: newEventDate,
          time_start: newEventTime || undefined,
          duration_hours: newEventDuration ? parseFloat(newEventDuration) : undefined,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `HTTP ${res.status}`); }
      const { event } = await res.json();
      setEvents((prev) => [...prev, event].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setNewEventTitle(""); setNewEventDate(""); setNewEventTime(""); setNewEventDuration("");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Fehler"); }
    finally { setAddingEvent(false); }
  }

  async function handleEventDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/venue-events?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler");
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Fehler"); }
  }

  return (
    <div className="space-y-10">

      {/* Titelbild */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Titelbild</SectionTitle>
        <div className="mt-4">
          <PhotoUploader target="carta-venue-cover" id={venueId} currentUrl={coverUrl} onChange={(url) => setCoverUrl(url ?? null)} aspect="wide" label="+ Titelbild hochladen" />
        </div>
      </section>

      {/* Kontakt */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Kontakt</SectionTitle>
        <div className="space-y-3 mt-4">
          <Field label="Telefon" style={inputBase}><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+43 1 234 5678" style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
          <Field label="Adresse" style={inputBase}><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Naschmarkt 1, 1040 Wien" style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
          <Field label="Website" style={inputBase}><input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
        </div>
      </section>

      {/* Preisklasse */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Preisklasse</SectionTitle>
        <div className="flex gap-2 mt-4 flex-wrap">
          {PRICE_OPTIONS.map((opt) => (
            <button key={opt} type="button" onClick={() => setPriceRange(priceRange === opt ? "" : opt)} className="font-sans text-sm px-4 py-2 border transition-colors"
              style={{ borderColor: priceRange === opt ? accent : border, backgroundColor: priceRange === opt ? accent : "transparent", color: priceRange === opt ? (isDark ? "#0A0A0A" : "#FFFFFF") : text }}>
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* Öffnungszeiten */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Öffnungszeiten</SectionTitle>
        <div className="mt-4 space-y-2">
          {WEEKDAYS.map(({ key, label }) => {
            const d = hours[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <button type="button" onClick={() => setDay(key, { open: !d.open })} className="w-10 font-sans text-[11px] tracking-regal uppercase py-1.5 border transition-colors shrink-0"
                  style={{ borderColor: d.open ? accent : border, backgroundColor: d.open ? accent : "transparent", color: d.open ? (isDark ? "#0A0A0A" : "#FFFFFF") : dim }}>
                  {label}
                </button>
                {d.open ? (
                  <>
                    <input type="time" value={d.from} onChange={(e) => setDay(key, { from: e.target.value })} className="border px-2 py-1.5 font-sans text-sm outline-none bg-transparent w-28" style={{ borderColor: border, color: text }} />
                    <span style={{ color: muted }} className="font-sans text-sm">–</span>
                    <input type="time" value={d.to} onChange={(e) => setDay(key, { to: e.target.value })} className="border px-2 py-1.5 font-sans text-sm outline-none bg-transparent w-28" style={{ borderColor: border, color: text }} />
                  </>
                ) : (
                  <span className="font-sans text-sm" style={{ color: muted }}>Geschlossen</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Galerie */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Galerie</SectionTitle>
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((url) => (
              <div key={url} className="relative aspect-square overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => handlePhotoRemove(url)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity font-sans text-[10px] tracking-regal uppercase text-white">Entfernen</button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="aspect-square border border-dashed flex items-center justify-center font-sans text-[11px] tracking-regal uppercase" style={{ borderColor: border, color: uploadingPhoto ? muted : dim }}>
              {uploadingPhoto ? "…" : "+ Foto"}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={handlePhotoAdd} className="hidden" />
        </div>
      </section>

      {/* Veranstaltungen */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Veranstaltungen</SectionTitle>
        <div className="mt-4 space-y-3">
          {events.length === 0 && <p className="font-sans text-sm" style={{ color: muted }}>Keine Veranstaltungen geplant</p>}
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start justify-between gap-3 border px-3 py-2.5" style={{ borderColor: border }}>
              <div>
                <p className="font-sans text-sm" style={{ color: text }}>{ev.title}</p>
                <p className="font-sans text-[11px] mt-0.5" style={{ color: muted }}>
                  {ev.event_date}{ev.time_start ? ` · ${ev.time_start.slice(0, 5)}` : ""}{ev.duration_hours != null ? ` · ${ev.duration_hours} Std.` : ""}
                </p>
              </div>
              <button type="button" onClick={() => handleEventDelete(ev.id)} className="shrink-0 font-sans text-[11px] py-1 px-2 border" style={{ borderColor: border, color: muted }}>✕</button>
            </div>
          ))}
          <div className="space-y-2 pt-2">
            <Field label="Titel" style={inputBase}><input type="text" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="z.B. Jazz-Abend" style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
            <Field label="Datum" style={inputBase}><input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Uhrzeit (optional)" style={inputBase}><input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
              <Field label="Dauer Std. (optional)" style={inputBase}><input type="number" min="0.5" step="0.5" value={newEventDuration} onChange={(e) => setNewEventDuration(e.target.value)} placeholder="2" style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
            </div>
            <button type="button" onClick={handleEventAdd} disabled={addingEvent || !newEventTitle.trim() || !newEventDate} className="font-sans text-[11px] tracking-regal uppercase px-4 py-3 min-h-[44px] transition-opacity disabled:opacity-40" style={{ backgroundColor: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}>
              {addingEvent ? "…" : "+ Hinzufügen"}
            </button>
          </div>
        </div>
      </section>

      {/* Bewertungen */}
      <section>
        <SectionTitle text={text} muted={muted} accent={accent}>Bewertungen</SectionTitle>
        <div className="space-y-3 mt-4">
          <Field label="Google" style={inputBase}><input type="url" value={googleReview} onChange={(e) => setGoogleReview(e.target.value)} placeholder="https://g.page/r/..." style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
          <Field label="TripAdvisor" style={inputBase}><input type="url" value={tripadvisor} onChange={(e) => setTripadvisor(e.target.value)} placeholder="https://www.tripadvisor.com/..." style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
          <Field label="Facebook" style={inputBase}><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." style={inputBase} className="w-full border px-3 py-2 font-sans text-sm outline-none bg-transparent" /></Field>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 pt-2 pb-16">
        <button type="button" onClick={handleSave} disabled={saving} className="font-sans text-[11px] tracking-regal uppercase px-6 py-3 transition-opacity disabled:opacity-50" style={{ backgroundColor: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}>
          {saving ? "Wird gespeichert…" : "Speichern"}
        </button>
        {saved && <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: accent }}>Gespeichert ✓</span>}
        {saveError && <span className="font-sans text-[11px] text-red-600">{saveError}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children, text, muted, accent }: { children: React.ReactNode; text: string; muted: string; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-[11px] tracking-regal uppercase font-semibold" style={{ color: accent }}>{children}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.2 }} />
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div>
      <label className="block font-sans text-[10px] tracking-regal uppercase mb-1" style={{ color: style.color as string, opacity: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}
