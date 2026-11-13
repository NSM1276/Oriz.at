import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, serviceClient } from "@/lib/auth";
import { whatsappUrl } from "@/lib/contact-info";
import { inviteState, isInviteToken, type InviteState } from "@/lib/invite";
import { TRIAL_DAYS } from "@/lib/offer";
import { personName } from "@/lib/person";
import { SignupForm } from "./SignupForm";
import { WhatsAppHelp } from "@/components/WhatsAppHelp";

export const metadata: Metadata = {
  title: "Registrieren — ORIZ",
  description: "Zugang zu ORIZ gibt es nach einem kurzen Gespräch, über einen persönlichen Link.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Accounts are opened by invitation only. The link from our WhatsApp message carries
// ?einladung=<token>; without a valid one this page says how to reach us instead of showing a form.

const CLOSED: Record<Exclude<InviteState, "open">, { title: string; text: string; message: string }> = {
  missing: {
    title: "Zugang nach einem kurzen Gespräch",
    text: "Ein Konto bei ORIZ bekommen Sie über einen persönlichen Link. Schreiben Sie mir kurz — ich melde mich und richte Ihren Zugang ein.",
    message: "Guten Tag, ich möchte ORIZ für mein Lokal ausprobieren.",
  },
  used: {
    title: "Dieser Link wurde schon verwendet",
    text: "Mit diesem Link ist bereits ein Konto angelegt worden. Melden Sie sich an — oder schreiben Sie mir, wenn Sie das nicht waren.",
    message: "Guten Tag, mein Einladungslink zu ORIZ wurde schon verwendet.",
  },
  expired: {
    title: "Dieser Link ist abgelaufen",
    text: "Kein Problem: Schreiben Sie mir kurz, dann schicke ich Ihnen einen neuen.",
    message: "Guten Tag, mein Einladungslink zu ORIZ ist abgelaufen. Bitte schicken Sie mir einen neuen.",
  },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ einladung?: string }> }) {
  if (await getUser()) redirect("/app");

  const { einladung } = await searchParams;
  let state: InviteState = "missing";
  let venueName = "";
  if (isInviteToken(einladung)) {
    const { data } = await serviceClient().from("signup_invites").select("venue_name, used_at, expires_at").eq("token", einladung).maybeSingle();
    state = inviteState(data);
    venueName = data?.venue_name ?? "";
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ</p>
        {state === "open" && isInviteToken(einladung) ? (
          <>
            <h1 className="mt-1 text-2xl font-semibold">Willkommen, {venueName}</h1>
            <p className="mt-2 text-base text-stone-600">
              Legen Sie Ihr Konto an. {TRIAL_DAYS} Tage kostenlos testen, alle Funktionen inklusive.
            </p>
            <SignupForm token={einladung} venueName={venueName} />
            <WhatsAppHelp message="Hallo, ich habe eine Frage zur Registrierung bei ORIZ." className="mt-6 text-center" />
          </>
        ) : (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{CLOSED[state === "open" ? "missing" : state].title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-stone-700">{CLOSED[state === "open" ? "missing" : state].text}</p>
            <a
              href={whatsappUrl(CLOSED[state === "open" ? "missing" : state].message)}
              className="mt-6 flex min-h-14 items-center justify-center rounded-xl bg-stone-900 px-5 text-lg font-semibold text-white"
            >
              WhatsApp an {personName}
            </a>
            <Link href="/admin/login?next=/app" className="mt-3 flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-medium ring-1 ring-stone-300">
              Ich habe schon ein Konto
            </Link>
            <Link href="/" className="mt-6 text-center text-sm text-stone-600 underline">
              Zur Startseite
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
