type Props = {
  name: string;
  logoUrl: string | null;
  size?: "lg" | "md";
  textColor?: string;
  isDarkBg?: boolean;
};

export function VenueLogo({ name, logoUrl, size = "lg", textColor, isDarkBg }: Props) {
  if (logoUrl) {
    const isSvg = logoUrl.toLowerCase().endsWith(".svg");
    const style = isSvg && isDarkBg ? { filter: "invert(1)" } : undefined;
    return (
      <img
        src={logoUrl}
        alt={name}
        className={size === "lg" ? "h-16 w-auto" : "h-10 w-auto"}
        style={style}
      />
    );
  }
  return (
    <h1
      className={size === "lg" ? "font-display text-5xl md:text-6xl tracking-wide" : "font-display text-2xl"}
      style={{ color: textColor ?? '#0A0A0A' }}
    >
      {name}
    </h1>
  );
}
