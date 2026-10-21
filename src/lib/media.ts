// Dish media can be a photo or a short clip (owners upload .mp4 loops).
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
