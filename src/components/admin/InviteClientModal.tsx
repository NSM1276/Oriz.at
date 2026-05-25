"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function InviteClientModal({ open, onClose, onCreated }: Props) {
  const [product, setProduct] = useState<"carta" | "casa">("carta");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Wien");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleName(v: string) {
    setName(v);
    setSlug(toSlug(v));
  }

  function reset() {
    setProduct("carta");
    setName("");
    setSlug("");
    setCity("Wien");
    setEmail("");
    setError(null);
    setSuccess(null);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleInvite() {
    if (!name || !slug || !email) {
      setError("Name, Slug und E-Mail sind erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/invite-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        name,
        slug,
        email,
        city: product === "casa" ? city : undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || `HTTP ${res.status}`);
      return;
    }
    setSuccess(
      `Einladung an ${email} gesendet. Der Klient setzt sein Passwort über den Link und kann dann ${
        product === "carta" ? "/admin" : `/admin/casa/${slug}`
      } öffnen.`,
    );
    onCreated?.();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-onyx/40 z-50 flex items-center justify-center px-6"
      onClick={handleClose}
    >
      <div
        className="bg-parchment w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-onyx mb-1">
          Klient einladen
        </h2>
        <p className="font-display italic text-onyx/50 text-sm mb-6">
          Erstellt das Objekt und sendet dem Klienten einen E-Mail-Link,
          mit dem er sein Passwort setzt.
        </p>

        {success ? (
          <>
            <div className="border border-gold/40 bg-gold/5 p-5 mb-6">
              <p className="font-display text-onyx leading-relaxed">{success}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx py-3 hover:bg-onyx/85 transition"
            >
              Fertig
            </button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* Product chooser */}
              <div>
                <label className="block font-sans text-[11px] tracking-regal uppercase text-onyx/60 mb-2">
                  Produkt
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { v: "carta", label: "Carta · Menü" },
                      { v: "casa", label: "Casa · Pension" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setProduct(opt.v)}
                      className={`flex-1 font-sans text-[11px] tracking-regal uppercase py-2 border transition-colors ${
                        product === opt.v
                          ? "border-gold bg-gold text-onyx"
                          : "border-onyx/15 text-onyx/60 hover:border-onyx/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleName(e.target.value)}
                  className={inputCls}
                  placeholder={
                    product === "carta"
                      ? "Trattoria Belvedere"
                      : "Pension Belmondo"
                  }
                  autoFocus
                />
              </Field>

              <Field label="Slug · URL" hint={`oriz.at/${product === "casa" ? "casa/" : ""}${slug || "…"}`}>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
                  className={inputCls + " font-mono"}
                />
              </Field>

              {product === "casa" && (
                <Field label="Stadt">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              )}

              <Field
                label="E-Mail des Klienten"
                hint="Erhält Einladungslink. Setzt Passwort selbst, ohne unsere Hilfe."
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="kontakt@unterkunft.at"
                />
              </Field>

              {error && (
                <p className="font-sans text-xs text-red-600 leading-snug">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleClose}
                disabled={saving}
                className="flex-1 font-sans text-[11px] tracking-regal uppercase text-onyx/50 border border-onyx/20 py-3 hover:border-onyx hover:text-onyx transition disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleInvite}
                disabled={saving}
                className="flex-1 font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx py-3 hover:bg-onyx/85 transition disabled:opacity-50"
              >
                {saving ? "Einladen…" : "Einladen"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
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
        <p className="font-sans text-[10px] text-onyx/40 mt-1">{hint}</p>
      )}
    </div>
  );
}
