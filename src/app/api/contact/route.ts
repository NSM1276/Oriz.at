import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, restaurant, email, phone, plan, message } = await req.json();

  if (!email || !restaurant) {
    return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
  }

  const planLabel = plan ? `— Tarif: ${plan}` : "";

  const { error } = await resend.emails.send({
    from: "ORIZ Anfragen <onboarding@resend.dev>",
    to: "nasim2131@gmail.com",
    subject: `Neue Anfrage: ${restaurant} ${planLabel}`,
    text: [
      `Tarif: ${plan || "—"}`,
      `Restaurant: ${restaurant}`,
      `Name: ${name || "—"}`,
      `E-Mail: ${email}`,
      `Telefon: ${phone || "—"}`,
      `Nachricht: ${message || "—"}`,
    ].join("\n"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
