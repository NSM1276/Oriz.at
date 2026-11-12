import { redirect } from "next/navigation";

// "Profil" became "Lokal" (photos, text, contact, hours, links, sharing in one place).
export default async function ProfileRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/app/${slug}/lokal`);
}
