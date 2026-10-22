"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/admin/PhotoUploader";

// Logo as a picture (PNG/JPG). An SVG logo we set up keeps showing until the
// owner uploads a picture in its place.
export function LogoField({ venueId, logoUrl, hasSvg }: { venueId: string; logoUrl: string | null; hasSvg: boolean }) {
  const [url, setUrl] = useState(logoUrl);
  return (
    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="text-sm font-semibold">Logo</h2>
      <p className="mt-1 mb-3 text-sm text-stone-600">
        {hasSvg && !url
          ? "Ihr Logo wurde von ORIZ eingerichtet. Ein neues Bild ersetzt es."
          : "Erscheint oben in der Speisekarte. Am besten PNG mit transparentem Hintergrund."}
      </p>
      <PhotoUploader target="carta-venue-logo" id={venueId} currentUrl={url} onChange={setUrl} label="+ Logo hochladen" />
    </section>
  );
}
