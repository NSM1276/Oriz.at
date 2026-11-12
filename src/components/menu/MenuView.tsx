"use client";

import { GuestMenu } from "@/components/guest/GuestMenu";
import { BASE_LOCALE } from "@/lib/menu-i18n";
import type { MenuPayload } from "@/lib/supabase/types";

// Kept as the public entry point for the guest page and the theme demo.
export function MenuView({ initial, initialLocale = BASE_LOCALE, track = false }: { initial: MenuPayload; initialLocale?: string; track?: boolean }) {
  return <GuestMenu initial={initial} initialLocale={initialLocale} track={track} />;
}
