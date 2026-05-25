// Client-side image processing for ORIZ photo uploads.
//
// Accepts any browser-supported format (JPG, PNG, WebP, HEIC on Safari…),
// auto-rotates by EXIF (drawing onto a canvas handles it automatically in
// modern browsers via createImageBitmap), downscales to a target max edge,
// and re-encodes as WebP at quality 0.82.
//
// Result is a Blob ready to POST. Typical 4 MB phone JPG → ~250 KB WebP.

const MAX_EDGE = 1600; // px on the longest side
const QUALITY = 0.82;

export async function resizeToWebP(file: File): Promise<Blob> {
  // createImageBitmap reads EXIF orientation and gives us an already-rotated bitmap.
  // imageOrientation: "from-image" makes this explicit; default is "none" in some browsers.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback path for browsers that don't support the option (Safari historically).
    // We load via <img> instead. EXIF rotation may be wrong on those browsers, but
    // result will still be a valid file at the right size.
    bitmap = await loadImageElement(file);
  }

  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) throw new Error("WebP encoding failed");
  return blob;
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
