"use client";

import type { GuestSection } from "@/lib/guest-menu";
import { DishMedia } from "./parts";

// A row of photo tiles, one per section (its first dish with a photo), like the "browse menu"
// tiles of me&u and the category carousel of FineDine. Only when enough sections have photos.

export const TILES_MIN = 3;

export function sectionTiles(sections: GuestSection[]): { id: string; name: string; image: string; count: number }[] {
  return sections
    .map((s) => ({ id: s.id, name: s.name, image: s.items.find((it) => it.imageUrl && !/\.(mp4|webm|mov)(\?|$)/i.test(it.imageUrl))?.imageUrl ?? "", count: s.items.length }))
    .filter((s) => s.image);
}

export function SectionTiles({ tiles, bleed, onJump }: { tiles: ReturnType<typeof sectionTiles>; bleed: string; onJump: (id: string) => void }) {
  return (
    <div className={`mt-5 flex gap-3 overflow-x-auto pb-1 ${bleed}`} style={{ scrollbarWidth: "none" }}>
      {tiles.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onJump(t.id)}
          className="group relative shrink-0 overflow-hidden text-left"
          style={{ width: 132, height: 96, borderRadius: 14, backgroundColor: "#111" }}
        >
          <DishMedia src={t.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-105" />
          <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 65%)" }} />
          <span className="absolute inset-x-2.5 bottom-2 font-sans text-[15px] font-semibold leading-tight text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
