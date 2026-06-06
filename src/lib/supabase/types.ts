export type Venue = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  logo_svg?: string | null;
  about: string | null;
  currency: string;
  color_primary: string | null;
  color_bg: string | null;
  owner_id: string | null;
  created_at: string;
  plan?: string;
  instagram_url?: string | null;
  google_maps_url?: string | null;
  ai_credits_used?: number;
  ai_credits_reset?: string;
  menu_theme?: 'classic' | 'modern' | 'visual';
  // ── Restaurant profile (migration 0012) ──
  phone?: string | null;
  address?: string | null;
  tripadvisor_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  google_review_url?: string | null;
  price_range?: string | null;
  opening_hours?: OpeningHours | null;
  gallery?: string[] | null;
  cover_url?: string | null;
};

export type OpeningHours = Partial<Record<Weekday, [string, string][]>>;
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type MenuData = {
  id: string;
  name: string;
  position: number;
  active_days: string[];
  time_from: string | null;
  time_to: string | null;
};

export type Section = {
  id: string;
  venue_id: string;
  name: string;
  position: number;
  menu_id?: string | null;
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
  diet_tags?: string | null;
  is_active: boolean;
  position: number;
  updated_at: string;
};

export type MenuPayload = {
  venue: Venue;
  sections: (Section & { items: Item[] })[];
  menus?: MenuData[];
};
