import type { Venue, MenuData } from "@/lib/supabase/types";

export type ProfileVenue = Pick<
  Venue,
  | "id"
  | "slug"
  | "name"
  | "logo_url"
  | "logo_svg"
  | "about"
  | "color_primary"
  | "color_bg"
  | "menu_theme"
  | "instagram_url"
  | "facebook_url"
  | "google_maps_url"
  | "tripadvisor_url"
  | "website_url"
  | "google_review_url"
  | "phone"
  | "address"
  | "price_range"
  | "opening_hours"
  | "gallery"
  | "cover_url"
> & {
  menus?: MenuData[];
};

export type ThemeTokens = {
  isDark: boolean;
  bg: string;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
  cssVars: React.CSSProperties;
};

export type VenueEvent = {
  id: string;
  title: string;
  event_date: string;
  time_start: string | null;
  duration_hours: number | null;
};

export type ProfileProps = {
  venue: ProfileVenue;
  t: ThemeTokens;
  allergens?: string[];
  events?: VenueEvent[];
};
