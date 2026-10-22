import "server-only";
import sharp from "sharp";

// Puts the owner's own dish onto a new background. The models only ever
// produce two inputs — a mask ("where is the dish") and an empty surface —
// and the dish itself is copied from the original photo: wherever the mask is
// solid, the output pixel is the original pixel, unchanged. The light changes
// (blur, brightness, vignette, shadow) touch the background only.

export type Rgb = { r: number; g: number; b: number };

/** Mask as one 8-bit channel the size of the photo; 255 = dish. */
export async function maskFromCutout(cutoutPng: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(cutoutPng)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer();
}

/** Share of the photo the mask covers, 0..1. */
export function maskCoverage(mask: Buffer): number {
  let solid = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] > 127) solid++;
  return solid / mask.length;
}

export async function composeDish(opts: {
  original: Buffer;
  mask: Buffer; // raw, 1 channel, same size as original
  background: Buffer;
  width: number;
  height: number;
}): Promise<Buffer> {
  const { original, mask, background, width, height } = opts;
  const raw = { width, height, channels: 1 as const };

  // Background: fill the frame, soft focus like a real lens, a touch brighter
  // in the middle and darker at the edges so the eye goes to the plate.
  const vignette = Buffer.from(
    `<svg width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="48%" r="75%">` +
      `<stop offset="55%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.38"/>` +
      `</radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`,
  );
  const bg = await sharp(background)
    .resize(width, height, { fit: "cover" })
    .blur(Math.max(1, Math.round(width / 500)))
    .modulate({ brightness: 1.03 })
    .composite([{ input: vignette, blend: "multiply" }])
    .removeAlpha()
    .toBuffer();

  // Contact shadow: the dish's own outline, blurred and nudged down-right.
  const shadowAlpha = await sharp(mask, { raw })
    .blur(Math.max(4, Math.round(width / 60)))
    .linear(0.42, 0)
    .toBuffer();
  const shadow = await sharp({ create: { width, height, channels: 3, background: { r: 20, g: 14, b: 8 } } })
    .joinChannel(shadowAlpha, { raw })
    .png()
    .toBuffer();
  const dx = Math.round(width * 0.012);
  const dy = Math.round(height * 0.02);

  // The dish: original pixels, with the mask as transparency. Two pipelines on
  // purpose — sharp runs removeAlpha after joinChannel within one, which would
  // drop the mask again and cover the new background with the old photo.
  const rgb = await sharp(original).resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const dish = await sharp(rgb, { raw: { width, height, channels: 3 } })
    .joinChannel(mask, { raw })
    .png()
    .toBuffer();

  return sharp(bg)
    .composite([
      { input: shadow, left: dx, top: dy },
      { input: dish, left: 0, top: 0 },
    ])
    .webp({ quality: 90 })
    .toBuffer();
}

/** Small copy for menu lists, same as the browser makes on upload. */
export function toThumb(webp: Buffer): Promise<Buffer> {
  return sharp(webp).resize(640, 640, { fit: "inside" }).webp({ quality: 74 }).toBuffer();
}
