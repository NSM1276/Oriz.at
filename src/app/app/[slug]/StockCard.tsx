"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { foldForSearch } from "@/lib/guest-menu";
import { setAvailable } from "./speisekarte/actions";
import { Card, Label } from "./ui";

export type StockItem = { id: string; name: string; section: string; available: boolean };

// "Ausverkauft" from the start page, the thing an owner does most during service:
// search a dish, flip it; dishes that are out are listed so they come back in one tap.
export function StockCard({ slug, items }: { slug: string; items: StockItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const available = (it: StockItem) => state[it.id] ?? it.available;
  const out = items.filter((it) => !available(it));
  const tokens = foldForSearch(query).split(" ").filter(Boolean);
  const hits = useMemo(
    () => (tokens.length === 0 ? [] : items.filter((it) => tokens.every((t) => foldForSearch(`${it.name} ${it.section}`).includes(t))).slice(0, 6)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, items],
  );

  function flip(it: StockItem) {
    const next = !available(it);
    setError(null);
    setState((s) => ({ ...s, [it.id]: next }));
    start(async () => {
      // Flipped off during service: back by itself tomorrow morning.
      const res = await setAvailable(slug, it.id, next, "today");
      if (!res.ok) {
        setState((s) => ({ ...s, [it.id]: !next }));
        setError(res.error ?? "Fehler.");
      } else router.refresh();
    });
  }

  const row = (it: StockItem) => {
    const on = available(it);
    return (
      <li key={it.id} className="flex items-center gap-3 py-2.5">
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium ${on ? "" : "text-onyx/40 line-through"}`}>{it.name}</span>
          <span className="block truncate text-sm text-onyx/60">{it.section}</span>
        </span>
        <button
          type="button"
          onClick={() => flip(it)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-base font-medium ring-1 ${on ? "bg-white text-red-700 ring-red-200" : "bg-emerald-600 text-white ring-emerald-600"}`}
        >
          {on ? "Ausverkauft" : "Wieder da"}
        </button>
      </li>
    );
  };

  return (
    <Card>
      <Label>Ausverkauft</Label>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Gericht suchen, z. B. Schnitzel"
        aria-label="Gericht suchen"
        className="mt-3 w-full rounded-xl border border-onyx/20 bg-white px-4 py-3 text-base outline-none focus:border-onyx"
      />
      {tokens.length > 0 && (
        hits.length > 0 ? <ul className="mt-1 divide-y divide-onyx/10">{hits.map(row)}</ul> : <p className="mt-3 text-base text-onyx/60">Kein Gericht gefunden.</p>
      )}
      {tokens.length === 0 && (
        out.length === 0 ? (
          <p className="mt-3 text-base text-onyx/70">Alles verfügbar. Ist etwas aus, suchen Sie es oben — Gäste sehen es sofort.</p>
        ) : (
          <>
            <p className="mt-3 text-base text-onyx/70">{out.length === 1 ? "1 Gericht ist gerade aus:" : `${out.length} Gerichte sind gerade aus:`}</p>
            <ul className="mt-1 divide-y divide-onyx/10">{out.map(row)}</ul>
          </>
        )
      )}
      {error && <p className="mt-2 text-base text-red-700">{error}</p>}
    </Card>
  );
}
