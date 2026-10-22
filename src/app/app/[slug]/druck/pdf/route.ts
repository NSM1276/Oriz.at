import { NextResponse, type NextRequest } from "next/server";
import { getEntitlements } from "@/lib/entitlements-server";
import { loadDesignContext, recordPrinted, renderSheets } from "@/lib/print/design-server";
import { requireVenue } from "../../../venue";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The printable sheets in the venue's own design (Pro).
//   ?pages=all | changed | <sheetId>,<sheetId>      which sheets
//   ?lang=en                                        a language the venue offers
//   ?preview=1                                      look only: the sheets are NOT marked as printed
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  if (!(await getEntitlements(venue.id)).printDesign) {
    return NextResponse.json({ error: "Druck-Design ist Teil des Pro-Tarifs." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const ctx = await loadDesignContext(venue.slug, sp.get("lang"));
  if (!ctx || ctx.sheets.length === 0) return NextResponse.json({ error: "empty menu" }, { status: 409 });

  const which = sp.get("pages") ?? "all";
  const ids =
    which === "all"
      ? ctx.sheets.map((s) => s.id)
      : which === "changed"
        ? ctx.sheets.filter((s) => s.status !== "aktuell").map((s) => s.id)
        : ctx.sheets.filter((s) => which.split(",").includes(s.id)).map((s) => s.id);
  if (ids.length === 0) return NextResponse.json({ error: "Keine Blätter ausgewählt." }, { status: 409 });

  const { pdf } = await renderSheets(ctx, ids);
  if (sp.get("preview") !== "1") await recordPrinted(ctx, ids);

  const single = ids.length === 1 ? ctx.sheets.find((s) => s.id === ids[0])!.index : null;
  const file = `speisekarte-${venue.slug}${ctx.locale === "de" ? "" : `-${ctx.locale}`}${single ? `-blatt-${single}` : ""}-${ctx.today}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${file}"`, "cache-control": "private, no-store" },
  });
}
