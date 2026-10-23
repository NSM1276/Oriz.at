import { redirect } from "next/navigation";
import { isPlatformAdmin, memberVenues } from "@/lib/auth";
import { requireUser } from "../venue";
import { NewVenueForm } from "./NewVenueForm";
import { WhatsAppHelp } from "@/components/WhatsAppHelp";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  const user = await requireUser("/app/neu");
  const venues = await memberVenues(user.id);
  if (venues.length > 0 && !(await isPlatformAdmin(user.id))) redirect(`/app/${venues[0].slug}`);

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-[max(env(safe-area-inset-top),32px)]">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Schritt 1 von 4</p>
      <h1 className="mt-1 text-2xl font-semibold">Ihr Lokal</h1>
      <p className="mt-2 text-sm text-stone-600">
        Name und Adresse der Speisekarte. Den Namen können Sie später jederzeit ändern.
      </p>
      <NewVenueForm />
      <WhatsAppHelp message="Hallo, ich brauche Hilfe beim Einrichten meines Lokals bei ORIZ." className="mt-8 text-center" />
    </main>
  );
}
