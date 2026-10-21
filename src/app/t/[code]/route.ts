import { NextResponse, type NextRequest } from "next/server";
import { TABLE_COOKIE, TABLE_COOKIE_MAX_AGE, resolveTableCode } from "@/lib/table-session";

export const dynamic = "force-dynamic";

const INVALID_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>QR-Code ungültig</title>
<meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#f5f5f4;color:#1c1917;padding:24px;box-sizing:border-box;text-align:center}p{max-width:22rem;margin:.5rem auto}</style>
</head><body><main><p><strong>Dieser QR-Code ist nicht mehr gültig.</strong></p>
<p>Bitte wenden Sie sich an das Personal.</p><p lang="en" style="color:#78716c">This QR code is no longer valid. Please ask the staff.</p></main></body></html>`;

// Entry point printed on every table sticker: oriz.at/t/<code>.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const table = await resolveTableCode(code);
  if (!table) {
    return new NextResponse(INVALID_HTML, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const response = NextResponse.redirect(new URL(`/${table.venueSlug}`, request.url), 303);
  response.cookies.set(TABLE_COOKIE, code.toUpperCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TABLE_COOKIE_MAX_AGE,
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
