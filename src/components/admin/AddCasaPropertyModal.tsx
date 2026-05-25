"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CasaPropertySummary } from "@/components/admin/CasaPropertyEditPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (property: CasaPropertySummary) => void;
};

export function AddCasaPropertyModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Wien");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setSlug("");
    setCity("Wien");
    setOwnerEmail("");
    setError(null);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!name || !slug) {
      setError("Name und Slug sind erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    // Look up owner by email (must already exist in auth.users).
    // If empty, property is created without an owner (super admin can fix later).
    let ownerId: string | null = null;
    if (ownerEmail.trim()) {
      const { data: rpcUsers, error: rpcErr } = await supabase.rpc(
        "find_user_id_by_email",
        { p_email: ownerEmail.trim() },
      );
      if (rpcErr) {
        setSaving(false);
        setError(
          "Kann Owner nicht zuweisen (RPC find_user_id_by_email fehlt). Property wird ohne Owner angelegt — bitte später manuell zuweisen.",
        );
        return;
      }
      ownerId = (rpcUsers as string | null) ?? null;
      if (!ownerId) {
        setSaving(false);
        setError(`Kein Benutzer mit E-Mail ${ownerEmail.trim()} gefunden.`);
        return;
      }
    }

    const { data, error: insErr } = await supabase
      .schema("casa")
      .from("properties")
      .insert({
        name,
        slug,
        city: city || null,
        owner_id: ownerId,
        color_bg: "#0A0A0A",
        color_primary: "#C69B3C",
      })
      .select(
        "id, slug, name, city, about, color_bg, color_primary, website_url, instagram_url, facebook_url, google_maps_url, phone, email",
      )
      .single();

    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    onCreated(data as CasaPropertySummary);
    reset();
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
          Neue Casa-Unterkunft
        </h2>
        <p className="font-display italic text-onyx/50 text-sm mb-6">
          Pension, Apartment oder Hotel anlegen.
        </p>

        <div className="space-y-4">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Pension Belmondo"
              autoFocus
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
              placeholder="belmondo"
            />
          </Field>

          <Field label="Stadt">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field
            label="Owner · E-Mail"
            hint="Optional — muss bereits in Supabase Auth existieren. Leer = ohne Owner anlegen."
          >
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
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
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx py-3 hover:bg-onyx/85 transition disabled:opacity-50"
          >
            {saving ? "Anlegen…" : "Anlegen"}
          </button>
        </div>
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
