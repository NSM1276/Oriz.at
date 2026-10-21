// Public demo venues — editable without a login, reset nightly at 03:00.
export const DEMO_VENUES = [
  { id: "5781d254-df4b-4713-bfed-41111bd75a2d", slug: "ristorante-tosca" },
  { id: "f039c06c-d196-4f12-8145-fb20eeab0502", slug: "brasserie-lumiere" },
  { id: "ac0094c8-4c04-42e7-b404-a57ebbbed314", slug: "sushi-schonbrunn" },
] as const;

export const DEMO_VENUE_IDS: ReadonlySet<string> = new Set(DEMO_VENUES.map((v) => v.id));
export const DEMO_SLUGS: ReadonlySet<string> = new Set(DEMO_VENUES.map((v) => v.slug));
