"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="font-sans text-[11px] tracking-regal uppercase px-6 py-3 bg-onyx text-parchment hover:opacity-80 transition shadow-lg"
    >
      Drucken / PDF speichern
    </button>
  );
}
