// The public "try the admin without a login" playground is retired (2026-11-13): it showed the old
// admin, let anyone change demo menus and needed a nightly reset that wiped real work on them.
// The demo venues stay as examples; they are edited like any other venue, with a login.
export const DEMO_VENUES: readonly { id: string; slug: string }[] = [];

export const DEMO_VENUE_IDS: ReadonlySet<string> = new Set(DEMO_VENUES.map((v) => v.id));
export const DEMO_SLUGS: ReadonlySet<string> = new Set(DEMO_VENUES.map((v) => v.slug));
