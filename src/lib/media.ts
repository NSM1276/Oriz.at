// Dish media can be a photo or a short clip (owners upload .mp4 loops).
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

// Uploaded photos live at carta/<venue>/items/<item>.webp. Next to each one:
//   <item>.sm.webp    640 px copy for menu lists (a 1600 px photo per row
//                     would make every guest download several MB)
//   <item>.orig.webp  the owner's photo, kept while an AI-styled version is shown
export function thumbPath(path: string): string {
  return path.replace(/\.webp$/, ".sm.webp");
}

export function originalPath(path: string): string {
  return path.replace(/\.webp$/, ".orig.webp");
}

/** Small copy of an uploaded photo; other URLs (videos, old seed images) unchanged. */
export function thumbUrl(url: string): string {
  return /\/oriz-photos\/.+\/items\/[^/?]+\.webp(\?|$)/.test(url) && !/\.(sm|orig)\.webp/.test(url)
    ? url.replace(/\.webp(\?|$)/, ".sm.webp$1")
    : url;
}
