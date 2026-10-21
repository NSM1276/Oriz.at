import type { CSSProperties, SyntheticEvent } from "react";
import { isVideoUrl } from "@/lib/media";

/** A dish photo, or a muted looping clip when the owner uploaded a video. */
export function ItemPicture({
  src,
  alt,
  className,
  style,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  onError?: (e: SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        aria-label={alt || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
        style={style}
        onError={onError}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} onError={onError} />;
}
