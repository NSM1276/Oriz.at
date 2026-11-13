// Our two brand fonts for generated images (QR sticker, link preview). next/og draws with its own
// default font unless it is handed font files, so we fetch them from Google Fonts — the same fonts
// the pages use (next/font). If the fetch fails, the image still renders with the default font.

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" };

async function load(family: string, weight: 400 | 500 | 600, text: string): Promise<ArrayBuffer | null> {
  try {
    // Without a browser user agent Google answers with TrueType, which next/og can read.
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Inter (text) and Cormorant Garamond (headings), only the letters `text` needs. */
export async function brandFonts(text: string): Promise<OgFont[]> {
  const [inter, interSemi, garamond] = await Promise.all([
    load("Inter", 400, text),
    load("Inter", 600, text),
    load("Cormorant Garamond", 500, text),
  ]);
  const fonts: OgFont[] = [];
  if (inter) fonts.push({ name: "Inter", data: inter, weight: 400, style: "normal" });
  if (interSemi) fonts.push({ name: "Inter", data: interSemi, weight: 600, style: "normal" });
  if (garamond) fonts.push({ name: "Cormorant Garamond", data: garamond, weight: 500, style: "normal" });
  return fonts;
}
