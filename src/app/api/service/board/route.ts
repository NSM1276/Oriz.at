import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/auth";
import { onBoard, type CallKind, type CallStatus } from "@/lib/service";
import { currentStaffDevice } from "@/lib/service-server";

export const dynamic = "force-dynamic";

// Staff side, for paired devices only. The device's venue comes from its
// cookie; ids from the client are always checked against that venue.

const LOOKBACK_MINUTES = 120;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BoardCall = {
  id: string;
  table_label: string;
  kind: CallKind;
  status: CallStatus;
  accepted_by: string | null;
  accepted_by_name: string | null;
  created_at: string;
  accepted_at: string | null;
  closed_at: string | null;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET() {
  const device = await currentStaffDevice();
  if (!device) return json({ error: "not paired" }, 401);

  // Wide enough for a call taken late and closed recently; onBoard() decides the rest.
  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();
  const { data } = await serviceClient()
    .from("service_calls")
    .select("id, table_label, kind, status, accepted_by, accepted_by_name, created_at, accepted_at, closed_at")
    .eq("venue_id", device.venueId)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .returns<BoardCall[]>();

  const now = Date.now();
  return json({ deviceId: device.id, calls: (data ?? []).filter((c) => onBoard(c, now)), now: new Date(now).toISOString() });
}

export async function POST(req: NextRequest) {
  const device = await currentStaffDevice();
  if (!device) return json({ error: "not paired" }, 401);

  let body: { id?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  if (typeof body.id !== "string" || !UUID.test(body.id)) return json({ error: "bad id" }, 400);

  const db = serviceClient();
  const now = new Date().toISOString();

  if (body.action === "accept") {
    // Whoever taps first goes; everyone else sees the name.
    const { data } = await db
      .from("service_calls")
      .update({ status: "accepted", accepted_by: device.id, accepted_by_name: device.name, accepted_at: now })
      .eq("id", body.id)
      .eq("venue_id", device.venueId)
      .eq("status", "open")
      .select("id");
    if (!data?.length) return json({ error: "taken" }, 409);
    return json({ ok: true });
  }

  if (body.action === "done") {
    await db
      .from("service_calls")
      .update({ status: "done", closed_at: now })
      .eq("id", body.id)
      .eq("venue_id", device.venueId)
      .in("status", ["open", "accepted"]);
    return json({ ok: true });
  }

  if (body.action === "release") {
    await db
      .from("service_calls")
      .update({ status: "open", accepted_by: null, accepted_by_name: null, accepted_at: null })
      .eq("id", body.id)
      .eq("venue_id", device.venueId)
      .eq("status", "accepted")
      .eq("accepted_by", device.id);
    return json({ ok: true });
  }

  return json({ error: "bad action" }, 400);
}
