"use client";

import { useState } from "react";

const LIMIT = 220;

export function AboutText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > LIMIT;
  const shown = !isLong || expanded ? text : `${text.slice(0, LIMIT).trimEnd()}…`;

  return (
    <div className="max-w-prose mx-auto text-center">
      <p
        className="font-display italic text-base md:text-lg leading-relaxed whitespace-pre-line"
        style={{ color: "var(--color-dim)" }}
      >
        {shown}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 font-sans text-[11px] tracking-regal uppercase transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
        >
          {expanded ? "Weniger" : "Mehr lesen"}
        </button>
      )}
    </div>
  );
}
