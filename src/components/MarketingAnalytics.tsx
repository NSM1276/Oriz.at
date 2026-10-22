"use client";

import { Analytics } from "@vercel/analytics/next";

// Visitor statistics for the marketing site only (Vercel Web Analytics, no cookies).
// Guest menus, owner admin, the table service board and every other page are dropped
// before anything is sent: it keeps guests out of the numbers and the event quota for
// the pages that bring customers.
const MEASURED_PATHS = new Set(["/", "/carta", "/registrieren", "/impressum", "/datenschutz"]);

export function MarketingAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return MEASURED_PATHS.has(new URL(event.url).pathname) ? event : null;
        } catch {
          return null;
        }
      }}
    />
  );
}
