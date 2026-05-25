import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CasaGuestView } from "@/components/casa/CasaGuestView";

export const revalidate = 60; // ISR — refresh content every 60s

type Property = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  about: string | null;
  color_bg: string | null;
  color_primary: string | null;
  logo_url: string | null;
  logo_svg: string | null;
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
  phone: string | null;
  email: string | null;
};

type ContentBlock = {
  id: string;
  block_type: string;
  title_de: string | null;
  title_en: string | null;
  body_de: string | null;
  body_en: string | null;
  image_url: string | null;
  position: number;
};

async function fetchProperty(slug: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("casa")
    .from("properties")
    .select(
      "id, slug, name, city, about, color_bg, color_primary, logo_url, logo_svg, cover_url, website_url, instagram_url, facebook_url, google_maps_url, phone, email",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data as Property | null;
}

async function fetchBlocks(propertyId: string): Promise<ContentBlock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("casa")
    .from("content_blocks")
    .select(
      "id, block_type, title_de, title_en, body_de, body_en, image_url, position",
    )
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  return (data as ContentBlock[]) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: "ORIZ Casa" };
  const where = property.city ? ` · ${property.city}` : "";
  return {
    title: `${property.name}${where} · ORIZ Casa`,
    description: `Willkommen in ${property.name}. WLAN, Check-in, Frühstück und mehr — in Ihrer Sprache.`,
  };
}

export default async function CasaGuestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) notFound();

  const blocks = await fetchBlocks(property.id);

  return <CasaGuestView property={property} blocks={blocks} />;
}
