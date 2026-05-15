"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "@/lib/supabase/types";

type EditableVenue = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "logo_url" | "instagram_url" | "google_maps_url"> & {
  plan: string;
};

type Props = {
  venue: EditableVenue | null;
  onClose: () => void;
  onSaved: (updated: EditableVenue) => void;
};

const PLANS = ["trial", "starter", "pro"] as const;
type Plan = typeof PLANS[number];

export function VenueEditPanel({ venue, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [colorBg, setColorBg] = useState("#1a1a1a");
  const [colorPrimary, setColorPrimary] = useState("#C69B3C");
  const [plan, setPlan] = useState<Plan>("trial");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [googleMaps, setGoogleMaps] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (venue) {
      setName(venue.name ?? "");
      setAbout(venue.about ?? "");
      setColorBg(venue.color_bg ?? "#1a1a1a");
      setColorPrimary(venue.color_primary ?? "#C69B3C");
      setPlan((venue.plan as Plan) ?? "trial");
      setLogoUrl(venue.logo_url ?? "");
      setInstagram(venue.instagram_url ?? "");
      setGoogleMaps(venue.google_maps_url ?? "");
      setError(null);
    }
  }, [venue]);

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
        instagram_url: instagram || null,
        google_maps_url: googleMaps || null,
      })
      .eq("id", venue.id);
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved({ ...venue, name, about, color_bg: colorBg, color_primary: colorPrimary, logo_url: logoUrl || null, plan, instagram_url: instagram || null, google_maps_url: googleMaps || null });
    }
  }

  const isOpen = venue !== null;

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
            <span className="absolute bottom-3 left-3 font-display text-sm drop-shadow" style={{ color: colorBg && parseInt(colorBg.replace('#','').substring(0,2),16)*299+parseInt(colorBg.replace('#','').substring(2,4),16)*587+parseInt(colorBg.replace('#','').substring(4,6),16)*114 > 128000 ? '#0A0A0A' : '#F5F0EC' }}>{name || "Venue name"}</span>
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

          {/* Logo URL */}
          <div className="border-t border-onyx/10 pt-6">
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-1">Logo URL</label>
            <p className="font-sans text-[10px] text-onyx/30 mb-2">
              SVG aus Supabase Storage einfügen. Leer lassen = Restaurantname wird angezeigt.
            </p>
            <input
              type="url"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
              placeholder="https://…/logos/restaurant.svg"
            />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2 p-2 border border-onyx/10 bg-onyx/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo preview" className="h-8 w-auto max-w-[120px] object-contain" />
                <span className="font-sans text-[10px] text-onyx/40">Vorschau</span>
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
