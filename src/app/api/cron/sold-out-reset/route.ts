import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/auth";
import { bearerMatches } from "@/lib/secrets";

// Nightly (vercel.json): dishes marked "heute aus" are switched back on. See lib/sold-out.ts.
export async function GET(req: NextRequest) {
  if (!bearerMatches(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await serviceClient()
    .from("items")
    .update({ is_active: true, sold_out_until: null })
    .lte("sold_out_until", new Date().toISOString())
    .select("id");
  if (error) return NextResponse.json({ error: "update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, back: data?.length ?? 0 });
}
