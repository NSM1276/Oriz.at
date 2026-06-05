"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { CasaStylePicker } from "@/components/admin/CasaStylePicker";
import { VenueLogo } from "@/components/brand/VenueLogo";

// ── types ──────────────────────────────────────────────────────────────────
type Property = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  about: string | null;
  color_bg: string | null;
  color_primary: string | null;
  casa_theme: string | null;
  logo_url: string | null;
  logo_svg: string | null;
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
  phone: string | null;
  email: string | null;
};

type Block = {
  id: string;
  property_id: string;
  block_type: string;
  title_de: string | null;
  title_en: string | null;
  body_de: string | null;
  body_en: string | null;
  image_url: string | null;
  position: number;
};

// ── style helpers (light parchment look) ───────────────────────────────────
const labelCls =
  "font-sans uppercase mb-2 block";
const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(10,10,10,0.45)",
  letterSpacing: "0.18em",
};
const inputCls =
  "w-full border-b border-onyx/20 bg-transparent py-2 font-sans text-sm text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-gold transition-colors";

function StatusDot({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  const color =
    status === "saving" ? "#A8842F" : status === "saved" ? "#16A34A" : "#DC2626";
  const text =
    status === "saving" ? "speichern…" : status === "saved" ? "gespeichert" : "fehler";
  return (
    <span
      className="font-sans uppercase"
      style={{
        fontSize: "9px",
        color,
        letterSpacing: "0.18em",
        marginLeft: "8px",
      }}
    >
      · {text}
    </span>
  );
}

// ── single editable field ─────────────────────────────────────────────────
function EditableField({
  label,
  value,
  multiline = false,
  placeholder,
  onSave,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  placeholder?: string;
  onSave: (newValue: string) => Promise<void>;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function commit() {
    if (local === (value ?? "")) return;
    setStatus("saving");
    try {
      await onSave(local);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mb-5">
      <span className={labelCls} style={labelStyle}>
        {label}
        <StatusDot status={status} />
      </span>
      {multiline ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          className={inputCls + " resize-none leading-snug"}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          className={inputCls}
        />
      )}
    </div>
  );
}

// ── QR block ──────────────────────────────────────────────────────────────
function QRBlock({ slug }: { slug: string }) {
  // Short URL — denser QR, easier to scan from distance.
  // /casa/[slug] still works as the long URL.
  const url = `https://oriz.at/c/${slug}`;
  const qrDisplay = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0a0a0a&margin=2`;
  const qrDownload = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0a0a0a&margin=4&format=png`;

  return (
    <div
      className="mb-10 flex items-center gap-6 px-5 py-5"
      style={{ border: "1px solid rgba(10,10,10,0.10)" }}
    >
      <div className="shrink-0 p-2 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDisplay} alt="QR Code" width={88} height={88} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-sans uppercase mb-1"
          style={{
            fontSize: "10px",
            color: "rgba(10,10,10,0.45)",
            letterSpacing: "0.18em",
          }}
        >
          QR-Code · Gäste-Link
        </div>
        <div
          className="font-sans truncate"
          style={{ fontSize: "13px", color: "#0A0A0A" }}
        >
          {url}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={qrDownload}
            download={`qr-casa-${slug}.png`}
            className="inline-block font-sans uppercase transition-opacity hover:opacity-70"
            style={{
              fontSize: "10px",
              padding: "8px 14px",
              border: "1px solid rgba(10,10,10,0.30)",
              color: "#0A0A0A",
              letterSpacing: "0.18em",
            }}
          >
            Nur QR · PNG ↓
          </a>
          <a
            href={`/admin/qr/casa/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-sans uppercase transition-opacity hover:opacity-70"
            style={{
              fontSize: "10px",
              padding: "8px 14px",
              background: "#0A0A0A",
              color: "#F5F0EC",
              letterSpacing: "0.18em",
            }}
          >
            Druckfertige Karte ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ── main editor ───────────────────────────────────────────────────────────
export function CasaAdminEditor({
  initialProperty,
  initialBlocks,
}: {
  initialProperty: Property;
  initialBlocks: Block[];
}) {
  const [property, setProperty] = useState(initialProperty);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [addingBlock, setAddingBlock] = useState(false);

  // ── property field updates ───────────────────────────────────────────────
  async function saveProperty<K extends keyof Property>(field: K, value: Property[K]) {
    setProperty((p) => ({ ...p, [field]: value }));
    const res = await fetch("/api/admin/casa/property-update", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, updates: { [field]: value } }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { error?: string }).error ?? "Fehler beim Speichern.");
    }
  }

  // ── block field updates ──────────────────────────────────────────────────
  async function saveBlock<K extends keyof Block>(blockId: string, field: K, value: Block[K]) {
    setBlocks((bs) =>
      bs.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)),
    );
    const res = await fetch("/api/admin/casa/block", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blockId, updates: { [field]: value } }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { error?: string }).error ?? "Fehler beim Speichern.");
    }
  }

  async function addBlock() {
    setAddingBlock(true);
    const nextPosition = blocks.length;
    const res = await fetch("/api/admin/casa/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId: property.id,
        block_type: "other",
        title_de: "Neuer Block",
        title_en: "New block",
        body_de: "",
        body_en: "",
        position: nextPosition,
      }),
    });
    setAddingBlock(false);
    if (res.ok) {
      const json = await res.json();
      if (json.block) setBlocks((bs) => [...bs, json.block as Block]);
    } else {
      const json = await res.json().catch(() => ({}));
      alert("Fehler beim Hinzufügen: " + ((json as { error?: string }).error ?? "Unbekannter Fehler"));
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm("Diesen Block wirklich löschen?")) return;
    const prev = blocks;
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    // Storage cleanup first — best-effort, silent on missing file
    await fetch(`/api/admin/upload-photo?target=casa-block&id=${id}`, {
      method: "DELETE",
    }).catch(() => {});
    const res = await fetch(`/api/admin/casa/block?blockId=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setBlocks(prev);
      const json = await res.json().catch(() => ({}));
      alert("Fehler beim Löschen: " + ((json as { error?: string }).error ?? "Unbekannter Fehler"));
    }
  }

  async function moveBlock(id: string, direction: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    // reassign positions
    const repositioned = reordered.map((b, i) => ({ ...b, position: i }));
    setBlocks(repositioned);
    // persist both swapped blocks
    await Promise.all([
      fetch("/api/admin/casa/block", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blockId: reordered[swapIdx].id, updates: { position: idx } }),
      }),
      fetch("/api/admin/casa/block", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blockId: reordered[idx].id, updates: { position: swapIdx } }),
      }),
    ]);
  }

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <span
              className="font-sans uppercase"
              style={{
                fontSize: "10px",
                color: "#C69B3C",
                letterSpacing: "0.32em",
              }}
            >
              ORIZ · Casa · Admin
            </span>
            <h1
              className="font-display font-light mt-2"
              style={{ fontSize: "1.75rem", color: "#0A0A0A" }}
            >
              {property.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`/casa/${property.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-sans uppercase transition-opacity hover:opacity-70"
              style={{
                fontSize: "10px",
                color: "rgba(10,10,10,0.50)",
                letterSpacing: "0.18em",
              }}
            >
              Vorschau ↗
            </a>
            <button
              onClick={signOut}
              className="font-sans uppercase transition-opacity hover:opacity-70"
              style={{
                fontSize: "10px",
                color: "rgba(10,10,10,0.50)",
                letterSpacing: "0.18em",
              }}
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* QR code */}
        <QRBlock slug={property.slug} />

        {/* Style picker */}
        <CasaStylePicker
          propertyId={property.id}
          color_bg={property.color_bg}
          color_primary={property.color_primary}
          casa_theme={property.casa_theme}
          onUpdate={(updates) => setProperty((p) => ({ ...p, ...updates }))}
        />

        {/* Logo */}
        <section
          className="mb-10 py-8"
          style={{ borderTop: "1px solid rgba(10,10,10,0.10)", borderBottom: "1px solid rgba(10,10,10,0.10)" }}
        >
          <h2 className="font-sans uppercase mb-4" style={{ fontSize: "11px", color: property.color_primary ?? "#C69B3C", letterSpacing: "0.28em" }}>
            Logo
          </h2>
          {(property.logo_svg || property.logo_url) && (
            <div className="mb-5">
              <div className="flex gap-2 flex-wrap mb-3">
                {[property.color_bg ?? "#0A0A0A", "#F5F0EC", "#0A0A0A"].map((bg, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: bg, border: "1px solid rgba(0,0,0,0.10)" }}>
                      <VenueLogo svg={property.logo_svg} url={property.logo_url} name={property.name} bg={bg} accent={property.color_primary ?? "#C69B3C"} color="auto" height={28} />
                    </div>
                    <span className="font-sans text-[9px] tracking-regal uppercase" style={{ color: "rgba(10,10,10,0.40)" }}>{i === 0 ? "aktuell" : i === 1 ? "hell" : "dunkel"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <PhotoUploader
            target="casa-property-logo"
            id={property.id}
            currentUrl={property.logo_url ?? null}
            onChange={(url) => {
              // For JPEG/PNG: url is the new URL. For SVG: url may be undefined.
              // Re-fetch property to get updated logo_svg / logo_url.
              fetch("/api/admin/casa/property-update", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ propertyId: property.id, updates: {} }),
              }).catch(() => {});
              // Reload only the property data (not the page) by refreshing the router
              window.location.reload();
            }}
            aspect="square"
            label={property.logo_svg || property.logo_url ? "+ Logo ersetzen" : "+ Logo hinzufügen"}
          />
          {(property.logo_svg || property.logo_url) && (
            <button
              onClick={async () => {
                await fetch("/api/admin/casa/property-update", {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ propertyId: property.id, updates: { logo_url: null } }),
                });
                setProperty((p) => ({ ...p, logo_url: null, logo_svg: null }));
              }}
              className="mt-3 font-sans text-[10px] tracking-regal uppercase transition-opacity hover:opacity-70"
              style={{ color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.18em" }}
            >
              Logo entfernen
            </button>
          )}
        </section>

        {/* Property fields */}
        <section
          className="mb-12 py-8"
          style={{
            borderTop: "1px solid rgba(10,10,10,0.10)",
            borderBottom: "1px solid rgba(10,10,10,0.10)",
          }}
        >
          <h2
            className="font-sans uppercase mb-6"
            style={{
              fontSize: "11px",
              color: "#C69B3C",
              letterSpacing: "0.28em",
            }}
          >
            Unterkunft
          </h2>
          <EditableField
            label="Name"
            value={property.name}
            onSave={(v) => saveProperty("name", v)}
          />
          <EditableField
            label="Ort"
            value={property.city}
            onSave={(v) => saveProperty("city", v || null)}
          />
          <EditableField
            label="Über (optional)"
            value={property.about}
            multiline
            placeholder="Kurzbeschreibung Ihrer Unterkunft"
            onSave={(v) => saveProperty("about", v || null)}
          />

          {/* Cover photo */}
          <div className="mt-6">
            <div
              className="font-sans uppercase mb-2"
              style={{
                fontSize: "10px",
                color: "rgba(10,10,10,0.50)",
                letterSpacing: "0.18em",
              }}
            >
              Titelbild · Cover (optional)
            </div>
            <p
              className="font-display italic mb-3"
              style={{ fontSize: "12px", color: "rgba(10,10,10,0.45)" }}
            >
              Erscheint oben auf der Gästekarte — Fassade, gemütliche Ecke, Eingang.
            </p>
            <PhotoUploader
              target="casa-cover"
              id={property.id}
              currentUrl={property.cover_url}
              onChange={(url) => saveProperty("cover_url", url)}
              aspect="wide"
              label="+ Titelbild hinzufügen"
            />
          </div>
        </section>

        {/* Links & Kontakt */}
        <section
          className="mb-12 py-8"
          style={{
            borderTop: "1px solid rgba(10,10,10,0.10)",
            borderBottom: "1px solid rgba(10,10,10,0.10)",
          }}
        >
          <h2
            className="font-sans uppercase mb-2"
            style={{
              fontSize: "11px",
              color: "#C69B3C",
              letterSpacing: "0.28em",
            }}
          >
            Links &amp; Kontakt
          </h2>
          <p
            className="font-display italic mb-6"
            style={{ fontSize: "13px", color: "rgba(10,10,10,0.50)" }}
          >
            Erscheinen als kleine Icon-Buttons oben auf der Gästekarte.
            Leere Felder werden ausgeblendet.
          </p>
          <EditableField
            label="Website"
            value={property.website_url}
            placeholder="https://ihre-unterkunft.at"
            onSave={(v) => saveProperty("website_url", v || null)}
          />
          <EditableField
            label="Google Maps"
            value={property.google_maps_url}
            placeholder="https://maps.google.com/?q=..."
            onSave={(v) => saveProperty("google_maps_url", v || null)}
          />
          <EditableField
            label="Instagram"
            value={property.instagram_url}
            placeholder="https://instagram.com/ihre-unterkunft"
            onSave={(v) => saveProperty("instagram_url", v || null)}
          />
          <EditableField
            label="Facebook"
            value={property.facebook_url}
            placeholder="https://facebook.com/ihre-unterkunft"
            onSave={(v) => saveProperty("facebook_url", v || null)}
          />
          <EditableField
            label="Telefon"
            value={property.phone}
            placeholder="+43 1 234 5678"
            onSave={(v) => saveProperty("phone", v || null)}
          />
          <EditableField
            label="E-Mail"
            value={property.email}
            placeholder="kontakt@ihre-unterkunft.at"
            onSave={(v) => saveProperty("email", v || null)}
          />
        </section>

        {/* Content blocks */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="font-sans uppercase"
              style={{
                fontSize: "11px",
                color: "#C69B3C",
                letterSpacing: "0.28em",
              }}
            >
              Inhalt · {blocks.length} {blocks.length === 1 ? "Block" : "Blöcke"}
            </h2>
            <button
              onClick={addBlock}
              disabled={addingBlock}
              className="font-sans uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{
                fontSize: "10px",
                padding: "8px 14px",
                border: "1px solid #C69B3C",
                color: "#C69B3C",
                letterSpacing: "0.18em",
              }}
            >
              {addingBlock ? "…" : "+ Block hinzufügen"}
            </button>
          </div>

          {blocks.map((b, i) => (
            <div
              key={b.id}
              className="py-7"
              style={{
                borderTop: i === 0 ? "1px solid rgba(10,10,10,0.10)" : undefined,
                borderBottom: "1px solid rgba(10,10,10,0.10)",
              }}
            >
              {/* block toolbar */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-sans uppercase"
                  style={{
                    fontSize: "9px",
                    color: "rgba(10,10,10,0.40)",
                    letterSpacing: "0.32em",
                  }}
                >
                  Block {i + 1} · {b.block_type}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => moveBlock(b.id, -1)}
                    disabled={i === 0}
                    className="font-sans transition-opacity hover:opacity-70 disabled:opacity-20"
                    style={{ fontSize: "12px", color: "rgba(10,10,10,0.50)" }}
                    aria-label="nach oben"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBlock(b.id, 1)}
                    disabled={i === blocks.length - 1}
                    className="font-sans transition-opacity hover:opacity-70 disabled:opacity-20"
                    style={{ fontSize: "12px", color: "rgba(10,10,10,0.50)" }}
                    aria-label="nach unten"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteBlock(b.id)}
                    className="font-sans uppercase transition-opacity hover:opacity-70"
                    style={{
                      fontSize: "9px",
                      color: "#DC2626",
                      letterSpacing: "0.18em",
                    }}
                  >
                    Löschen
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <EditableField
                  label="Titel (DE)"
                  value={b.title_de}
                  onSave={(v) => saveBlock(b.id, "title_de", v || null)}
                />
                <EditableField
                  label="Title (EN)"
                  value={b.title_en}
                  onSave={(v) => saveBlock(b.id, "title_en", v || null)}
                />
                <EditableField
                  label="Inhalt (DE)"
                  value={b.body_de}
                  multiline
                  onSave={(v) => saveBlock(b.id, "body_de", v || null)}
                />
                <EditableField
                  label="Content (EN)"
                  value={b.body_en}
                  multiline
                  onSave={(v) => saveBlock(b.id, "body_en", v || null)}
                />
              </div>

              <EditableField
                label="Block-Typ (intern, z.B. wifi, checkin, breakfast)"
                value={b.block_type}
                onSave={(v) => saveBlock(b.id, "block_type", v || "other")}
              />

              <div className="mt-5">
                <div
                  className="font-sans uppercase mb-2"
                  style={{
                    fontSize: "10px",
                    color: "rgba(10,10,10,0.50)",
                    letterSpacing: "0.18em",
                  }}
                >
                  Bild (optional)
                </div>
                <PhotoUploader
                  target="casa-block"
                  id={b.id}
                  currentUrl={b.image_url}
                  onChange={(url) => saveBlock(b.id, "image_url", url)}
                  aspect="wide"
                  label="+ Bild zum Block"
                />
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <p
              className="font-display italic text-center py-12"
              style={{ color: "rgba(10,10,10,0.40)" }}
            >
              Noch keine Blöcke. Fügen Sie den ersten hinzu.
            </p>
          )}
        </section>

        {/* Footer note */}
        <p
          className="text-center font-sans uppercase mt-16"
          style={{
            fontSize: "9px",
            color: "rgba(10,10,10,0.30)",
            letterSpacing: "0.32em",
          }}
        >
          Änderungen sind sofort live · Cache 60 Sekunden
        </p>
      </div>
    </main>
  );
}
