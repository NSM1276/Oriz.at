import "server-only";
import { del, head, list, put } from "@vercel/blob";

// Photos live in the Vercel Blob store "oriz-photos" (Frankfurt), one folder per venue:
//   carta/<venue>/items/<item>-<stamp>.webp     the photo (≤ 1600 px, resized on the phone)
//   carta/<venue>/items/<item>-<stamp>.sm.webp  640 px copy for lists
//   carta/<venue>/items/<item>-<stamp>.orig.webp the owner's photo while an AI-styled one shows
//   carta/<venue>/logo-<stamp>.webp, cover-<stamp>.webp
// Every upload gets a new name (the stamp), so the CDN never serves a stale file; the old
// one is deleted right after. Auth is OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN), no static key.

const ACCESS = "public" as const;
const ONE_YEAR = 60 * 60 * 24 * 365;

export function isBlobUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);
}

/** A fresh, unique name under `dir`: "<dir>/<base>-<stamp>.webp". */
export function stampedPath(dir: string, base: string, ext = "webp"): string {
  return `${dir}/${base}-${Date.now().toString(36)}.${ext}`;
}

export async function putPublic(path: string, body: Buffer | Blob, contentType: string): Promise<string> {
  const res = await put(path, body, { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: ONE_YEAR });
  return res.url;
}

/** Deletes the given URLs; anything that is not ours is ignored, missing files are no error. */
export async function removeUrls(urls: (string | null | undefined)[]): Promise<void> {
  const ours = urls.filter(isBlobUrl);
  if (ours.length === 0) return;
  try { await del(ours); } catch (err) { console.error("[blob] del", err); }
}

/** Everything under a folder, e.g. "carta/<venue>/" when a venue goes. Returns how many went. */
export async function removePrefix(prefix: string): Promise<number> {
  let cursor: string | undefined;
  let n = 0;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    if (page.blobs.length > 0) {
      await del(page.blobs.map((b) => b.url));
      n += page.blobs.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return n;
}

export async function blobExists(url: string): Promise<boolean> {
  try { await head(url); return true; } catch { return false; }
}

/** The file behind one of our URLs. */
export async function fetchBlob(url: string): Promise<{ bytes: Buffer; type: string } | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return { bytes: Buffer.from(await res.arrayBuffer()), type: res.headers.get("content-type") ?? "application/octet-stream" };
}
