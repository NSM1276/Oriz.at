import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { cookies } from "next/headers";
import { serviceClient } from "@/lib/auth";
import { hashSecret, newSecret } from "@/lib/secrets";
import { decideCall, isCallKind, type CallKind, type CallStatus } from "@/lib/service";
import { notifyStaff } from "@/lib/service-server";
import { TABLE_COOKIE, resolveTableCode } from "@/lib/table-session";

export const dynamic = "force-dynamic";

// Guest side of a waiter call. The table comes only from the httpOnly cookie
// the sticker set — never from the request body — so nobody can call a table
// they are not sitting at. Status is read by call id (a random UUID that says
// nothing but open/accepted/done); cancelling needs the secret returned on create.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: { kind?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  if (!isCallKind(body.kind)) return json({ error: "bad kind" }, 400);
  const kind: CallKind = body.kind;

  const code = (await cookies()).get(TABLE_COOKIE)?.value;
  const table = code ? await resolveTableCode(code) : null;
  if (!table) return json({ error: "no table" }, 403);

  const db = serviceClient();
  const { data: venue } = await db
    .from("venues")
    .select("service_calls_enabled")
    .eq("id", table.venueId)
    .maybeSingle<{ service_calls_enabled: boolean }>();
  if (!venue?.service_calls_enabled) return json({ error: "disabled" }, 403);

  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: recent } = await db
    .from("service_calls")
    .select("id, kind, status, created_at")
    .eq("table_id", table.tableId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .returns<{ id: string; kind: CallKind; status: CallStatus; created_at: string }[]>();

  const decision = decideCall(kind, recent ?? []);
  if (decision.action === "limit") return json({ error: "limit" }, 429);

  // A repeated tap (or a second phone at the table) follows the existing call;
  // only whoever placed it holds the secret to cancel it.
  if (decision.action === "reuse") {
    const existing = recent![decision.index];
    return json({ id: existing.id, secret: null, status: existing.status });
  }

  const secret = newSecret();
  const { data: call, error } = await db
    .from("service_calls")
    .insert({
      venue_id: table.venueId,
      table_id: table.tableId,
      table_label: table.label,
      kind,
      guest_secret_hash: hashSecret(secret),
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !call) return json({ error: "failed" }, 500);

  after(() => notifyStaff(table.venueId, { id: call.id, kind, tableLabel: table.label }));
  return json({ id: call.id, secret, status: "open" });
}

async function findCall(id: unknown) {
  if (typeof id !== "string" || !UUID.test(id)) return null;
  const { data } = await serviceClient()
    .from("service_calls")
    .select("id, status, guest_secret_hash")
    .eq("id", id)
    .maybeSingle<{ id: string; status: CallStatus; guest_secret_hash: string }>();
  return data;
}

export async function GET(req: NextRequest) {
  const call = await findCall(new URL(req.url).searchParams.get("id"));
  if (!call) return json({ error: "not found" }, 404);
  return json({ status: call.status });
}

export async function DELETE(req: NextRequest) {
  let body: { id?: unknown; secret?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const call = await findCall(body.id);
  if (!call || typeof body.secret !== "string" || call.guest_secret_hash !== hashSecret(body.secret)) {
    return json({ error: "not found" }, 404);
  }
  if (call.status === "open" || call.status === "accepted") {
    await serviceClient()
      .from("service_calls")
      .update({ status: "cancelled", closed_at: new Date().toISOString() })
      .eq("id", call.id)
      .in("status", ["open", "accepted"]);
  }
  return json({ status: "cancelled" });
}
