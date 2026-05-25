"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { VenueLogo } from "@/components/brand/VenueLogo";

export type CasaPropertySummary = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  about: string | null;
  color_bg: string | null;
  color_primary: string | null;
  logo_url?: string | null;
  logo_svg?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  google_maps_url?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Props = {
  property: CasaPropertySummary | null;
  onClose: () => void;
  onSaved: (updated: CasaPropertySummary) => void;
};

export function CasaPropertyEditPanel({ property, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [about, setAbout] = useState("");
  const [colorBg, setColorBg] = useState("#0A0A0A");
  const [colorPrimary, setColorPrimary] = useState("#C69B3C");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [maps, setMaps] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setName(property.name ?? "");
      setSlug(property.slug ?? "");
      setCity(property.city ?? "");
      setAbout(property.about ?? "");
      setColorBg(property.color_bg ?? "#0A0A0A");
      setColorPrimary(property.color_primary ?? "#C69B3C");
      setWebsite(property.website_url ?? "");
      setInstagram(property.instagram_url ?? "");
      setFacebook(property.facebook_url ?? "");
      setMaps(property.google_maps_url ?? "");
      setPhone(property.phone ?? "");
      setEmail(property.email ?? "");
      setError(null);
    }
  }, [property]);

  async function handleSave() {
    if (!property) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .schema("casa")
      .from("properties")
      .update({
        name,
        slug: slug || property.slug,
        city: city || null,
        about: about || null,
        color_bg: colorBg,
        color_primary: colorPrimary,
        website_url: website || null,
        instagram_url: instagram || null,
        facebook_url: facebook || null,
        google_maps_url: maps || null,
        phone: phone || null,
        email: email || null,
      })
      .eq("id", property.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved({
      ...property,
      name,
      slug: slug || property.slug,
      city: city || null,
      about: about || null,
      color_bg: colorBg,
      color_primary: colorPrimary,
      website_url: website || null,
      instagram_url: instagram || null,
      facebook_url: facebook || null,
      google_maps_url: maps || null,
      phone: phone || null,
      email: email || null,
    });
  }

  const isOpen = property !== null;
  const bgLum = (() => {
    const hex = colorBg.replace("#", "");
    if (hex.length !== 6) return 0;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  })();
  const previewText = bgLum > 128 ? "#0A0A0A" : "#F5F0EC";

  return (
    <>
      <div
        className={`fixed inset-0 bg-onyx/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-parchment z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-onyx/10">
          <div>
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
              Editing · Casa
            </span>
            <h2 className="font-display text-xl text-onyx mt-0.5">
              {property?.name ?? ""}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-onyx/40 hover:text-onyx transition-colors p-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Live preview */}
          <div
            className="h-20 w-full relative overflow-hidden border border-onyx/10"
            style={{ backgroundColor: colorBg }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: colorPrimary }}
            />
            <span
              className="absolute bottom-3 left-3 font-display text-base"
              style={{ color: previewText }}
            >
              {name || "Pension name"}
            </span>
            {city && (
              <span
                className="absolute top-3 right-3 font-sans uppercase"
                style={{
                  color: colorPrimary,
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                }}
              >
                {city}
              </span>
            )}
          </div>

          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Slug · URL" hint={`oriz.at/casa/${slug || "…"}`}>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              className={inputCls + " font-mono"}
            />
          </Field>

          <Field label="Stadt">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
              placeholder="Wien"
            />
          </Field>

          <Field label="Über (optional)">
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
            />
          </Field>

          <div className="border-t border-onyx/10 pt-6 space-y-4">
            <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
              Theme
            </p>
            <ColorField label="Background" value={colorBg} onChange={setColorBg} />
            <ColorField
              label="Accent"
              value={colorPrimary}
              onChange={setColorPrimary}
            />
          </div>

          {/* Logo */}
          <div className="border-t border-onyx/10 pt-6">
            <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 mb-3">
              Logo
            </p>
            {property && (property.logo_svg || property.logo_url) && (
              <div className="mb-4 space-y-3">
                <p className="font-sans text-[9px] tracking-regal uppercase text-onyx/40">
                  Vorschau auf 3 Hintergründen:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <PreviewSwatch bg={colorBg} accent={colorPrimary} svg={property.logo_svg} url={property.logo_url} name={property.name} mode="auto" label="auto" />
                  <PreviewSwatch bg="#F5F0EC" accent={colorPrimary} svg={property.logo_svg} url={property.logo_url} name={property.name} mode="auto" label="hell" />
                  <PreviewSwatch bg="#0A0A0A" accent={colorPrimary} svg={property.logo_svg} url={property.logo_url} name={property.name} mode="auto" label="dunkel" />
                  <PreviewSwatch bg={colorBg} accent={colorPrimary} svg={property.logo_svg} url={property.logo_url} name={property.name} mode="accent" label="accent" />
                </div>
              </div>
            )}
            <p className="font-sans text-[10px] text-onyx/40 mb-3 leading-snug">
              SVG empfohlen (passt sich automatisch der Farbe an). PNG/JPG
              werden als-ist angezeigt.
            </p>
            {property && (
              <PhotoUploader
                target="casa-property-logo"
                id={property.id}
                currentUrl={property.logo_url ?? null}
                onChange={() => {
                  // Re-fetch on save would be ideal; for now just reload the panel.
                  window.location.reload();
                }}
                aspect="square"
                label={property.logo_svg ? "+ Logo ersetzen" : "+ Logo hinzufügen"}
              />
            )}
          </div>

          <div className="border-t border-onyx/10 pt-6 space-y-4">
            <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
              Links &amp; Kontakt
            </p>
            <Field label="Website">
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputCls}
                placeholder="https://…"
              />
            </Field>
            <Field label="Google Maps">
              <input
                type="url"
                value={maps}
                onChange={(e) => setMaps(e.target.value)}
                className={inputCls}
                placeholder="https://maps.google.com/?q=…"
              />
            </Field>
            <Field label="Instagram">
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className={inputCls}
                placeholder="https://instagram.com/…"
              />
            </Field>
            <Field label="Facebook">
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className={inputCls}
                placeholder="https://facebook.com/…"
              />
            </Field>
            <Field label="Telefon">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="E-Mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {error && <p className="font-sans text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-onyx/10 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-onyx text-parchment font-sans text-[12px] tracking-regal uppercase py-3 hover:bg-onyx/85 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {property && (
            <div className="flex gap-2">
              <a
                href={`/casa/${slug || property.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-onyx/15 py-2 hover:border-gold hover:text-gold transition-colors"
              >
                Karte ↗
              </a>
              <a
                href={`/admin/casa/${slug || property.slug}`}
                className="flex-1 text-center font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-onyx/15 py-2 hover:border-gold hover:text-gold transition-colors"
              >
                Inhalt bearbeiten →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const inputCls =
  "w-full font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-sans text-[10px] text-onyx/30 mt-1">{hint}</p>
      )}
    </div>
  );
}

function PreviewSwatch({
  bg,
  accent,
  svg,
  url,
  name,
  mode,
  label,
}: {
  bg: string;
  accent: string;
  svg?: string | null;
  url?: string | null;
  name: string;
  mode: "auto" | "accent";
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-20 h-20 flex items-center justify-center"
        style={{ backgroundColor: bg, border: "1px solid rgba(0,0,0,0.1)" }}
      >
        <VenueLogo
          svg={svg}
          url={url}
          name={name}
          bg={bg}
          accent={accent}
          color={mode}
          height={32}
        />
      </div>
      <span className="font-sans text-[9px] tracking-regal uppercase text-onyx/40">
        {label}
      </span>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 cursor-pointer border border-onyx/20 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-sans text-sm bg-white border border-onyx/15 px-3 py-2 text-onyx focus:outline-none focus:border-gold"
        />
      </div>
    </div>
  );
}
