"use client";

import Link from "next/link";
import { useT } from "@/lib/locale-context";

// Footer links to the real legal pages (/impressum, /datenschutz).
// The pages are German; the labels follow the visitor's language on the old landing pages.
export function LegalLinks() {
  const { t } = useT();
  const cls =
    "font-sans text-[10px] tracking-regal uppercase text-parchment/20 hover:text-gold transition-colors";

  return (
    <div className="flex gap-6">
      <Link href="/impressum" className={cls}>
        {t.legal.impressum}
      </Link>
      <Link href="/datenschutz" className={cls}>
        {t.legal.datenschutz}
      </Link>
    </div>
  );
}
