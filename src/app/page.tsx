import type { Metadata } from "next";
import { HomePage } from "@/components/landing/HomePage";
import { HOME_DE } from "@/lib/home-copy";
import { homeMetadata } from "@/lib/home-meta";

// Main page: Carta only, large type, claims that match the product. Texts in lib/home-copy.ts,
// layout in components/landing/HomePage.tsx (shared with the English version at /en).

export const metadata: Metadata = homeMetadata(HOME_DE);

export default function NewLanding() {
  return <HomePage c={HOME_DE} />;
}
