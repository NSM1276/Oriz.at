import Link from "next/link";
import QRCode from "qrcode";
import { serviceClient } from "@/lib/auth";
import { allowedLocales } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { cleanLocales } from "@/lib/menu-edit";
import { profileChecklist, type Hours } from "@/lib/venue-profile";
import { requireVenue } from "../../venue";
import { Progress } from "../ui";
import { AppearanceForm, ContactForm, HoursForm, LinksForm, SharePanel } from "./LokalForms";
import { venueUrl } from "@/lib/venue-host";

export const dynamic = "force-dynamic";

// Everything about the place itself, apart from the menu: what guests see under "Info" and on
// top of the menu. One part at a time (tabs), so nothing has to be searched by scrolling.

const PARTS = [
  { id: "auftritt", label: "Auftritt" },
  { id: "kontakt", label: "Kontakt" },
  { id: "zeiten", label: "Zeiten" },
  { id: "links", label: "Links" },
  { id: "teilen", label: "Teilen" },
] as const;
type Part = (typeof PARTS)[number]["id"];

type Row = {
  about: string | null;
  cover_url: string | null;
  gallery: string[] | null;
  phone: string | null;
  address: string | null;
  google_maps_url: string | null;
  price_range: string | null;
  opening_hours: Hours | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  google_review_url: string | null;
  tripadvisor_url: string | null;
  enabled_locales: string[] | null;
  translations: Record<string, { about?: string }> | null;
};

export default async function LokalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ teil?: string }> }) {
  const { slug } = await params;
  const teil = (await searchParams).teil;
  const part: Part = PARTS.some((p) => p.id === teil) ? (teil as Part) : "auftritt";
  const { venue } = await requireVenue(slug);

  const [{ data: v }, ent] = await Promise.all([
    serviceClient()
      .from("venues")
      .select("about, cover_url, gallery, phone, address, google_maps_url, price_range, opening_hours, website_url, instagram_url, facebook_url, google_review_url, tripadvisor_url, enabled_locales, translations")
      .eq("id", venue.id)
      .single<Row>(),
    getEntitlements(venue.id),
  ]);
  if (!v) return null;

  const checks = profileChecklist(v);
  const done = checks.filter((c) => c.done).length;
  const missing = checks.filter((c) => !c.done);
  const locales = cleanLocales(v.enabled_locales ?? [], allowedLocales(ent));
  const menuUrl = venueUrl(venue.slug);
  const base = `/app/${venue.slug}/lokal`;

  return (
    <div className="space-y-4">
      {done < checks.length && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Ihr Lokal ist zu {Math.round((done / checks.length) * 100)} % vollständig</p>
            <span className="shrink-0 whitespace-nowrap text-sm tabular-nums text-stone-600">{done} / {checks.length}</span>
          </div>
          <div className="mt-3"><Progress value={done} max={checks.length} /></div>
          <p className="mt-3 text-sm text-stone-600">
            Es fehlt noch:{" "}
            {missing.map((c, i) => (
              <span key={c.key}>
                {i > 0 && ", "}
                <Link href={`${base}?teil=${c.part}`} className="font-medium text-stone-900 underline underline-offset-2">{c.label}</Link>
              </span>
            ))}
          </p>
        </section>
      )}

      <nav className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200" aria-label="Bereiche des Lokals">
        {PARTS.map((p) => (
          <Link
            key={p.id}
            href={`${base}?teil=${p.id}`}
            aria-current={p.id === part ? "page" : undefined}
            scroll={false}
            className={`relative flex min-h-10 items-center justify-center rounded-xl px-1 text-[13px] font-medium ${p.id === part ? "bg-stone-900 text-white" : "text-stone-700"}`}
          >
            {p.label}
            {checks.some((c) => c.part === p.id && !c.done) && <span aria-label="unvollständig" className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
          </Link>
        ))}
      </nav>

      {part === "auftritt" && (
        <AppearanceForm
          slug={venue.slug}
          venueId={venue.id}
          cover={v.cover_url}
          gallery={v.gallery ?? []}
          about={v.about ?? ""}
          locales={locales}
          translations={Object.fromEntries(locales.map((l) => [l, v.translations?.[l]?.about ?? ""]))}
        />
      )}
      {part === "kontakt" && (
        <ContactForm slug={venue.slug} phone={v.phone ?? ""} address={v.address ?? ""} mapsUrl={v.google_maps_url ?? ""} priceRange={v.price_range ?? ""} />
      )}
      {part === "zeiten" && <HoursForm slug={venue.slug} hours={v.opening_hours} />}
      {part === "links" && (
        <LinksForm
          slug={venue.slug}
          website={v.website_url ?? ""}
          instagram={v.instagram_url ?? ""}
          facebook={v.facebook_url ?? ""}
          googleReview={v.google_review_url ?? ""}
          tripadvisor={v.tripadvisor_url ?? ""}
        />
      )}
      {part === "teilen" && (
        <SharePanel url={menuUrl} name={venue.name} qrSvg={await QRCode.toString(menuUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M" })} />
      )}
    </div>
  );
}
