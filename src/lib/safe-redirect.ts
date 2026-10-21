// Turns a ?next= value into a path on this site, or the fallback.
//
// Prefix checks alone miss tricks the URL parser undoes later: "/\evil.com",
// "/<tab>/evil.com" (tabs and newlines are stripped) or "/.//evil.com"
// (dot segments collapse to "//evil.com"). So we let the parser resolve the
// value against a placeholder origin and only keep it if it stayed there.

const BASE = "https://oriz.invalid";

export function safeNextPath(raw: string | null | undefined, fallback = "/admin"): string {
  if (!raw || !raw.startsWith("/")) return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;

  const path = url.pathname + url.search + url.hash;
  // A path that still begins with "//" would be read as another host next time.
  return path.startsWith("//") ? fallback : path;
}
