import { NextResponse } from "next/server";
import { getUser, isPlatformAdmin, memberVenues } from "@/lib/auth";
import { isInvoiceNumber } from "@/lib/invoice";
import { loadInvoice, renderInvoicePdf } from "@/lib/invoice-server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Invoice PDF. Allowed for the people of the venue it was issued to, and for platform admins
// (also when the venue is gone). Everyone else gets a plain 404.
export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await getUser();
  if (!user || !isInvoiceNumber(number)) return new NextResponse("Not found", { status: 404 });

  const inv = await loadInvoice(number);
  if (!inv) return new NextResponse("Not found", { status: 404 });
  const allowed = (await isPlatformAdmin(user.id)) || (!!inv.venueId && (await memberVenues(user.id)).some((v) => v.id === inv.venueId));
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  const pdf = await renderInvoicePdf(inv);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="Rechnung-${number}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
