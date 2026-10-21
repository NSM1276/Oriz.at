import QRCode from "qrcode";
import { serviceClient } from "@/lib/auth";
import { compareTables, tableDisplayName, tableUrl } from "@/lib/tables";
import { requireVenue } from "../../../venue";
import { PrintButton } from "./PrintButton";

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

  let query = serviceClient()
    .from("venue_tables")
    .select("id, label, zone, code, is_active, position")
    .eq("venue_id", venue.id)
    .eq("is_active", true);
  if (id) query = query.eq("id", id);
  const { data } = await query.returns<Row[]>();
  const tables = (data ?? []).sort(compareTables);

  // Generated here, not by a third-party QR service: a printed sticker must
  // never depend on someone else's server being up.
  const stickers = await Promise.all(
    tables.map(async (t) => ({
      ...t,
      svg: await QRCode.toString(tableUrl(t.code), { type: "svg", margin: 2, errorCorrectionLevel: "M" }),
    })),
  );

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          html, body { background: #fff !important; }
          main { max-width: none !important; padding: 0 !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="font-semibold">
            {stickers.length} Aufkleber zum Drucken
          </p>
          <p className="text-sm text-stone-600">A4, sechs pro Seite. Ausgeschaltete Tische sind nicht dabei.</p>
        </div>
        {stickers.length > 0 && <PrintButton />}
      </div>

      {stickers.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-stone-600 ring-1 ring-stone-200">
          Keine aktiven Tische zum Drucken.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-[6mm]">
          {stickers.map((t) => (
            <article
              key={t.id}
              className="flex flex-col items-center rounded-2xl bg-white p-6 text-center text-black ring-1 ring-stone-300 [break-inside:avoid] print:h-[88mm] print:justify-center print:rounded-[4mm] print:p-[5mm] print:ring-[0.3mm]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{venue.name}</p>
              <div
                className="mt-3 w-44 print:mt-[2mm] print:w-[50mm] [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: t.svg }}
              />
              <p className="mt-2 text-2xl font-semibold print:mt-[1mm]">{tableDisplayName(t.label)}</p>
              <p className="mt-1 text-sm text-stone-600">Speisekarte &amp; Service · Menu &amp; service</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
