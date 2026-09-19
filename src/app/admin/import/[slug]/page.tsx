import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MenuImport } from "@/components/admin/MenuImport";

// Super-admin only: paste a menu, review the parse, append it to a venue.
export const revalidate = 0;

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

export default async function MenuImportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/admin/login?next=/admin/import/${slug}`);
  if (user.email !== SUPER_ADMIN_EMAIL) redirect("/admin");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle<{ id: string; name: string; slug: string }>();
  if (!venue) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-20">
      <Link
        href={`/admin/carta/${venue.slug}`}
        className="font-sans text-[10px] tracking-regal uppercase text-onyx/45 hover:text-gold"
      >
        ← Zurück zur Verwaltung
      </Link>
      <div className="mt-8">
        <MenuImport venueId={venue.id} venueName={venue.name} slug={venue.slug} />
      </div>
    </main>
  );
}
