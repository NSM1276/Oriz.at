// The address search engines should treat as the site's own.
//
// oriz.at redirects to www.oriz.at (Vercel domain setting), so www is the host that answers with
// content, and it is the one every canonical link, the sitemap and the structured data name.
// Printed QR codes keep pointing at oriz.at: they still work through the redirect.
export const SITE_URL = "https://www.oriz.at";
