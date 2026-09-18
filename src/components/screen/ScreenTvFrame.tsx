import Image from "next/image";

// A TV bezel with a real screenshot of the board inside it.
// The images are captured from the live board at 1920×1080, so what the page
// shows is exactly what hangs on the wall — no mockup, no invented layout.

type Props = {
  /** path under /public, 16:9 */
  src: string;
  alt: string;
  /** shown under the frame */
  caption: string;
  /** load eagerly for the first frame on the page */
  priority?: boolean;
};

export function ScreenTvFrame({ src, alt, caption, priority = false }: Props) {
  return (
    <figure className="m-0">
      {/* bezel */}
      <div
        style={{
          padding: "clamp(6px, 1vw, 12px)",
          backgroundColor: "#0A0A0A",
          borderRadius: "clamp(6px, 0.9vw, 12px)",
          border: "1px solid rgba(245,240,236,0.10)",
          boxShadow: "0 30px 70px -20px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "16 / 9", backgroundColor: "#000" }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 92vw, 46vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>

      {/* stand */}
      <div className="flex flex-col items-center" aria-hidden>
        <div style={{ width: "14%", height: "clamp(6px, 1vw, 10px)", backgroundColor: "#0A0A0A" }} />
        <div style={{ width: "34%", height: "2px", backgroundColor: "#0A0A0A", borderRadius: "2px" }} />
      </div>

      <figcaption
        className="font-sans uppercase text-center mt-5"
        style={{ fontSize: "10px", letterSpacing: "0.18em", color: "rgba(10,10,10,0.35)" }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
