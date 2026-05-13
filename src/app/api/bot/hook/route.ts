import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_BOT_SECRET || secret !== process.env.TELEGRAM_BOT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Future: parse Telegram Update object and route to handler
  // const update = await req.json();

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: "ORIZ bot hook active" });
}
