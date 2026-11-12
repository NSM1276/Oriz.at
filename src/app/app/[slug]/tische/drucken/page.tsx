import QRCode from "qrcode";
import { serviceClient } from "@/lib/auth";
import { compareTables, tableUrl } from "@/lib/tables";
import { requireVenue } from "../../../venue";
import { StickerPicker } from "./StickerPicker";

export const dynamic = "force-dynamic";

type Row = { id: string; label: string; zone: string | null; code: string; is_active: boolean; position: number };

export default async function PrintTablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;
  const { venue } = await requireVenue(slug);

  // All active tables; the picker on the page decides which ones and how many.
  const { data } = await serviceClient()
    .from("venue_tables")
    .select("id, label, zone, code, is_active, position")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .returns<Row[]>();
  const tables = (data ?? []).sort(compareTables);

  // Generated here, not by a third-party QR service: a printed sticker must
  // never depend on someone else's server being up.
  const stickers = await Promise.all(
    tables.map(async (t) => ({
      id: t.id,
      label: t.label,
      zone: t.zone,
      svg: await QRCode.toString(tableUrl(t.code), { type: "svg", margin: 2, errorCorrectionLevel: "M" }),
    })),
  );

  if (stickers.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-5 text-sm text-stone-600 ring-1 ring-stone-200">
        Keine aktiven Tische zum Drucken.
      </p>
    );
  }

  return <StickerPicker venueName={venue.name} tables={stickers} initialId={id && stickers.some((s) => s.id === id) ? id : null} />;
}
