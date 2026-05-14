export type Venue = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  about: string | null;
  currency: string;
  color_primary: string | null;
  color_bg: string | null;
  owner_id: string | null;
  created_at: string;
  plan?: string;
};

export type Section = {
  id: string;
  venue_id: string;
  name: string;
  position: number;
};

export type Item = {
  id: string;
  section_id: string;
  venue_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  ai_caption: string | null;
  allergens: string | null;
  is_active: boolean;
  position: number;
  updated_at: string;
};

export type MenuPayload = {
  venue: Venue;
  sections: (Section & { items: Item[] })[];
};
