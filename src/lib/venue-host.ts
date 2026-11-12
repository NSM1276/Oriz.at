// Every restaurant's menu lives on its own address: belvedere.oriz.at (since 2026-11-12, before
// that oriz.at/belvedere). The slug is the subdomain, so a new venue needs no setup of its own:
// *.oriz.at points at us once, and the proxy maps the host back to the /<slug> pages.
// No runtime imports besides slug.ts — unit-tested.
import { slugProblem } from "./slug.ts";

export const VENUE_DOMAIN = "oriz.at";

/** Pages a guest may open under a venue besides the menu itself (src/app/[venueSlug]/*). */
const GUEST_SUBPATHS = new Set(["print", "profile"]);

/** "https://belvedere.oriz.at" — the menu's own address, for QR codes, links and search engines. */
export function venueUrl(slug: string): string {
  return `https://${slug}.${VENUE_DOMAIN}`;
}

/** "belvedere.oriz.at" — the same, short enough to print or show. */
export function venueHost(slug: string): string {
  return `${slug}.${VENUE_DOMAIN}`;
}

/** The venue a host belongs to: "belvedere.oriz.at" → "belvedere"; "belvedere.localhost:3000" for local tests. */
export function slugFromHost(host: string): string | null {
  const m = /^([^.]+)\.(?:oriz\.at|localhost)$/.exec(host.toLowerCase().replace(/:\d+$/, ""));
  return m && slugProblem(m[1]) === null ? m[1] : null;
}

export type HostRoute = { kind: "pass" } | { kind: "rewrite"; path: string } | { kind: "redirect"; path: string; main?: boolean };

/**
 * A request on a venue's subdomain:
 *   /               → the menu (/<slug>)
 *   /profile        → /<slug>/profile
 *   /<slug>/…       → redirect to the short form (old in-page links)
 *   /api, /t, files → as they are
 *   anything else   → the main site (admin, sign-up, legal pages)
 */
export function routeVenueHost(slug: string, path: string): HostRoute {
  if (path.startsWith("/_next/") || path.startsWith("/api/") || path.startsWith("/t/")) return { kind: "pass" };
  const parts = path.split("/").filter(Boolean);
  if (parts.length > 0 && parts[parts.length - 1].includes(".")) return { kind: "pass" }; // robots.txt, icons
  if (parts.length === 0) return { kind: "rewrite", path: `/${slug}` };
  if (parts[0] === slug) return { kind: "redirect", path: `/${parts.slice(1).join("/")}` };
  if (parts.length === 1 && GUEST_SUBPATHS.has(parts[0])) return { kind: "rewrite", path: `/${slug}/${parts[0]}` };
  return { kind: "redirect", path, main: true };
}

/** An old oriz.at/<slug>[/profile] link: where it lives now, or null when the path is no guest page. */
export function movedGuestPage(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;
  if (slugProblem(parts[0]) !== null) return null;
  if (parts.length === 2 && !GUEST_SUBPATHS.has(parts[1])) return null;
  return parts.length === 2 ? `${venueUrl(parts[0])}/${parts[1]}` : venueUrl(parts[0]);
}
