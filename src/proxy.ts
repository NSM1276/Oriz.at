import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Platform hosts — served with normal Next.js routing, no rewrite.
const KNOWN_HOSTS = new Set([
  "oriz.at",
  "www.oriz.at",
  "localhost",
  "localhost:3000",
]);

function isPlatformHost(host: string): boolean {
  if (KNOWN_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

// Service client for the cheap host → slug lookup. Bypasses RLS.
function svcClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function proxy(request: NextRequest) {
  // 1) Custom-domain routing.
  // If the request comes in on a tenant's domain (e.g. belvedere.at),
  // look it up in the DB and internally rewrite to the matching slug.
  // Skips /admin and /api so the platform UI always stays on oriz.at.
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  const path = request.nextUrl.pathname;
  const isPlatformPath =
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path === "/sitemap.xml" ||
    path === "/robots.txt";

  if (host && !isPlatformHost(host) && !isPlatformPath) {
    try {
      const sb = svcClient();
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
      if (targetSlug && (path === "/" || path === "")) {
        const url = request.nextUrl.clone();
        url.pathname = targetSlug;
        return NextResponse.rewrite(url);
      }
    } catch (err) {
      // Custom-domain lookup is best-effort; fall through on failure.
      console.error("[proxy] custom domain lookup failed:", err);
    }
  }

  // 2) Supabase session refresh — runs for all requests so cookies stay fresh.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet: CookieToSet[]) {
          toSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
