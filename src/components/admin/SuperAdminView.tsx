"use client";

import { useState } from "react";
import { VenueCard } from "@/components/admin/VenueCard";
import { VenueEditPanel } from "@/components/admin/VenueEditPanel";
import { AddVenueModal } from "@/components/admin/AddVenueModal";
import { QRModal } from "@/components/admin/QRModal";
import { SuperAdminShell } from "@/components/admin/SuperAdminShell";
import type { Venue } from "@/lib/supabase/types";

type VenueSummary = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "logo_url" | "instagram_url" | "google_maps_url"> & {
  plan: string;
  itemCount: number;
  logo_svg?: string | null;
};

type Props = {
  venues: VenueSummary[];
};

export function SuperAdminView({ venues: initial }: Props) {
  const [venues, setVenues] = useState<VenueSummary[]>(initial);
  const [editingVenue, setEditingVenue] = useState<VenueSummary | null>(null);
  const [qrVenue, setQrVenue] = useState<VenueSummary | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function handleSaved(updated: Pick<VenueSummary, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "plan">) {
    setVenues(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
    setEditingVenue(null);
  }

  function handleCreated(venue: VenueSummary) {
    setVenues(prev => [...prev, venue]);
    setAddOpen(false);
  }

  const total = venues.length;
  const pro = venues.filter(v => v.plan === "pro").length;
  const starter = venues.filter(v => v.plan === "starter").length;
  const trial = venues.filter(v => v.plan === "trial").length;

  return (
    <SuperAdminShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">ORIZ · Super Admin</span>
            <h1 className="font-display text-3xl text-onyx mt-1">All Venues</h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-onyx text-parchment font-sans text-[11px] tracking-regal uppercase px-4 py-2.5 hover:bg-onyx/85 transition-colors mt-1"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add venue
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total venues", value: total },
            { label: "Pro", value: pro, dot: "#22c55e" },
            { label: "Starter", value: starter, dot: "#C69B3C" },
            { label: "Trial", value: trial, dot: "#94a3b8" },
          ].map(stat => (
            <div key={stat.label} className="border border-onyx/10 px-5 py-4 bg-white/40">
              <div className="flex items-end gap-2">
                <div className="font-display text-4xl text-onyx">{stat.value}</div>
                {stat.dot && <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: stat.dot }} />}
              </div>
              <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/50 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Venue grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map(v => (
            <VenueCard
              key={v.id}
              id={v.id}
              name={v.name}
              slug={v.slug}
              colorBg={v.color_bg}
              colorPrimary={v.color_primary}
              plan={v.plan}
              itemCount={v.itemCount}
              onEdit={() => setEditingVenue(v)}
              onQR={() => setQrVenue(v)}
            />
          ))}
        </div>
      </div>

      <VenueEditPanel venue={editingVenue} onClose={() => setEditingVenue(null)} onSaved={handleSaved} />
      <AddVenueModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
      <QRModal slug={qrVenue?.slug ?? null} name={qrVenue?.name ?? ""} onClose={() => setQrVenue(null)} />
    </SuperAdminShell>
  );
}
