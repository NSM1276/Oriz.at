import { NextResponse, type NextRequest } from "next/server";
import { loadMenuPayload } from "@/lib/menu-loader";
import { buildPrintModel } from "@/lib/print/model";
import { renderMenuPdf } from "@/lib/print/render";
import { requireVenue } from "../../../venue";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The printable menu as a PDF, for the venue's own team. GET /app/<slug>/speisekarte/pdf?lang=en
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);

  const payload = await loadMenuPayload(venue.slug);
  if (!payload) return NextResponse.json({ error: "not found" }, { status: 404 });

  const model = buildPrintModel(
    { venue: payload.venue, sections: payload.sections as never },
    req.nextUrl.searchParams.get("lang"),
    new Date(),
  );
  if (model.sections.length === 0) return NextResponse.json({ error: "empty menu" }, { status: 409 });

  const pdf = await renderMenuPdf(model);
  const day = new Date().toISOString().slice(0, 10);
  const file = `speisekarte-${venue.slug}${model.locale === "de" ? "" : `-${model.locale}`}-${day}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${file}"`,
      "cache-control": "private, no-store",
    },
  });
}
