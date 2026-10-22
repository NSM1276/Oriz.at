import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import type { HomeCopy } from "@/lib/home-copy";

// Metadata of the two language versions of the main page. Each is its own canonical address and
// points to the other one (hreflang), so search engines show the right language to the right reader.
export function homeMetadata(c: HomeCopy): Metadata {
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: {
      canonical: c.path,
      languages: { "de-AT": "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      siteName: "ORIZ",
      locale: c.meta.ogLocale,
      type: "website",
      url: `${SITE_URL}${c.path === "/" ? "" : c.path}`,
    },
  };
}
