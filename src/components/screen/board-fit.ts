// Deterministic auto-fit for the Tafel (static board) mode.
// No DOM measuring: sizes are derived from how much content there is, so the
// block fills the screen at any resolution and the result is unit-testable.
//
// Idea taken from the MotionD spec: templates have no fixed font size, and when
// the content cannot be shown legibly the operator is told to split it across
// two screens instead of shrinking it silently.
import type { Item, Section } from "@/lib/supabase/types";

export type SectionWithItems = Section & { items: Item[] };

/** Usable height for the item area: 100vh minus header and footer. */
export const BODY_VH = 78;
/** One unit is a text line slot. Below this a name stops reading from five metres. */
export const MIN_UNIT_VH = 4.4;

const UNIT_HEADING = 1.7;
const UNIT_ITEM = 1.0;
const UNIT_ITEM_WITH_DESC = 1.55;

const COLUMN_CHOICES = [2, 3, 4] as const;

/** Past this many items a description stops helping and starts crowding (MotionD §10). */
export const MAX_ITEMS_WITH_DESCRIPTIONS = 18;
/** Past this many items thumbnails are too small to say anything. */
export const MAX_ITEMS_WITH_THUMBS = 28;

export type BoardFit = {
  columns: number;
  /** height of one unit, in vh */
  unitVh: number;
  showDescriptions: boolean;
  showThumbs: boolean;
  /** false → the content does not fit legibly on one screen */
  readable: boolean;
};

function hasDescription(it: Item): boolean {
  return !!(it.ai_caption ?? it.description);
}

/** Total content height in units for a given degradation step. */
export function countUnits(sections: SectionWithItems[], withDescriptions: boolean): number {
  let units = 0;
  for (const s of sections) {
    if (s.items.length === 0) continue;
    units += UNIT_HEADING;
    for (const it of s.items) {
      units += withDescriptions && hasDescription(it) ? UNIT_ITEM_WITH_DESC : UNIT_ITEM;
    }
  }
  return units;
}

export type BoardFitOptions = {
  bodyVh?: number;
  minUnitVh?: number;
  /** allow thumbnails at all (false when no item has a photo) */
  thumbsAvailable?: boolean;
};

/** Picks columns and sizes so the content exactly fills the body area.
 *  Degrades in the documented order: descriptions first, then thumbnails. */
export function computeBoardFit(
  sections: SectionWithItems[],
  opts: BoardFitOptions = {},
): BoardFit {
  const bodyVh = opts.bodyVh ?? BODY_VH;
  const minUnitVh = opts.minUnitVh ?? MIN_UNIT_VH;
  const thumbsAvailable =
    opts.thumbsAvailable ?? sections.some((s) => s.items.some((it) => !!it.image_url));

  // Density gates first (how much detail is still useful), height fitting after
  // (how much detail still physically fits).
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const allowDescriptions = totalItems <= MAX_ITEMS_WITH_DESCRIPTIONS;
  const allowThumbs = thumbsAvailable && totalItems <= MAX_ITEMS_WITH_THUMBS;

  const steps: { showDescriptions: boolean; showThumbs: boolean }[] = [
    { showDescriptions: allowDescriptions, showThumbs: allowThumbs },
    { showDescriptions: false, showThumbs: allowThumbs },
    { showDescriptions: false, showThumbs: false },
  ];

  for (const step of steps) {
    const units = countUnits(sections, step.showDescriptions);
    if (units === 0) {
      return { columns: 2, unitVh: bodyVh / 8, showDescriptions: true, showThumbs: false, readable: true };
    }
    for (const columns of COLUMN_CHOICES) {
      const unitVh = bodyVh / (units / columns);
      if (unitVh >= minUnitVh) {
        // Never blow the type up on a nearly empty screen either.
        return { columns, unitVh: Math.min(unitVh, minUnitVh * 2.4), ...step, readable: true };
      }
    }
  }

  // Too much content: render at the smallest legible size and let the admin warn.
  return {
    columns: 4,
    unitVh: minUnitVh,
    showDescriptions: false,
    showThumbs: false,
    readable: false,
  };
}
