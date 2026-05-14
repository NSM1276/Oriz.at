"use client";

import { useState } from "react";
import { VenueCard } from "@/components/admin/VenueCard";
import { VenueEditPanel } from "@/components/admin/VenueEditPanel";
import { SuperAdminShell } from "@/components/admin/SuperAdminShell";
import type { Venue } from "@/lib/supabase/types";

type VenueSummary = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary"> & {
  plan: string;
  itemCount: number;
};

type Props = {
  venues: VenueSummary[];
};

export function SuperAdminView({ venues: initial }: Props) {
  const [venues, setVenues] = useState<VenueSummary[]>(initial);
  const [editingVenue, setEditingVenue] = useState<VenueSummary | null>(null);

  function handleSaved(updated: Pick<VenueSummary, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "plan">) {
    setVenues(prev =>
      prev.map(v => v.id === updated.id ? { ...v, ...updated } : v)
    );
    setEditingVenue(null);
  }

  const total = venues.length;
  const pro = venues.filter(v => v.plan === "pro").length;
  const starter = venues.filter(v => v.plan === "starter").length;
  const trial = venues.filter(v => v.plan === "trial").length;

  const stats = [
    { label: "Total venues", value: total },
    { label: "Pro", value: pro },
    { label: "Starter", value: starter },
    { label: "Trial", value: trial },
  ];

  return (
    <SuperAdminShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">ORIZ · Super Admin</span>
          <h1 className="font-display text-3xl text-onyx mt-1">All Venues</h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {stats.map(stat => (
            <div key={stat.label} className="border border-onyx/10 px-5 py-4 bg-white/40">
              <div className="font-display text-4xl text-onyx">{stat.value}</div>
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
            />
          ))}
        </div>
      </div>

      {/* Edit panel */}
      <VenueEditPanel
        venue={editingVenue}
        onClose={() => setEditingVenue(null)}
        onSaved={handleSaved}
      />
    </SuperAdminShell>
  );
}
