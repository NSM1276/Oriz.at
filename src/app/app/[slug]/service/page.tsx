import { serviceClient } from "@/lib/auth";
import { currentStaffDevice } from "@/lib/service-server";
import { requireVenue } from "../../venue";
import { ServiceSettings } from "./ServiceSettings";

export const dynamic = "force-dynamic";

export type DeviceRow = { id: string; name: string; last_seen_at: string; push: boolean; current: boolean };

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const db = serviceClient();

  const [{ data: v }, { data: devices }, { count: tableCount }, thisDevice] = await Promise.all([
    db.from("venues").select("service_calls_enabled").eq("id", venue.id).single<{ service_calls_enabled: boolean }>(),
    db
      .from("staff_devices")
      .select("id, name, last_seen_at, push_subscription")
      .eq("venue_id", venue.id)
      .is("revoked_at", null)
      .order("created_at")
      .returns<{ id: string; name: string; last_seen_at: string; push_subscription: unknown }[]>(),
    db.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id).eq("is_active", true),
    currentStaffDevice(),
  ]);

  const rows: DeviceRow[] = (devices ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    last_seen_at: d.last_seen_at,
    push: d.push_subscription !== null,
    current: thisDevice?.id === d.id,
  }));

  return (
    <ServiceSettings
      slug={venue.slug}
      enabled={!!v?.service_calls_enabled}
      devices={rows}
      tableCount={tableCount ?? 0}
      thisDeviceVenueOther={!!thisDevice && thisDevice.venueId !== venue.id}
    />
  );
}
