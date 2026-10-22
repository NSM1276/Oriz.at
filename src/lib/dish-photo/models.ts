import "server-only";
import sharp from "sharp";

// The two model calls behind "Hintergrund verschönern". With FAL_KEY set they
// go to fal.ai (BiRefNet cuts the dish out, FLUX schnell paints an empty
// surface — a fraction of a cent per photo). Without it, outside production,
// a free stand-in runs instead so the whole flow can be tested without paying.

export const STYLES = {
  holz: {
    label: "Holztisch",
    prompt: "rustic dark oak wooden table top, warm brown wood grain, soft warm window light from the left",
    fallback: { r: 92, g: 62, b: 40 },
  },
  marmor: {
    label: "Marmor",
    prompt: "white Carrara marble table top with soft grey veins, bright soft daylight",
    fallback: { r: 226, g: 222, b: 216 },
  },
  schiefer: {
    label: "Schiefer",
    prompt: "dark slate stone table top, matte charcoal texture, moody low-key restaurant light",
    fallback: { r: 44, g: 46, b: 50 },
  },
  leinen: {
    label: "Leinen",
    prompt: "light beige linen tablecloth with gentle folds, airy natural morning light",
    fallback: { r: 214, g: 202, b: 182 },
  },
} as const;

export type StyleId = keyof typeof STYLES;

// The model is asked for the surface alone; the dish comes from the owner's photo.
const PROMPT_SUFFIX =
  ", empty surface with nothing on it, seen from slightly above like a food photo, shallow depth of field, " +
  "professional food photography backdrop, photorealistic, no food, no plate, no bowl, no glass, no cutlery, " +
  "no hands, no text, no logo";

export function modelsMode(): "fal" | "test" | "off" {
  if (process.env.FAL_KEY) return "fal";
  return process.env.NODE_ENV === "production" ? "off" : "test";
}

export async function cutOut(imageUrl: string, width: number, height: number): Promise<Buffer> {
  if (modelsMode() === "fal") {
    const out = await fal<{ image: { url: string } }>("fal-ai/birefnet/v2", {
      image_url: imageUrl,
      model: "General Use (Heavy)",
      operating_resolution: "1024x1024",
      output_format: "png",
      refine_foreground: false,
    });
    return download(out.image.url);
  }
  // Test stand-in: plates are round, so an ellipse in the middle.
  const svg =
    `<svg width="${width}" height="${height}"><ellipse cx="${width / 2}" cy="${height / 2}" ` +
    `rx="${width * 0.33}" ry="${height * 0.36}" fill="#fff"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function paintBackground(style: StyleId, width: number, height: number): Promise<Buffer> {
  if (modelsMode() === "fal") {
    const w = 1024;
    const h = Math.round((1024 * height) / width / 16) * 16;
    const out = await fal<{ images: { url: string }[] }>("fal-ai/flux/schnell", {
      prompt: STYLES[style].prompt + PROMPT_SUFFIX,
      image_size: { width: w, height: h },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    });
    return download(out.images[0].url);
  }
  // Test stand-in: the style's colour with a little grain.
  const c = STYLES[style].fallback;
  const grain = await sharp({
    create: { width, height, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 18 } },
  }).png().toBuffer();
  return sharp({ create: { width, height, channels: 3, background: c } })
    .composite([{ input: grain, blend: "soft-light" }])
    .png()
    .toBuffer();
}

async function fal<T>(model: string, input: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(50_000),
  });
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`download: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
