import type { Metadata, Viewport } from "next";
import { serviceClient } from "@/lib/auth";
import { currentStaffDevice } from "@/lib/service-server";
import { ServiceBoard } from "./ServiceBoard";

export const metadata: Metadata = {
  title: "Service — ORIZ",
  robots: { index: false, follow: false },
  manifest: "/service.webmanifest",
  appleWebApp: { capable: true, title: "ORIZ Service", statusBarStyle: "black" },
};
export const viewport: Viewport = { themeColor: "#1c1917" };
export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const device = await currentStaffDevice();

  if (!device) {
    return (
      <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ · Service</p>
          <h1 className="mt-1 text-2xl font-semibold">Dieses Gerät ist nicht verbunden</h1>
          <p className="mt-2 text-sm text-stone-600">
            Die Leitung des Lokals zeigt unter Verwaltung → Service → „Gerät verbinden“ einen QR-Code. Einfach mit diesem
            Gerät scannen.
          </p>
        </main>
      </div>
    );
  }

  const { data: venue } = await serviceClient()
    .from("venues")
    .select("name, service_calls_enabled")
    .eq("id", device.venueId)
    .single<{ name: string; service_calls_enabled: boolean }>();

  return (
    <ServiceBoard
      venueName={venue?.name ?? "Lokal"}
      deviceName={device.name}
      callsEnabled={!!venue?.service_calls_enabled}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
    />
  );
}
