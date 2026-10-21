import { serviceClient } from "@/lib/auth";
import { compareTables } from "@/lib/tables";
import { requireVenue } from "../../venue";
import { TablesManager, type TableRow } from "./TablesManager";

export const dynamic = "force-dynamic";

export default async function TablesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);

  const { data } = await serviceClient()
    .from("venue_tables")
    .select("id, label, zone, code, is_active, position")
    .eq("venue_id", venue.id)
    .returns<TableRow[]>();

  const tables = (data ?? []).sort(compareTables);
  return <TablesManager slug={venue.slug} tables={tables} />;
}
