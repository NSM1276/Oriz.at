"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NewVenue = {
  id: string;
  slug: string;
  name: string;
  about: string | null;
  color_bg: string | null;
  color_primary: string | null;
  plan: string;
  itemCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (venue: NewVenue) => void;
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AddVenueModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [about, setAbout] = useState("");
  const [colorBg, setColorBg] = useState("#0A0A0A");
  const [colorPrimary, setColorPrimary] = useState("#C69B3C");
  const [currency, setCurrency] = useState("EUR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    setSlug(toSlug(val));
  }

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("venues")
      .insert({ name: name.trim(), slug: slug.trim(), about: about || null, color_bg: colorBg, color_primary: colorPrimary, currency, plan: "trial" })
      .select("id, slug, name, about, color_bg, color_primary, plan")
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data) {
      onCreated({ ...data, itemCount: 0 });
      setName(""); setSlug(""); setAbout(""); setColorBg("#0A0A0A"); setColorPrimary("#C69B3C");
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-onyx/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-parchment w-full max-w-md shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-onyx/10">
            <div>
              <span className="font-sans text-[10px] tracking-regal uppercase text-gold">New venue</span>
              <h2 className="font-display text-xl text-onyx mt-0.5">Add restaurant</h2>
            </div>
            <button onClick={onClose} className="text-onyx/40 hover:text-onyx transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Live preview */}
            <div className="h-14 w-full relative overflow-hidden border border-onyx/10" style={{ backgroundColor: colorBg }}>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: colorPrimary }} />
              <span className="absolute bottom-3 left-3 font-display text-sm text-parchment drop-shadow">{name || "Restaurant name"}</span>
            </div>

            {/* Name */}
            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Name</label>
              <input type="text" value={name} onChange={e => handleNameChange(e.target.value)}
                className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                placeholder="Zum Goldenen Hirschen" />
            </div>

            {/* Slug */}
            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">URL slug</label>
              <div className="flex items-center">
                <span className="font-sans text-xs text-onyx/40 bg-onyx/5 border border-r-0 border-onyx/15 px-3 py-2">oriz-at.vercel.app/</span>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
                  placeholder="zum-goldenen-hirschen" />
              </div>
            </div>

            {/* Colors */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={colorBg} onChange={e => setColorBg(e.target.value)}
                    className="w-9 h-9 cursor-pointer border border-onyx/20 p-0.5" />
                  <input type="text" value={colorBg} onChange={e => setColorBg(e.target.value)}
                    className="flex-1 font-sans text-xs bg-white border border-onyx/15 px-2 py-2 text-onyx focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Accent</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)}
                    className="w-9 h-9 cursor-pointer border border-onyx/20 p-0.5" />
                  <input type="text" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)}
                    className="flex-1 font-sans text-xs bg-white border border-onyx/15 px-2 py-2 text-onyx focus:outline-none focus:border-gold" />
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">About (optional)</label>
              <textarea value={about} onChange={e => setAbout(e.target.value)} rows={2}
                className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold resize-none"
                placeholder="Short description…" />
            </div>

            {/* Currency */}
            <div>
              <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold">
                <option value="EUR">EUR — Euro</option>
                <option value="CHF">CHF — Swiss Franc</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>

            {error && <p className="font-sans text-xs text-red-600">{error}</p>}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose}
              className="flex-1 font-sans text-[11px] tracking-regal uppercase text-onyx/50 border border-onyx/20 py-3 hover:border-onyx/40 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving || !name || !slug}
              className="flex-1 bg-onyx text-parchment font-sans text-[11px] tracking-regal uppercase py-3 hover:bg-onyx/85 transition-colors disabled:opacity-40">
              {saving ? "Creating…" : "Create venue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
