// Dish media can be a photo or a short clip (owners upload .mp4 loops).
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

// Uploaded photos live at carta/<venue>/items/<item>-<stamp>.webp (see lib/blob.ts). Next to each one:
//   ….sm.webp    640 px copy for menu lists (a 1600 px photo per row
//                would make every guest download several MB)
//   ….orig.webp  the owner's photo, kept while an AI-styled version is shown
// The same suffixes work on a storage path and on a public URL.
export function thumbPath(path: string): string {
  return path.replace(/\.webp(\?|$)/, ".sm.webp$1");
}

export function originalPath(path: string): string {
  return path.replace(/\.webp(\?|$)/, ".orig.webp$1");
}

function isUploadedPhoto(url: string): boolean {
  return /\/items\/[^/?]+\.webp(\?|$)/.test(url) && !/\.(sm|orig)\.webp/.test(url);
}

/** Small copy of an uploaded photo; other URLs (videos, old seed images) unchanged. */
export function thumbUrl(url: string): string {
  return isUploadedPhoto(url) ? thumbPath(url) : url;
}

/** The kept original next to an uploaded photo; other URLs unchanged. */
export function originalUrl(url: string): string {
  return isUploadedPhoto(url) ? originalPath(url) : url;
}
