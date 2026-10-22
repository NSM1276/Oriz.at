import Link from "next/link";
import { serviceClient } from "@/lib/auth";
import { findPreset } from "@/lib/colorPresets";
import { requireVenue } from "../../venue";
import { MenuStep, StyleStep, TablesStep } from "./Steps";

export const dynamic = "force-dynamic";

// Steps 2–4 of setup; step 1 (name + address) is /app/neu. Every step can be
// skipped and redone later — the wizard only fills things the owner could
// also do from the regular pages.
const STEPS = ["speisekarte", "stil", "tische", "fertig"] as const;
type Step = (typeof STEPS)[number];

export default async function SetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ schritt?: string }>;
}) {
  const { slug } = await params;
  const { schritt } = await searchParams;
  const step: Step = STEPS.includes(schritt as Step) ? (schritt as Step) : "speisekarte";
  const { venue } = await requireVenue(slug);
  const db = serviceClient();
  const base = `/app/${venue.slug}/start`;
  const next = (s: Step) => `${base}?schritt=${s}`;

  const heading = (n: number, title: string, text: string) => (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
        {n <= 4 ? `Schritt ${n} von 4` : "Fertig"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{text}</p>
    </div>
  );

  if (step === "speisekarte") {
    const { count } = await db.from("items").select("id", { count: "exact", head: true }).eq("venue_id", venue.id);
    return (
      <>
        {heading(2, "Speisekarte", "Fügen Sie Ihre Karte als Text ein — aus Word, PDF oder der alten Website. Überschriften werden Bereiche, Zeilen mit Preis werden Gerichte.")}
        <MenuStep slug={venue.slug} existingItems={count ?? 0} nextHref={next("stil")} />
      </>
    );
  }

  if (step === "stil") {
    const { data } = await db
      .from("venues")
      .select("menu_theme, color_bg, color_primary")
      .eq("id", venue.id)
      .single<{ menu_theme: string | null; color_bg: string | null; color_primary: string | null }>();
    const preset = findPreset(data?.color_bg);
    const custom = !preset && data?.color_bg ? { bg: data.color_bg, primary: data.color_primary ?? "#C69B3C" } : null;
    return (
      <>
        {heading(3, "Aussehen", "Wählen Sie Darstellung und Farben. Die Vorschau zeigt Ihre echte Karte.")}
        <StyleStep
          slug={venue.slug}
          initialTheme={data?.menu_theme ?? "classic"}
          initialPreset={preset?.id ?? (custom ? "custom" : "pergament")}
          custom={custom}
          nextHref={next("tische")}
        />
      </>
    );
  }

  if (step === "tische") {
    const { count } = await db.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id);
    return (
      <>
        {heading(4, "Tische", "Jeder Tisch bekommt einen eigenen QR-Code. Gäste sehen dann, an welchem Tisch sie sitzen — und später können sie von dort das Personal rufen.")}
        <TablesStep slug={venue.slug} existingTables={count ?? 0} nextHref={next("fertig")} />
      </>
    );
  }

  return (
    <>
      {heading(5, "Ihre Speisekarte ist online", `Gäste erreichen sie unter oriz.at/${venue.slug}. Sie testen 14 Tage kostenlos.`)}
      <div className="space-y-3">
        <a
          href={`/${venue.slug}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl bg-stone-900 p-5 text-white shadow-sm"
        >
          <p className="font-semibold">Speisekarte ansehen</p>
          <p className="mt-0.5 text-sm text-stone-300">So sehen Ihre Gäste die Karte am Handy.</p>
        </a>
        <Link
          href={`/app/${venue.slug}/tische/drucken`}
          className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
        >
          <p className="font-semibold">QR-Codes drucken</p>
          <p className="mt-0.5 text-sm text-stone-600">Ein A4-Blatt mit Aufklebern für alle Tische.</p>
        </Link>
        <Link
          href={`/app/${venue.slug}`}
          className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
        >
          <p className="font-semibold">Zur Übersicht</p>
          <p className="mt-0.5 text-sm text-stone-600">Tische, Abo und Speisekarte verwalten.</p>
        </Link>
      </div>
    </>
  );
}
