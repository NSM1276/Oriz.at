import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QrCard } from "@/components/admin/QrCard";

export const dynamic = "force-dynamic";

type Params = { type: "carta" | "casa"; slug: string };

export default async function QrCardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type, slug } = await params;
  if (type !== "carta" && type !== "casa") notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/admin/login?next=/admin/qr/${type}/${slug}`);
  }

  if (type === "carta") {
    const { data } = await supabase
      .from("venues")
      .select("name, color_primary")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) notFound();
    return (
      <QrCard
        name={data.name}
        url={`https://oriz.at/${slug}`}
        accent={(data as { color_primary?: string | null }).color_primary ?? "#C69B3C"}
        kind="carta"
      />
    );
  }

  // casa
  const { data } = await supabase
    .schema("casa")
    .from("properties")
    .select("name, city, color_primary")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  return (
    <QrCard
      name={data.name}
      subtitle={data.city ?? undefined}
      url={`https://oriz.at/c/${slug}`}
      accent={(data as { color_primary?: string | null }).color_primary ?? "#C69B3C"}
      kind="casa"
    />
  );
}
