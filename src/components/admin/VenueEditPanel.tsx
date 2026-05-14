"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "@/lib/supabase/types";

type EditableVenue = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary"> & {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (venue) {
      setName(venue.name ?? "");
      setAbout(venue.about ?? "");
      setColorBg(venue.color_bg ?? "#1a1a1a");
      setColorPrimary(venue.color_primary ?? "#C69B3C");
      setPlan((venue.plan as Plan) ?? "trial");
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
      .update({ name, about, color_bg: colorBg, color_primary: colorPrimary, plan })
      .eq("id", venue.id);
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSaved({ ...venue, name, about, color_bg: colorBg, color_primary: colorPrimary, plan });
    }
  }

  const isOpen = venue !== null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-onyx/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-parchment z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-onyx/10">
          <div>
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Editing</span>
            <h2 className="font-display text-xl text-onyx mt-0.5">{venue?.name ?? ""}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-onyx/40 hover:text-onyx transition-colors p-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Live color preview */}
          <div className="h-16 w-full relative overflow-hidden border border-onyx/10" style={{ backgroundColor: colorBg }}>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: colorPrimary }} />
            <span className="absolute bottom-3 left-3 font-display text-sm text-parchment drop-shadow">{name || "Venue name"}</span>
          </div>

          {/* Background color */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
              Background color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorBg}
                onChange={e => setColorBg(e.target.value)}
                className="w-9 h-9 cursor-pointer border border-onyx/20 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={colorBg}
                onChange={e => setColorBg(e.target.value)}
                className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                placeholder="#1a1a1a"
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
              Accent color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimary}
                onChange={e => setColorPrimary(e.target.value)}
                className="w-9 h-9 cursor-pointer border border-onyx/20 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={colorPrimary}
                onChange={e => setColorPrimary(e.target.value)}
                className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                placeholder="#C69B3C"
              />
            </div>
          </div>

          {/* Plan selector */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
              Plan
            </label>
            <div className="flex gap-2">
              {PLANS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`flex-1 font-sans text-[11px] tracking-regal uppercase py-2 border transition-colors ${
                    plan === p
                      ? "border-gold bg-gold text-onyx"
                      : "border-onyx/15 text-onyx/60 hover:border-onyx/30"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
              Venue name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
              placeholder="Restaurant name"
            />
          </div>

          {/* About */}
          <div>
            <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
              About
            </label>
            <textarea
              value={about}
              onChange={e => setAbout(e.target.value)}
              rows={2}
              className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold resize-none"
              placeholder="Short description…"
            />
          </div>

          {error && (
            <p className="font-sans text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-onyx/10 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-onyx text-parchment font-sans text-[12px] tracking-regal uppercase py-3 hover:bg-onyx/85 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {venue && (
            <a
              href={`/${venue.slug}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center font-sans text-[11px] tracking-regal uppercase text-gold hover:text-gold/80 transition-colors"
            >
              Open menu ↗
            </a>
          )}
        </div>
      </div>
    </>
  );
}
