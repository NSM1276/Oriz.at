// Getting a stored logo SVG ready for the PDF. Pure — unit-tested.
//
// Logos are stored with every colour replaced by `currentColor` (see svg-normalize), so the
// digital menu can recolour them. On paper the logo is drawn in one chosen colour.

const HEX = /^#[0-9A-Fa-f]{6}$/;

function num(v: string | undefined): number | null {
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Replaces currentColor with `color` and makes sure the root element has a width and a height,
 * which the PDF renderer needs to size the drawing (stored logos often only carry a viewBox).
 * Returns null when the text is not an SVG the renderer can size.
 */
export function prepareLogoSvg(svg: string, color: string): string | null {
  if (!HEX.test(color)) return null;
  const open = svg.match(/<svg\b([^>]*)>/i);
  if (!open) return null;
  let attrs = open[1];

  const w = num(attrs.match(/\swidth\s*=\s*["']?([\d.]+)/i)?.[1]);
  const h = num(attrs.match(/\sheight\s*=\s*["']?([\d.]+)/i)?.[1]);
  if (!w || !h) {
    const vb = attrs.match(/viewBox\s*=\s*["']\s*([-\d.\s,]+)["']/i)?.[1]?.trim().split(/[\s,]+/).map(Number);
    if (!vb || vb.length !== 4 || !(vb[2] > 0) || !(vb[3] > 0)) return null;
    attrs = attrs.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, "");
    attrs += ` width="${vb[2]}" height="${vb[3]}"`;
  }
  // The on-screen height style (added when the logo is shown on a page) means nothing on paper.
  attrs = attrs.replace(/\sstyle\s*=\s*"[^"]*"/gi, "").replace(/\sstyle\s*=\s*'[^']*'/gi, "");

  const rebuilt = svg.replace(/<svg\b[^>]*>/i, `<svg${attrs}>`);
  return rebuilt.replace(/currentColor/gi, color);
}
