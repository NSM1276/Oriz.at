import { ItemRow } from "./ItemRow";
import type { Item, Section } from "@/lib/supabase/types";

export function SectionBlock({
  section,
  items,
  currency,
}: {
  section: Section;
  items: Item[];
  currency: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-16">
      <header className="mb-6 flex items-center gap-4">
        <span
          className="font-sans text-[11px] tracking-regal uppercase"
          style={{ color: 'var(--accent)' }}
        >
          {section.name}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
      </header>
      <ul>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} currency={currency} />
        ))}
      </ul>
    </section>
  );
}
