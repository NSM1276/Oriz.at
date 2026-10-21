import type { Metadata } from "next";
import { serviceClient } from "@/lib/auth";
import { hashSecret } from "@/lib/secrets";
import { PairForm } from "./PairForm";

export const metadata: Metadata = { title: "Gerät verbinden — ORIZ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PairPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await serviceClient()
    .from("staff_pairings")
    .select("expires_at, used_at, venues(name)")
    .eq("token_hash", hashSecret(token))
    .maybeSingle<{ expires_at: string; used_at: string | null; venues: { name: string } | null }>();
  const valid = !!data && !data.used_at && Date.parse(data.expires_at) > Date.now();

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ · Service</p>
        {valid ? (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{data!.venues?.name ?? "Lokal"}</h1>
            <p className="mt-2 text-sm text-stone-600">
              Dieses Gerät zeigt danach die Rufe der Gäste. Ein Konto oder Passwort ist nicht nötig.
            </p>
            <PairForm token={token} />
          </>
        ) : (
          <>
            <h1 className="mt-1 text-2xl font-semibold">Link nicht mehr gültig</h1>
            <p className="mt-2 text-sm text-stone-600">
              Verbindungs-Links gelten 10 Minuten und nur einmal. Bitten Sie die Leitung um einen neuen QR-Code
              (Verwaltung → Service → Gerät verbinden).
            </p>
          </>
        )}
      </main>
    </div>
  );
}
