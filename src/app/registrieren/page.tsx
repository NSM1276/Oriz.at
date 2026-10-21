import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Registrieren — ORIZ",
  description: "Digitale Speisekarte mit QR-Codes für jeden Tisch. 14 Tage kostenlos testen, ohne Kreditkarte.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getUser()) redirect("/app");

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ</p>
        <h1 className="mt-1 text-2xl font-semibold">Speisekarte erstellen</h1>
        <p className="mt-2 text-sm text-stone-600">
          14 Tage kostenlos testen. Keine Kreditkarte nötig, endet automatisch.
        </p>
        <SignupForm />
      </main>
    </div>
  );
}
