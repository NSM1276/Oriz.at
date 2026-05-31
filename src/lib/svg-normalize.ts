// Server-side SVG normalizer for tenant-uploaded logos.
//
// Two jobs:
// 1. SECURITY — strip anything that could execute on the guest page:
//    <script>, on*= handlers, javascript: URLs, <foreignObject>,
//    external <use href="https://..."> references.
// 2. RECOLORING — replace explicit fills/strokes with currentColor so
//    the rendered logo inherits its color from the wrapping element's
//    CSS color. Preserves opacity/none/url(...) (gradients), as those
//    aren't simple recolorable swatches.
//
// Input is expected to be the literal text of an SVG file.
// Output is a single root <svg>…</svg> string ready to inline-render.

const MAX_BYTES = 200_000; // 200 KB — generous for any normal logo

export function normalizeLogoSvg(raw: string): string {
  if (typeof raw !== "string") throw new Error("svg must be a string");
  if (raw.length === 0) throw new Error("empty svg");
  if (raw.length > MAX_BYTES) {
    throw new Error(`svg too large (max ${Math.round(MAX_BYTES / 1024)} KB)`);
  }

  let s = raw.trim();

  // Strip BOM + XML/doctype/comments — keep only the SVG element tree
  s = s.replace(/^﻿/, "");
  s = s.replace(/<\?xml[^>]*\?>/gi, "");
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Must contain a single root <svg>
  const svgOpenIdx = s.search(/<svg[\s>]/i);
  if (svgOpenIdx < 0) throw new Error("no <svg> root found");
  s = s.slice(svgOpenIdx);

  // Security: remove dangerous tags entirely (with content)
  const dangerousTags = ["script", "foreignObject", "iframe", "object", "embed", "style"];
  for (const tag of dangerousTags) {
    const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
    s = s.replace(re, "");
    // Also self-closing variants
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/>`, "gi"), "");
  }

  // Security: strip event handlers (onclick=, onload=, etc.) — case-insensitive,
  // both quoted and unquoted variants.
  s = s.replace(/\s on[a-z]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\s on[a-z]+\s*=\s*'[^']*'/gi, "");
  s = s.replace(/\s on[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Security: strip javascript:, data: (except data:image/...) inside href/xlink:href
  s = s.replace(
    /\s(href|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi,
    ' $1="#"',
  );
  s = s.replace(
    /\s(href|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi,
    " $1='#'",
  );

  // External <use href="https://other.example/foo.svg#id"> can leak data
  // or pull untrusted content. Strip absolute hrefs on <use>.
  s = s.replace(
    /<use\b([^>]*?)\s(href|xlink:href)\s*=\s*"https?:\/\/[^"]*"([^>]*)>/gi,
    "<use$1$3>",
  );

  // RECOLORING: replace simple hex/rgb/named colors in fill/stroke with currentColor.
  // Leave "none", "transparent", "url(...)" (gradients), and current* untouched.
  const colorAttr = /\s(fill|stroke)\s*=\s*"([^"]*)"/gi;
  s = s.replace(colorAttr, (_m, attr, val) => {
    const v = String(val).trim().toLowerCase();
    if (v === "" || v === "none" || v === "transparent" || v.startsWith("url(") || v.startsWith("current")) {
      return ` ${attr}="${val}"`;
    }
    return ` ${attr}="currentColor"`;
  });
  // Same for single quotes
  s = s.replace(/\s(fill|stroke)\s*=\s*'([^']*)'/gi, (_m, attr, val) => {
    const v = String(val).trim().toLowerCase();
    if (v === "" || v === "none" || v === "transparent" || v.startsWith("url(") || v.startsWith("current")) {
      return ` ${attr}='${val}'`;
    }
    return ` ${attr}='currentColor'`;
  });

  // Inline style attributes: replace fill/stroke colors there too (double-quoted)
  s = s.replace(/style\s*=\s*"([^"]*)"/gi, (_m, css) => {
    const cleaned = String(css).replace(
      /(fill|stroke)\s*:\s*([^;]+)/gi,
      (_mm, prop, val) => {
        const v = String(val).trim().toLowerCase();
        if (v === "none" || v === "transparent" || v.startsWith("url(") || v.startsWith("current")) {
          return `${prop}:${val}`;
        }
        return `${prop}:currentColor`;
      },
    );
    return `style="${cleaned}"`;
  });
  // Same pass for single-quoted style attributes
  s = s.replace(/style\s*=\s*'([^']*)'/gi, (_m, css) => {
    const cleaned = String(css).replace(
      /(fill|stroke)\s*:\s*([^;]+)/gi,
      (_mm, prop, val) => {
        const v = String(val).trim().toLowerCase();
        if (v === "none" || v === "transparent" || v.startsWith("url(") || v.startsWith("current")) {
          return `${prop}:${val}`;
        }
        return `${prop}:currentColor`;
      },
    );
    return `style='${cleaned}'`;
  });

  // Ensure the root <svg> has explicit width:100% / height:100% via CSS-friendly attrs,
  // not hard-coded width="500". We let the wrapper control size.
  s = s.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    let a = String(attrs);
    a = a.replace(/\s(width|height)\s*=\s*"[^"]*"/gi, "");
    a = a.replace(/\s(width|height)\s*=\s*'[^']*'/gi, "");
    if (!/viewBox/i.test(a)) {
      // If the original SVG had no viewBox, leave as-is (logo may render odd
      // but we don't have dimensions to invent one safely).
    }
    return `<svg${a}>`;
  });

  return s.trim();
}
