import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/auth";
import { currentStaffDevice } from "@/lib/service-server";
import { isPushSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

// A paired device hands us its push subscription (or withdraws it).

export async function POST(req: NextRequest) {
  const device = await currentStaffDevice();
  if (!device) return NextResponse.json({ error: "not paired" }, { status: 401 });
  let sub: unknown;
  try { sub = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
  if (!isPushSubscription(sub)) return NextResponse.json({ error: "bad subscription" }, { status: 400 });

  await serviceClient()
    .from("staff_devices")
    .update({ push_subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } } })
    .eq("id", device.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const device = await currentStaffDevice();
  if (!device) return NextResponse.json({ error: "not paired" }, { status: 401 });
  await serviceClient().from("staff_devices").update({ push_subscription: null }).eq("id", device.id);
  return NextResponse.json({ ok: true });
}
