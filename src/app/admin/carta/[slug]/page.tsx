import { redirect } from "next/navigation";

// The menu editor moved to /app. Old links (super-admin venue cards, bookmarks)
// land there; /app checks membership itself.
export default async function CartaAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/app/${slug}/speisekarte`);
}
