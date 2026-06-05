"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { normalizeLogoSvg } from "@/lib/svg-normalize";
import { resizeToWebP } from "@/lib/image-resize";
import type { Venue } from "@/lib/supabase/types";

type MenuTheme = "classic" | "visual" | "modern";

type EditableVenue = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "logo_url" | "instagram_url" | "google_maps_url"> & {
  plan: string;
  logo_svg?: string | null;
  menu_theme?: MenuTheme;
};

type Props = {
  venue: EditableVenue | null;
  onClose: () => void;
  onSaved: (updated: EditableVenue) => void;
};

const PLANS = ["trial", "starter", "pro"] as const;
type Plan = typeof PLANS[number];

function getLuminance(hex: string): number {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function VenueEditPanel({ venue, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [colorBg, setColorBg] = useState("#1a1a1a");
  const [colorPrimary, setColorPrimary] = useState("#C69B3C");
  const [plan, setPlan] = useState<Plan>("trial");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSvg, setLogoSvg] = useState<string | null>(null);   // ← NEW: track SVG state
  const [instagram, setInstagram] = useState("");
  const [googleMaps, setGoogleMaps] = useState("");
  const [menuTheme, setMenuTheme] = useState<MenuTheme>("classic");
  // Staged logo upload: file is shown in preview BEFORE being sent to the server.
  // pendingFile = selected but not yet uploaded.
  // pendingLogoSvg = client-normalized SVG text (for preview swatches).
  // pendingLogoUrl = objectURL for raster preview.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingLogoSvg, setPendingLogoSvg] = useState<string | null>(null);
  const [pendingLogoUrl, setPendingLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerCurrent, setOwnerCurrent] = useState<string | null>(null);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  const loadOwner = useCallback(async (venueId: string) => {
    setOwnerCurrent(null);
    setOwnerEmail("");
    setOwnerError(null);
    setOwnerSuccess(false);
    const res = await fetch(`/api/admin/assign-owner?venueId=${venueId}`);
    if (res.ok) {
      const data = await res.json() as { ownerEmail: string | null };
      setOwnerCurrent(data.ownerEmail);
      setOwnerEmail(data.ownerEmail ?? "");
    }
  }, []);

  // FIX Bug 2: refresh logo from DB after upload instead of reloading the page
  const refreshLogo = useCallback(async (venueId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("venues")
      .select("logo_svg, logo_url")
      .eq("id", venueId)
      .maybeSingle<{ logo_svg: string | null; logo_url: string | null }>();
    if (data) {
      setLogoSvg(data.logo_svg ?? null);
      setLogoUrl(data.logo_url ?? null);
    }
  }, []);

  useEffect(() => {
    if (venue) {
      setName(venue.name ?? "");
      setAbout(venue.about ?? "");
      setColorBg(venue.color_bg ?? "#1a1a1a");
      setColorPrimary(venue.color_primary ?? "#C69B3C");
      setPlan((venue.plan as Plan) ?? "trial");
      setMenuTheme((venue.menu_theme as MenuTheme) ?? "classic");
      setLogoUrl(venue.logo_url ?? null);
      setLogoSvg(venue.logo_svg ?? null);
      setInstagram(venue.instagram_url ?? "");
      setGoogleMaps(venue.google_maps_url ?? "");
      setError(null);
      // Clear any pending preview when switching venues
      clearPending();
      void loadOwner(venue.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, loadOwner]);

  async function handleAssignOwner() {
    if (!venue) return;
    setOwnerSaving(true);
    setOwnerError(null);
    setOwnerSuccess(false);
    const res = await fetch("/api/admin/assign-owner", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId: venue.id, ownerEmail: ownerEmail.trim() || null }),
    });
    const json = await res.json() as { ok?: boolean; ownerEmail?: string | null; error?: string };
    setOwnerSaving(false);
    if (!res.ok) {
      setOwnerError(json.error ?? "Fehler");
    } else {
      setOwnerCurrent(json.ownerEmail ?? null);
      setOwnerSuccess(true);
      setTimeout(() => setOwnerSuccess(false), 3000);
    }
  }

  // ── Staged logo upload ─────────────────────────────────────────
  function clearPending() {
    if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl);
    setPendingFile(null);
    setPendingLogoSvg(null);
    setPendingLogoUrl(null);
  }

  async function handleLogoFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be picked again later
    if (logoInputRef.current) logoInputRef.current.value = "";
    setError(null);

    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    if (isSvg) {
      try {
        const text = await file.text();
        const normalized = normalizeLogoSvg(text); // client-side normalize for accurate preview
        clearPending();
        setPendingLogoSvg(normalized);
        setPendingLogoUrl(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ungültige SVG-Datei");
        return;
      }
    } else {
      clearPending();
      setPendingLogoUrl(URL.createObjectURL(file));
      setPendingLogoSvg(null);
    }
    setPendingFile(file);
  }

  async function handleLogoUploadConfirm() {
    if (!pendingFile || !venue) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const isSvg = pendingFile.type === "image/svg+xml" || /\.svg$/i.test(pendingFile.name);
      const form = new FormData();
      form.append("target", "carta-venue-logo");
      form.append("id", venue.id);
      if (isSvg) {
        form.append("file", pendingFile, pendingFile.name || "logo.svg");
      } else {
        const webp = await resizeToWebP(pendingFile);
        form.append("file", webp, "photo.webp");
      }
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      await refreshLogo(venue.id);
      clearPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingLogo(false);
    }
  }

  // FIX Bug 3: delete logo (works for both SVG and PNG)
  async function handleDeleteLogo() {
    if (!venue) return;
    if (!confirm("Logo entfernen?")) return;
    setDeletingLogo(true);
    const res = await fetch(
      `/api/admin/upload-photo?target=carta-venue-logo&id=${venue.id}`,
      { method: "DELETE" },
    );
    setDeletingLogo(false);
    if (res.ok) {
      setLogoSvg(null);
      setLogoUrl(null);
    }
  }

  async function handleSave() {
    if (!venue) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("venues")
      .update({
        name,
        about: about || null,
        color_bg: colorBg,
        color_primary: colorPrimary,
        logo_url: logoUrl || null,
        plan,
        menu_theme: menuTheme,
        instagram_url: instagram || null,
        google_maps_url: googleMaps || null,
      })
      .eq("id", venue.id);
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved({
        ...venue,
        name, about,
        color_bg: colorBg, color_primary: colorPrimary,
        logo_url: logoUrl || null,
        plan,
        menu_theme: menuTheme,
        instagram_url: instagram || null,
        google_maps_url: googleMaps || null,
      });
    }
  }

  const isOpen = venue !== null;
  const hasLogo = !!(logoSvg || logoUrl);           // saved logo in DB
  const isPending = !!pendingFile;                  // staged (not yet uploaded)
  // What to show in swatches: pending preview if present, otherwise saved logo
  const displaySvg = isPending ? pendingLogoSvg : logoSvg;
  const displayUrl = isPending ? pendingLogoUrl : logoUrl;
  const hasDisplayLogo = !!(displaySvg || displayUrl);

  return (
    <>
      <div
        className={`fixed inset-0 bg-onyx/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-parchment z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-onyx/10">
          <div>
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Editing</span>
            <h2 className="font-display text-xl text-onyx mt-0.5">{venue?.name ?? ""}</h2>
          </div>
          <button onClick={onClose} className="text-onyx/40 hover:text-onyx transition-colors p-1" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Live preview */}
          <div className="h-16 w-full relative overflow-hidden border border-onyx/10" style={{ backgroundColor: colorBg }}>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: colorPrimary }} />
            <span className="absolute bottom-3 left-3 font-display text-sm drop-shadow" style={{ color: getLuminance(colorBg) > 0.4 ? '#0A0A0A' : '#F5F0EC' }}>{name || "Venue name"}</span>
          </div>

          {/* Background color */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Background color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={colorBg} onChange={e => setColorBg(e.target.value)} className="w-9 h-9 cursor-pointer border border-onyx/20 bg-transparent p-0.5" />
              <input type="text" value={colorBg} onChange={e => setColorBg(e.target.value)} className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold" placeholder="#1a1a1a" />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Accent color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className="w-9 h-9 cursor-pointer border border-onyx/20 bg-transparent p-0.5" />
              <input type="text" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold" placeholder="#C69B3C" />
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Plan</label>
            <div className="flex gap-2">
              {PLANS.map(p => (
                <button key={p} onClick={() => setPlan(p)}
                  className={`flex-1 font-sans text-[11px] tracking-regal uppercase py-2 border transition-colors ${plan === p ? "border-gold bg-gold text-onyx" : "border-onyx/15 text-onyx/60 hover:border-onyx/30"}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Theme */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Menu Theme</label>
            <div className="flex gap-2">
              {([
                { value: "classic", label: "Classic", hint: "Elegant list" },
                { value: "visual",  label: "Visual",  hint: "Photo grid" },
                { value: "modern",  label: "Modern",  hint: "Editorial" },
              ] as { value: MenuTheme; label: string; hint: string }[]).map(t => (
                <button key={t.value} type="button" onClick={() => setMenuTheme(t.value)}
                  className={`flex-1 font-sans text-[11px] tracking-regal uppercase py-2 border transition-colors flex flex-col items-center gap-0.5 ${menuTheme === t.value ? "border-gold bg-gold text-onyx" : "border-onyx/15 text-onyx/60 hover:border-onyx/30"}`}>
                  {t.label}
                  <span className={`text-[9px] normal-case tracking-normal ${menuTheme === t.value ? "text-onyx/60" : "text-onyx/30"}`}>{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Venue name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold" />
          </div>

          {/* About */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">About</label>
            <textarea value={about} onChange={e => setAbout(e.target.value)} rows={2}
              className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold resize-none" />
          </div>

          {/* ── Logo section ────────────────────────────────────── */}
          <div className="border-t border-onyx/10 pt-6">
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-3">Logo</label>

            {/* Swatches — show pending preview or saved logo */}
            {hasDisplayLogo && (
              <div className="mb-3">
                {isPending && (
                  <p className="font-sans text-[9px] tracking-regal uppercase text-gold mb-2">
                    Vorschau — noch nicht gespeichert
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <LogoSwatch bg={colorBg}    accent={colorPrimary} svg={displaySvg} url={displayUrl} name={name} mode="auto"   label="auto"   />
                  <LogoSwatch bg="#F5F0EC"    accent={colorPrimary} svg={displaySvg} url={displayUrl} name={name} mode="auto"   label="hell"   />
                  <LogoSwatch bg="#0A0A0A"    accent={colorPrimary} svg={displaySvg} url={displayUrl} name={name} mode="auto"   label="dunkel" />
                  <LogoSwatch bg={colorBg}    accent={colorPrimary} svg={displaySvg} url={displayUrl} name={name} mode="accent" label="accent" />
                </div>
              </div>
            )}

            <p className="font-sans text-[10px] text-onyx/40 mb-3 leading-snug">
              SVG empfohlen — passt sich automatisch der Farbe an. PNG mit
              transparentem Hintergrund auch ok.
            </p>

            {/* Hidden file input — shared by both "add" and "replace" triggers */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoFilePicked}
              className="hidden"
            />

            {isPending ? (
              /* ── Pending: confirm or cancel ── */
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleLogoUploadConfirm}
                  disabled={uploadingLogo}
                  className="font-sans text-[10px] tracking-regal uppercase bg-onyx text-parchment px-4 py-2.5 hover:bg-onyx/85 transition disabled:opacity-50"
                >
                  {uploadingLogo ? "Wird gespeichert…" : "Logo speichern"}
                </button>
                <button
                  type="button"
                  onClick={clearPending}
                  disabled={uploadingLogo}
                  className="font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-onyx/20 px-4 py-2.5 hover:border-onyx hover:text-onyx transition disabled:opacity-50"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              /* ── Normal: upload button + delete ── */
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-dashed border-onyx/30 px-4 py-3 hover:border-onyx hover:text-onyx transition"
                >
                  {hasLogo ? "+ Logo ersetzen" : "+ Logo hinzufügen"}
                </button>
                {hasLogo && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    disabled={deletingLogo}
                    className="font-sans text-[10px] tracking-regal uppercase text-red-700/70 border border-red-700/30 px-3 py-2 hover:bg-red-700 hover:text-white transition disabled:opacity-50"
                  >
                    {deletingLogo ? "…" : "Entfernen"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Social links */}
          <div className="border-t border-onyx/10 pt-6 space-y-4">
            <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">Social & Location</p>

            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
                <svg className="inline mr-1.5 mb-0.5" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram URL
              </label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
                className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                placeholder="https://instagram.com/restaurant" />
            </div>

            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
                <svg className="inline mr-1.5 mb-0.5" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Google Maps URL
              </label>
              <input type="url" value={googleMaps} onChange={e => setGoogleMaps(e.target.value)}
                className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                placeholder="https://maps.google.com/..." />
            </div>
          </div>

          {/* Owner assignment */}
          <div className="border-t border-onyx/10 pt-6 space-y-3">
            <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">Venue Owner</p>
            {ownerCurrent && (
              <p className="font-sans text-xs text-onyx/60">
                Current: <span className="text-onyx font-medium">{ownerCurrent}</span>
              </p>
            )}
            {!ownerCurrent && (
              <p className="font-sans text-xs text-onyx/40 italic">No owner assigned yet</p>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="client@email.com"
                className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={handleAssignOwner}
                disabled={ownerSaving}
                className="bg-onyx text-parchment font-sans text-[11px] tracking-regal uppercase px-4 py-2 hover:bg-onyx/85 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {ownerSaving ? "…" : ownerEmail.trim() ? "Assign" : "Clear"}
              </button>
            </div>
            {ownerError && <p className="font-sans text-xs text-red-600">{ownerError}</p>}
            {ownerSuccess && <p className="font-sans text-xs text-green-700">Owner updated ✓</p>}
          </div>

          {error && <p className="font-sans text-xs text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-onyx/10 space-y-3">
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-onyx text-parchment font-sans text-[12px] tracking-regal uppercase py-3 hover:bg-onyx/85 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {venue && (
            <a href={`/${venue.slug}`} target="_blank" rel="noreferrer"
              className="block text-center font-sans text-[11px] tracking-regal uppercase text-gold hover:text-gold/80 transition-colors">
              Open menu ↗
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ── Logo swatch ────────────────────────────────────────────────────
// FIX Bug 1: isDarkBg is now calculated from the swatch's bg color
// so VenueLogo inverts SVG color correctly on each background.
function LogoSwatch({
  bg, accent, svg, url, name, mode, label,
}: {
  bg: string; accent: string; svg?: string | null; url?: string | null;
  name: string; mode: "auto" | "accent"; label: string;
}) {
  const isDarkBg = getLuminance(bg) < 0.4;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-20 h-20 flex items-center justify-center"
        style={{ backgroundColor: bg, border: "1px solid rgba(0,0,0,0.1)" }}
      >
        <VenueLogo
          svg={svg} url={url} name={name}
          bg={bg} accent={accent}
          color={mode} height={32}
          isDarkBg={isDarkBg}
        />
      </div>
      <span className="font-sans text-[9px] tracking-regal uppercase text-onyx/40">{label}</span>
    </div>
  );
}
