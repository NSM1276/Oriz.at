const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number, currency = "EUR"): string {
  const amount = cents / 100;
  if (currency === "EUR") return eur.format(amount);
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}
