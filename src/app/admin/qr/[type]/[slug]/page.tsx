import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { QrCard } from "@/components/admin/QrCard";

export const dynamic = "force-dynamic";

type Params = { type: "carta" | "casa"; slug: string };

// Demo venues — QR card accessible without auth (nightly reset at 03:00)
const DEMO_SLUGS = new Set([
  "ristorante-tosca",
  "brasserie-lumiere",
  "sushi-schonbrunn",
]);

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export default async function QrCardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type, slug } = await params;
  if (type !== "carta" && type !== "casa") notFound();

  const isDemo = DEMO_SLUGS.has(slug);

  if (!isDemo) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/admin/login?next=/admin/qr/${type}/${slug}`);
    }
  }

  // Use service client for demo venues (no session), regular client otherwise
  const db = isDemo ? svc() : await createClient();

  if (type === "carta") {
    const { data } = await db
      .from("venues")
      .select("name, color_bg, color_primary, logo_svg, logo_url")
      .eq("slug", slug)
      .maybeSingle<{ name: string; color_bg: string | null; color_primary: string | null; logo_svg: string | null; logo_url: string | null }>();
    if (!data) notFound();
    return (
      <QrCard
        name={data.name}
        url={`https://oriz.at/${slug}`}
        colorBg={data.color_bg ?? undefined}
        accent={data.color_primary ?? "#C69B3C"}
        kind="carta"
        logoSvg={data.logo_svg}
        logoUrl={data.logo_url}
      />
    );
  }

  // casa
  const { data } = await db
    .schema("casa")
    .from("properties")
    .select("name, city, color_bg, color_primary, logo_svg, logo_url")
    .eq("slug", slug)
    .maybeSingle<{ name: string; city: string | null; color_bg: string | null; color_primary: string | null; logo_svg: string | null; logo_url: string | null }>();
  if (!data) notFound();
  return (
    <QrCard
      name={data.name}
      subtitle={data.city ?? undefined}
      url={`https://oriz.at/c/${slug}`}
      colorBg={data.color_bg ?? undefined}
      accent={data.color_primary ?? "#C69B3C"}
      kind="casa"
      logoSvg={data.logo_svg}
      logoUrl={data.logo_url}
    />
  );
}
