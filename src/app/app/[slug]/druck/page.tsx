import { notFound } from "next/navigation";
import { getEntitlements } from "@/lib/entitlements-server";
import { COLOR_PRESETS } from "@/lib/colorPresets";
import { accentChoices } from "@/lib/print/design";
import { loadDesignContext, sheetPageCounts } from "@/lib/print/design-server";
import { formatDay } from "@/lib/print/pages";
import { requireVenue } from "../../venue";
import { UpgradeCard } from "../UpgradeCard";
import { DruckEditor, type SheetView } from "./DruckEditor";
import { serviceClient } from "@/lib/auth";
import { cleanLocales, LOCALE_NAMES } from "@/lib/menu-edit";

export const dynamic = "force-dynamic";

// Print design (Pro): the look, which sections sit on which sheet, and what needs reprinting.
export default async function DruckPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { venue } = await requireVenue(slug);
  if (!(await getEntitlements(venue.id)).printDesign) return <UpgradeCard feature="printDesign" venueName={venue.name} />;

  const ctx = await loadDesignContext(venue.slug, sp.lang ?? null);
  if (!ctx) notFound();
  if (ctx.sheets.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-xl font-semibold">Druck-Design</h1>
        <p className="mt-2 text-stone-600">Sobald Gerichte in Ihrer Karte stehen, können Sie hier Blätter zum Drucken gestalten.</p>
      </section>
    );
  }

  const [counts, { data: v }] = await Promise.all([
    sheetPageCounts(ctx),
    serviceClient().from("venues").select("color_primary, enabled_locales").eq("id", venue.id).single<{ color_primary: string | null; enabled_locales: string[] | null }>(),
  ]);

  const sheets: SheetView[] = ctx.sheets.map((s) => ({
    id: s.id,
    index: s.index,
    virtual: s.virtual,
    status: s.status,
    stand: formatDay(s.state.changedAt, "de-AT"),
    printed: s.state.printedAt ? formatDay(s.state.printedAt, "de-AT") : null,
    pagesNeeded: counts[s.id] ?? 1,
    sections: s.sections.map((sec) => ({ id: sec.id, name: sec.name, items: sec.items.length })),
  }));

  const locales = cleanLocales(v?.enabled_locales ?? []);
  return (
    <DruckEditor
      slug={venue.slug}
      locale={ctx.locale}
      languages={[{ id: "de", name: "Deutsch" }, ...locales.map((l) => ({ id: l, name: LOCALE_NAMES[l] }))]}
      design={ctx.design}
      accent={ctx.accent}
      venueColor={v?.color_primary ?? null}
      swatches={accentChoices(v?.color_primary, COLOR_PRESETS.map((p) => p.color_primary))}
      sheets={sheets}
    />
  );
}
