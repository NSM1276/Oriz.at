"use client";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  return (
    <section>
      <h2
        className="font-sans text-[11px] tracking-regal uppercase mb-4 text-center"
        style={{ color: "var(--color-muted)" }}
      >
        Galerie
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${name} — Bild ${i + 1}`}
            loading="lazy"
            className="w-full aspect-square object-cover rounded-lg"
            style={{ border: "1px solid var(--color-border)" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
      </div>
    </section>
  );
}
