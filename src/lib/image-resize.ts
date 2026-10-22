// Client-side image processing for ORIZ photo uploads.
//
// Accepts any browser-supported format (JPG, PNG, WebP, HEIC on Safari…),
// auto-rotates by EXIF (drawing onto a canvas handles it automatically in
// modern browsers via createImageBitmap), downscales to a target max edge,
// and re-encodes as WebP. Owners upload 20 MB phone photos; what reaches
// storage is a few hundred KB, so guests and hosting never pay for the raw file.

const MAX_EDGE = 1600; // px on the longest side
const THUMB_EDGE = 640; // list rows and cards; the full photo only opens in the dish sheet
const QUALITIES = [0.82, 0.74, 0.66, 0.58];
const FULL_TARGET = 450 * 1024; // the server refuses anything over 1.5 MB
const THUMB_TARGET = 70 * 1024;
const MAX_INPUT_BYTES = 60 * 1024 * 1024;

export class PhotoError extends Error {}

export async function resizeToWebP(file: File): Promise<Blob> {
  const bitmap = await decode(file);
  try {
    return await encode(bitmap, MAX_EDGE, FULL_TARGET);
  } finally {
    bitmap.close?.();
  }
}

/** Full-size photo plus a small copy for menu lists, both WebP. */
export async function preparePhoto(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const bitmap = await decode(file);
  try {
    const full = await encode(bitmap, MAX_EDGE, FULL_TARGET);
    const thumb = await encode(bitmap, THUMB_EDGE, THUMB_TARGET);
    return { full, thumb };
  } finally {
    bitmap.close?.();
  }
}

async function decode(file: File): Promise<ImageBitmap> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new PhotoError("Das Foto ist größer als 60 MB. Bitte ein kleineres wählen.");
  }
  // createImageBitmap reads EXIF orientation and gives us an already-rotated bitmap.
  // imageOrientation: "from-image" makes this explicit; default is "none" in some browsers.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback path for browsers that don't support the option (Safari historically).
    // We load via <img> instead. EXIF rotation may be wrong on those browsers, but
    // result will still be a valid file at the right size.
    try {
      return await loadImageElement(file);
    } catch {
      const heic = /hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
      throw new PhotoError(
        heic
          ? "Dieser Browser kann HEIC-Fotos nicht öffnen. Bitte am iPhone hochladen oder als JPG speichern."
          : "Dieses Foto lässt sich nicht öffnen. Bitte ein JPG, PNG oder WebP wählen.",
      );
    }
  }
}

// Steps quality down until the file fits the target; a busy photo at q0.82
// can still be several MB at 1600 px.
async function encode(bitmap: ImageBitmap, edge: number, target: number): Promise<Blob> {
  const { width, height } = bitmap;
  const scale = Math.min(1, edge / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("Canvas 2D not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Browsers that cannot encode WebP silently hand back a PNG several MB large;
  // JPEG is the format every browser can write.
  let type = "image/webp";
  let blob: Blob | null = null;
  for (const q of QUALITIES) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
    if (!blob) throw new PhotoError("WebP encoding failed");
    if (blob.type !== type) {
      type = "image/jpeg";
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
      if (!blob) throw new PhotoError("JPEG encoding failed");
    }
    if (blob.size <= target) break;
  }
  // Release the canvas memory right away — phones hold several of these otherwise.
  canvas.width = canvas.height = 0;
  return blob!;
}

// Fallback bitmap loader for browsers without the imageOrientation option.
async function loadImageElement(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
