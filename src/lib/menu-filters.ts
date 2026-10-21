// Guest menu filter chips (alcohol + diet tags), shared by all three menu themes.
// A chip is only offered when it can change what the guest sees — a "Vegan" chip
// on a menu without vegan-tagged dishes would just empty the page.

export type DietFilter = "vegan" | "vegetarisch" | "glutenfrei";
export type FilterKey = "alcohol" | DietFilter;

const ALCOHOL_KEYWORDS = ["alkohol", "bier", "wein", "getränke", "drinks", "bar"];

export function isAlcoholSection(name: string): boolean {
  const lower = name.toLowerCase();
  return ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw));
}

type FilterableSection = {
  name: string;
  items: { diet_tags?: string[] | string | null }[];
};

export function availableFilterKeys(sections: FilterableSection[]): Set<FilterKey> {
  const keys = new Set<FilterKey>();
  if (sections.some((s) => isAlcoholSection(s.name))) keys.add("alcohol");
  for (const tag of ["vegan", "vegetarisch", "glutenfrei"] as const) {
    if (sections.some((s) => s.items.some((it) => it.diet_tags?.includes(tag)))) keys.add(tag);
  }
  return keys;
}
