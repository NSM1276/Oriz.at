"use client";

// Client-side image pipeline: validate → compress → upload to Supabase Storage.
// All sizing happens on the user's device (no bandwidth wasted, no server CPU).

import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_RAW_BYTES = 8 * 1024 * 1024;      // refuse > 8 MB upload
const MAX_DIMENSION = 1200;                  // longest side after resize
const TARGET_BYTES  = 200 * 1024;            // try to land under 200 KB
const ABSOLUTE_MAX  = 500 * 1024;            // hard ceiling, fail if exceeded
const QUALITIES     = [0.82, 0.72, 0.62, 0.5];

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageUploadError extends Error {}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file); } catch { /* fall through */ }
  }
  // Fallback for older browsers
  return await new Promise<ImageBitmap>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const bm = await createImageBitmap(img);
        URL.revokeObjectURL(url);
        resolve(bm);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode failed")); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("encode failed")),
      type,
      quality,
    );
  });
}

export async function compressImage(file: File): Promise<Blob> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ImageUploadError("Nur JPEG, PNG oder WebP erlaubt.");
  }
  if (file.size > MAX_RAW_BYTES) {
    throw new ImageUploadError("Datei zu groß (max. 8 MB).");
  }

  const bitmap = await fileToBitmap(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageUploadError("Canvas nicht verfügbar.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // Try WebP at descending quality until small enough.
  let best: Blob | null = null;
  for (const q of QUALITIES) {
    const blob = await canvasToBlob(canvas, "image/webp", q);
    best = blob;
    if (blob.size <= TARGET_BYTES) break;
  }
  if (!best) throw new ImageUploadError("Komprimierung fehlgeschlagen.");
  if (best.size > ABSOLUTE_MAX) {
    throw new ImageUploadError("Bild konnte nicht ausreichend komprimiert werden.");
  }
  return best;
}

export async function uploadItemImage(opts: {
  supabase: SupabaseClient;
  file: File;
  venueId: string;
  itemId: string;
  previousUrl?: string | null;
}): Promise<string> {
  const { supabase, file, venueId, itemId, previousUrl } = opts;
  const blob = await compressImage(file);

  const filename = `${itemId}-${Date.now()}.webp`;
  const path = `${venueId}/${filename}`;

  const { error: upErr } = await supabase.storage
    .from("item-images")
    .upload(path, blob, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000, immutable",
    });

  if (upErr) throw new ImageUploadError(upErr.message);

  const { data } = supabase.storage.from("item-images").getPublicUrl(path);
  const url = data.publicUrl;

  // Best-effort delete of the previous photo (don't block if it fails).
  if (previousUrl) {
    const oldPath = extractStoragePath(previousUrl);
    if (oldPath) {
      supabase.storage.from("item-images").remove([oldPath]).catch(() => { /* ignore */ });
    }
  }

  return url;
}

export function extractStoragePath(publicUrl: string): string | null {
  // Public URL shape:
  //   https://<ref>.supabase.co/storage/v1/object/public/item-images/<venueId>/<filename>
  const marker = "/object/public/item-images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
