"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VenueEditPanel } from "@/components/admin/VenueEditPanel";
import { AddVenueModal } from "@/components/admin/AddVenueModal";
import { QRModal } from "@/components/admin/QRModal";
import { AdminFrame, AdminTitle } from "@/app/admin/AdminFrame";
import type { Standing } from "@/lib/entitlements";
import { venueHost, venueUrl } from "@/lib/venue-host";
import type { Venue } from "@/lib/supabase/types";

type VenueSummary = Pick<Venue, "id" | "slug" | "name" | "about" | "color_bg" | "color_primary" | "logo_url" | "instagram_url" | "google_maps_url"> & {
  plan: string;
  itemCount: number;
  logo_svg?: string | null;
  menu_theme?: "classic" | "visual" | "modern";
  phone?: string | null;
  address?: string | null;
  website_url?: string | null;
  google_review_url?: string | null;
  tripadvisor_url?: string | null;
  facebook_url?: string | null;
  price_range?: string | null;
  opening_hours?: Record<string, [string, string][]> | null;
  gallery?: string[] | null;
  published: boolean;
  standing: Standing;
};

type Props = { venues: VenueSummary[]; dueLeads: number; openOrders: number };

// A trial that ends within this many days shows up under "Heute".
const SOON_DAYS = 3;

const TONE: Record<Standing["kind"], string> = {
  trial: "bg-amber-100 text-amber-900",
  trial_over: "bg-red-100 text-red-800",
  paid: "bg-emerald-100 text-emerald-900",
  free: "bg-onyx/5 text-onyx/75",
  due: "bg-red-100 text-red-800",
  ended: "bg-onyx/5 text-onyx/60",
  none: "bg-onyx/5 text-onyx/60",
};

const card = "rounded-2xl bg-white ring-1 ring-onyx/10";
const label = "text-sm font-semibold uppercase tracking-[0.14em] text-[#7A5C14]";

function Tile({ value, title, href }: { value: number; title: string; href?: string }) {
  const body = (
    <>
      <p className="font-display text-4xl font-medium leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-base font-medium leading-tight">{title}</p>
    </>
  );
  return href ? <Link href={href} className={`${card} block p-4 active:bg-onyx/5`}>{body}</Link> : <div className={`${card} p-4`}>{body}</div>;
}

function TodoRow({ href, title, hint, warn }: { href: string; title: string; hint?: string; warn?: boolean }) {
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 active:bg-onyx/5">
      <span className="min-w-0">
        <span className={`block text-[17px] font-medium ${warn ? "text-red-700" : ""}`}>{title}</span>
        {hint && <span className="block text-sm text-onyx/60">{hint}</span>}
      </span>
      <span aria-hidden className="text-xl text-onyx/40">›</span>
    </Link>
  );
}

export function SuperAdminView({ venues, dueLeads, openOrders }: Props) {
  const router = useRouter();
  const [editingVenue, setEditingVenue] = useState<VenueSummary | null>(null);
  const [qrVenue, setQrVenue] = useState<VenueSummary | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const trials = venues.filter((v) => v.standing.kind === "trial");
  const paying = venues.filter((v) => v.standing.kind === "paid");
  const endingSoon = trials.filter((v) => v.standing.daysLeft !== null && v.standing.daysLeft <= SOON_DAYS);
  const overdue = venues.filter((v) => v.standing.kind === "trial_over" || v.standing.kind === "due");
  const nothing = dueLeads === 0 && openOrders === 0 && endingSoon.length === 0 && overdue.length === 0;

  return (
    <AdminFrame>
      <AdminTitle
        title="Übersicht"
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-onyx px-4 text-base font-semibold text-parchment"
          >
            + Lokal
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Tile value={venues.length} title="Lokale" />
        <Tile value={trials.length} title="Im Test" href="/admin/tarife" />
        <Tile value={paying.length} title="Bezahlt" href="/admin/tarife" />
      </div>

      <section className={`${card} mt-5 overflow-hidden`}>
        <p className={`${label} px-5 pt-4`}>Heute</p>
        {nothing ? (
          <p className="px-5 pb-5 pt-2 text-base text-onyx/65">Nichts offen.</p>
        ) : (
          <div className="mt-1 divide-y divide-onyx/10">
            {dueLeads > 0 && <TodoRow href="/admin/vertrieb" title={`${dueLeads} ${dueLeads === 1 ? "Kontakt" : "Kontakte"} wieder melden`} hint="Heute oder überfällig" warn />}
            {openOrders > 0 && <TodoRow href="/admin/auftraege" title={`${openOrders} ${openOrders === 1 ? "Auftrag" : "Aufträge"} erledigen`} hint="Bezahlt oder in Arbeit" />}
            {endingSoon.map((v) => (
              <TodoRow key={v.id} href="/admin/tarife" title={`${v.name}: Testphase endet bald`} hint={v.standing.label} />
            ))}
            {overdue.map((v) => (
              <TodoRow key={v.id} href="/admin/tarife" title={`${v.name}: ${v.standing.label}`} hint="Anrufen und Abo besprechen" warn />
            ))}
          </div>
        )}
      </section>

      <p className={`${label} mt-7 mb-2`}>Lokale · {venues.length}</p>
      <ul className={`${card} divide-y divide-onyx/10 overflow-hidden`}>
        {venues.map((v) => (
          <li key={v.id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-xl"
                style={{ backgroundColor: v.color_bg ?? "#1a1a1a", color: v.color_primary ?? "#C69B3C" }}
              >
                {v.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold leading-tight">{v.name}</p>
                <p className="truncate text-sm text-onyx/60">
                  {venueHost(v.slug)} · {v.itemCount} {v.itemCount === 1 ? "Gericht" : "Gerichte"}
                  {!v.published && " · offline"}
                </p>
                <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${TONE[v.standing.kind]}`}>{v.standing.label}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/app/${v.slug}`} className="inline-flex min-h-10 items-center rounded-full bg-onyx px-3.5 text-sm font-semibold text-parchment">
                Verwalten
              </Link>
              <a href={venueUrl(v.slug)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium ring-1 ring-onyx/20">
                Ansehen ↗
              </a>
              <button type="button" onClick={() => setQrVenue(v)} className="inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium ring-1 ring-onyx/20">
                QR
              </button>
              <button type="button" onClick={() => setEditingVenue(v)} className="inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium ring-1 ring-onyx/20">
                Daten
              </button>
            </div>
          </li>
        ))}
        {venues.length === 0 && <li className="px-5 py-5 text-base text-onyx/65">Noch keine Lokale.</li>}
      </ul>

      <VenueEditPanel
        venue={editingVenue}
        onClose={() => setEditingVenue(null)}
        onSaved={() => {
          setEditingVenue(null);
          router.refresh();
        }}
      />
      <AddVenueModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          router.refresh();
        }}
      />
      <QRModal slug={qrVenue?.slug ?? null} name={qrVenue?.name ?? ""} onClose={() => setQrVenue(null)} />
    </AdminFrame>
  );
}
