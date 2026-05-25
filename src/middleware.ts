import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Hostnames that we serve our regular routing on (no rewrite).
// Everything else is treated as a tenant custom domain.
const KNOWN_HOSTS = new Set([
  "oriz.at",
  "www.oriz.at",
  "localhost",
  "localhost:3000",
]);

// We also let any *.vercel.app preview through unchanged (used during dev).
function isPlatformHost(host: string): boolean {
  if (KNOWN_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

// Service client (RLS-bypassing) for cheap host lookup.
// Cached via the function reference since middleware runs on the edge.
function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  if (!host || isPlatformHost(host)) return NextResponse.next();

  // This is a custom domain. Look it up in either Carta or Casa.
  // First match wins — domains are UNIQUE per table so this is safe.
  const sb = svc();
  const [{ data: carta }, { data: casa }] = await Promise.all([
    sb.from("venues").select("slug").eq("custom_domain", host).maybeSingle(),
    sb
      .schema("casa")
      .from("properties")
      .select("slug")
      .eq("custom_domain", host)
      .maybeSingle(),
  ]);

  const targetSlug = carta?.slug
    ? `/${carta.slug}`
    : casa?.slug
      ? `/casa/${casa.slug}`
      : null;

  if (!targetSlug) {
    // Unknown domain — let Next render 404
    return NextResponse.next();
  }

  // If the request is already to the root, rewrite to the tenant's slug.
  // If they're hitting a deep path, keep the path (lets per-tenant subroutes work later).
  const url = req.nextUrl.clone();
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = targetSlug;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

// Don't run middleware on static assets, API routes, or admin (those stay on oriz.at).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|admin|api).*)",
  ],
};
