import type { Metadata } from "next";
import { HomePage } from "@/components/landing/HomePage";
import { HOME_EN } from "@/lib/home-copy";
import { homeMetadata } from "@/lib/home-meta";

// English version of the main page. Same layout as "/", texts from lib/home-copy.ts.

export const metadata: Metadata = homeMetadata(HOME_EN);

export default function EnglishLanding() {
  return <HomePage c={HOME_EN} />;
}
