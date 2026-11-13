import { vcard } from "@/lib/person";
import { SITE_URL } from "@/lib/site";

// "Kontakt speichern" on /hallo: the phone opens this as a new address-book entry.
export const dynamic = "force-static";

export function GET() {
  return new Response(vcard(SITE_URL), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nasim-nuridinov-oriz.vcf"',
    },
  });
}
