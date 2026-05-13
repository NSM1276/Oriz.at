type Props = {
  name: string;
  logoUrl: string | null;
  size?: "lg" | "md";
};

export function VenueLogo({ name, logoUrl, size = "lg" }: Props) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={size === "lg" ? "h-16 w-auto" : "h-10 w-auto"}
      />
    );
  }
  return (
    <h1
      className={
        size === "lg"
          ? "font-display text-5xl md:text-6xl tracking-wide text-onyx"
          : "font-display text-2xl text-onyx"
      }
    >
      {name}
    </h1>
  );
}
