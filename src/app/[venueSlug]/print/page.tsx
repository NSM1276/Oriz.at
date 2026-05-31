import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { PrintButton } from "@/components/menu/PrintButton";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { Item, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

type Row = Venue & { logo_svg?: string | null; sections: (Section & { items: Item[] })[] };

export default async function PrintPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, owner_id, created_at, sections(id, name, position, items(id, name, description, price_cents, allergens, is_active, position))",
    )
    .eq("slug", venueSlug)
    .maybeSingle<Row>();

  if (!data) notFound();

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? [])
        .filter((i) => i.is_active)
        .sort((a, b) => a.position - b.position),
    }))
    .filter((s) => s.items.length > 0);

  const accent = data.color_primary ?? "#C69B3C";
  const menuUrl = `https://oriz.at/${venueSlug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=0a0a0a&margin=1`;

  return (
    <>
      {/* Print button — fixed on screen, hidden when printing */}
      <div className="no-print fixed bottom-6 right-6 z-50">
        <PrintButton />
      </div>

      <div className="min-h-screen bg-white">
        <div className="max-w-[680px] mx-auto px-12 py-14">

          {/* Header */}
          <header className="text-center mb-10">
            <div className="flex justify-center">
              <VenueLogo
                svg={data.logo_svg}
                url={data.logo_url}
                name={data.name}
                color="auto"
                bg="#FFFFFF"
                accent={data.color_primary}
                height={112}
                isDarkBg={false}
              />
            </div>
            {data.about && (
              <p
                className="font-display italic text-base mt-5 max-w-sm mx-auto leading-relaxed"
                style={{ color: "rgba(10,10,10,0.55)" }}
              >
                {data.about}
              </p>
            )}
            <div
              className="w-20 h-px mx-auto mt-7"
              style={{ backgroundColor: accent }}
            />
          </header>

          {/* Menu sections */}
          {sections.map((section) => (
            <section key={section.id} className="mt-9">
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="font-sans text-[10px] tracking-regal uppercase shrink-0"
                  style={{ color: accent }}
                >
                  {section.name}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(10,10,10,0.10)" }} />
              </div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-baseline gap-4 py-2.5"
                  style={{ borderBottom: "1px solid rgba(10,10,10,0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-lg" style={{ color: "#0A0A0A" }}>
                      {item.name}
                    </span>
                    {item.description && (
                      <p
                        className="font-sans text-xs mt-0.5 leading-snug"
                        style={{ color: "rgba(10,10,10,0.50)" }}
                      >
                        {item.description}
                      </p>
                    )}
                    {item.allergens?.trim() && (
                      <p
                        className="font-sans text-[10px] mt-0.5"
                        style={{ color: "rgba(10,10,10,0.35)" }}
                      >
                        Allergene: {item.allergens}
                      </p>
                    )}
                  </div>
                  <span
                    className="font-sans tabular-nums text-base shrink-0"
                    style={{ color: "#0A0A0A" }}
                  >
                    {formatPrice(item.price_cents, data.currency)}
                  </span>
                </div>
              ))}
            </section>
          ))}

          {/* Footer — QR + ORIZ branding */}
          <footer className="mt-16 pt-8 flex items-end justify-between gap-8"
            style={{ borderTop: "1px solid rgba(10,10,10,0.08)" }}>
            <div>
              <div
                className="font-sans text-[10px] tracking-regal uppercase mb-1"
                style={{ color: "rgba(10,10,10,0.35)" }}
              >
                Digitales Menü
              </div>
              <div className="font-sans text-sm" style={{ color: "rgba(10,10,10,0.55)" }}>
                {menuUrl}
              </div>
              <div
                className="mt-6 font-sans text-[9px] tracking-regal uppercase"
                style={{ color: "rgba(10,10,10,0.25)" }}
              >
                Powered by ORIZ · oriz.at
              </div>
            </div>
            <div className="text-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code" width={90} height={90} />
              <div
                className="font-sans text-[9px] mt-1.5 tracking-regal uppercase"
                style={{ color: "rgba(10,10,10,0.35)" }}
              >
                Scan me
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}
