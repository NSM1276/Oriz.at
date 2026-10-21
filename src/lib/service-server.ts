import "server-only";
import { cookies } from "next/headers";
import { serviceClient } from "@/lib/auth";
import { hashSecret } from "@/lib/secrets";
import { KIND_LABEL_DE, STAFF_COOKIE, type CallKind } from "@/lib/service";
import { tableDisplayName } from "@/lib/tables";
import { isPushSubscription, sendPush, type VapidKeys } from "@/lib/web-push";

export type StaffDevice = { id: string; venueId: string; name: string };

// last_seen_at is only for the owner's device list; no need to write it on every poll.
const TOUCH_AFTER_MS = 5 * 60_000;

/** The paired staff device behind this request's cookie, if it is still active. */
export async function currentStaffDevice(): Promise<StaffDevice | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const db = serviceClient();
  const { data } = await db
    .from("staff_devices")
    .select("id, venue_id, name, last_seen_at")
    .eq("token_hash", hashSecret(token))
    .is("revoked_at", null)
    .maybeSingle<{ id: string; venue_id: string; name: string; last_seen_at: string }>();
  if (!data) return null;
  if (Date.now() - Date.parse(data.last_seen_at) > TOUCH_AFTER_MS) {
    await db.from("staff_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  }
  return { id: data.id, venueId: data.venue_id, name: data.name };
}

function vapidKeys(): VapidKeys | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: "mailto:office@oriz.at" };
}

export function pushConfigured(): boolean {
  return vapidKeys() !== null;
}

/** Push to every paired device of the venue. Never throws: the call is already saved. */
export async function notifyStaff(venueId: string, call: { id: string; kind: CallKind; tableLabel: string }) {
  const keys = vapidKeys();
  if (!keys) return;
  const db = serviceClient();
  const { data: devices } = await db
    .from("staff_devices")
    .select("id, push_subscription")
    .eq("venue_id", venueId)
    .is("revoked_at", null)
    .not("push_subscription", "is", null)
    .returns<{ id: string; push_subscription: unknown }[]>();

  const payload = {
    title: `${tableDisplayName(call.tableLabel)} · ${KIND_LABEL_DE[call.kind]}`,
    body: "Tippen, um zu übernehmen.",
    tag: call.id,
    url: "/service",
  };
  await Promise.all(
    (devices ?? []).map(async (d) => {
      if (!isPushSubscription(d.push_subscription)) return;
      try {
        const res = await sendPush(d.push_subscription, payload, keys);
        if (!res.ok && res.gone) {
          await db.from("staff_devices").update({ push_subscription: null }).eq("id", d.id);
        }
      } catch (err) {
        console.error("[service] push failed", err);
      }
    }),
  );
}
