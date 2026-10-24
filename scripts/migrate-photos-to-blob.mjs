// One-off: moves dish photos into Vercel Blob (lib/blob.ts layout) and points the rows at them.
//   node scripts/migrate-photos-to-blob.mjs            dry run — lists what would move
//   node scripts/migrate-photos-to-blob.mjs --apply    uploads, updates items.image_url, writes scripts/photo-map.json
// Sources handled: Supabase Storage URLs (…supabase.co/storage/…) and site files ("/items/…jpg" under public/).
// External URLs (unsplash) and videos are left alone. Each photo is re-encoded: ≤ 1600 px WebP + 640 px copy.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const isSupabase = (u) => /supabase\.co\/storage\//.test(u);
const isLocal = (u) => /^\/items\//.test(u);
const isVideo = (u) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

async function load(url) {
  if (isLocal(url)) {
    const file = path.join(ROOT, "public", decodeURIComponent(url));
    if (!existsSync(file)) throw new Error(`missing file ${file}`);
    return readFileSync(file);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function encode(buf) {
  const img = sharp(buf, { failOn: "none" }).rotate();
  const full = await img.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const thumb = await img.clone().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  return { full, thumb };
}

const opts = { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/webp", cacheControlMaxAge: 60 * 60 * 24 * 365 };

const { data: items, error } = await db.from("items").select("id, venue_id, name, image_url, venues(slug)").not("image_url", "is", null);
if (error) throw error;
const todo = items.filter((it) => (isSupabase(it.image_url) || isLocal(it.image_url)) && !isVideo(it.image_url));
console.log(`${items.length} items with a photo, ${todo.length} to move${APPLY ? "" : " (dry run)"}`);

const map = {};
let bytesIn = 0, bytesOut = 0;
for (const it of todo) {
  const slug = Array.isArray(it.venues) ? it.venues[0]?.slug : it.venues?.slug;
  try {
    const src = await load(it.image_url);
    const { full, thumb } = await encode(src);
    bytesIn += src.length; bytesOut += full.length + thumb.length;
    const base = `carta/${it.venue_id}/items/${it.id}-${Date.now().toString(36)}`;
    if (APPLY) {
      const res = await put(`${base}.webp`, full, opts);
      await put(`${base}.sm.webp`, thumb, opts);
      const { error: upd } = await db.from("items").update({ image_url: res.url }).eq("id", it.id);
      if (upd) throw upd;
      map[it.image_url] = res.url;
    }
    console.log(`${slug} · ${it.name}: ${Math.round(src.length / 1024)} KB → ${Math.round(full.length / 1024)} + ${Math.round(thumb.length / 1024)} KB`);
  } catch (err) {
    console.error(`FEHLER ${slug} · ${it.name} (${it.image_url}): ${err.message ?? err}`);
  }
}
console.log(`in ${Math.round(bytesIn / 1024)} KB → out ${Math.round(bytesOut / 1024)} KB`);
if (APPLY) {
  writeFileSync(path.join(ROOT, "scripts", "photo-map.json"), JSON.stringify(map, null, 2));
  console.log(`map written: scripts/photo-map.json (${Object.keys(map).length} entries)`);
}
