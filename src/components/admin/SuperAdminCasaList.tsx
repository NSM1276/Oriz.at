"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CasaPropertyEditPanel,
  type CasaPropertySummary,
} from "@/components/admin/CasaPropertyEditPanel";
import { AddCasaPropertyModal } from "@/components/admin/AddCasaPropertyModal";

type Props = {
  initial: CasaPropertySummary[];
};

export function SuperAdminCasaList({ initial }: Props) {
  const [list, setList] = useState<CasaPropertySummary[]>(initial);
  const [editing, setEditing] = useState<CasaPropertySummary | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function handleSaved(updated: CasaPropertySummary) {
    setList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  }

  function handleCreated(p: CasaPropertySummary) {
    setList((prev) => [...prev, p]);
    setAddOpen(false);
  }

  return (
    <>
      <header className="border-b border-onyx/8 px-6 py-5 flex items-center justify-between">
        <div>
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
            ORIZ · Casa
          </span>
          <h1 className="font-display text-2xl font-light mt-1">
            Alle Pensionen &amp; Apartments
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/30">
            {list.length} {list.length === 1 ? "Eintrag" : "Einträge"}
          </span>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-onyx text-parchment font-sans text-[11px] tracking-regal uppercase px-4 py-2.5 hover:bg-onyx/85 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Add Casa
          </button>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-px bg-gold/40 mx-auto mb-6" />
          <p className="font-display text-2xl italic text-onyx/50">
            Noch keine Casa-Objekte.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-6 font-sans text-[10px] tracking-regal uppercase text-gold border border-gold/50 px-4 py-2 hover:bg-gold hover:text-onyx transition"
          >
            Erste Unterkunft anlegen
          </button>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p) => {
            const bg = p.color_bg ?? "#0A0A0A";
            const accent = p.color_primary ?? "#C69B3C";
            return (
              <article
                key={p.id}
                className="group relative overflow-hidden bg-onyx text-parchment p-8 transition-transform hover:-translate-y-1"
                style={{ backgroundColor: bg, aspectRatio: "4/5" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}33 0%, transparent 70%)`,
                  }}
                />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="font-sans text-[10px] tracking-regal uppercase"
                        style={{ color: accent }}
                      >
                        Casa
                      </span>
                      {p.city && (
                        <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/40 ml-3">
                          {p.city}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditing(p)}
                      title="Einstellungen"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Edit settings"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <h2 className="font-display font-light text-parchment text-2xl mb-3">
                      {p.name}
                    </h2>
                    <div
                      className="w-10 h-px mb-5 opacity-40"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/casa/${p.slug}`}
                        className="font-sans text-[10px] tracking-regal uppercase text-parchment/55 hover:text-parchment transition-colors"
                      >
                        Inhalt →
                      </Link>
                      <a
                        href={`/casa/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans text-[10px] tracking-regal uppercase"
                        style={{ color: accent }}
                      >
                        Karte ↗
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CasaPropertyEditPanel
        property={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
      <AddCasaPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
