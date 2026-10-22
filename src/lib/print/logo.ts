import "server-only";
import { fingerprint } from "./pages.ts";
import { prepareLogoSvg } from "./logo-svg.ts";
import type { SheetLogo } from "./doc-design.ts";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

type VenueLogoFields = { logo_svg?: string | null; logo_url?: string | null };

/**
 * The venue's logo as the PDF needs it, plus a key that changes when the logo changes
 * (a changed logo means every printed sheet is out of date).
 * Pictures are fetched only from our own storage and turned into PNG; anything odd means
 * "no logo": the sheet then shows the venue name as text.
 */
export async function loadLogo(venue: VenueLogoFields, color: string): Promise<{ logo: SheetLogo; key: string | null }> {
  if (venue.logo_svg) {
    const svg = prepareLogoSvg(venue.logo_svg, color);
    if (svg) return { logo: { kind: "svg", svg }, key: `svg:${fingerprint(venue.logo_svg)}:${color}` };
  }
  if (venue.logo_url && ownStorage(venue.logo_url)) {
    try {
      const res = await fetch(venue.logo_url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES) {
          // Loaded only when a picture logo needs converting: a problem with this native library
          // must never take the whole PDF down (the name is printed instead).
          const { default: sharp } = await import("sharp");
          const png = await sharp(bytes).resize({ width: 900, withoutEnlargement: true }).png().toBuffer();
          return { logo: { kind: "image", dataUrl: `data:image/png;base64,${png.toString("base64")}` }, key: `img:${venue.logo_url}` };
        }
      }
    } catch {
      // fall through: the name is printed instead
    }
  }
  return { logo: null, key: null };
}

function ownStorage(url: string): boolean {
  try {
    const u = new URL(url);
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return u.protocol === "https:" && !!base && u.host === new URL(base).host;
  } catch {
    return false;
  }
}
