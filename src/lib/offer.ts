// What ORIZ costs, in the words the public pages use. One plan (decided 2026-11-12).
// Final prices: no VAT is charged (Kleinunternehmerregelung). No runtime imports — unit-tested.

export const PRICE_MONTH_CENTS = 19_90;
export const PRICE_YEAR_CENTS = 180_00;
export const TRIAL_DAYS = 14;

// Written out by hand instead of toLocaleString: the server and a browser must print the same text.
function euro(cents: number): string {
  const whole = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest ? `${whole},${String(rest).padStart(2, "0")} €` : `${whole} €`;
}

/** "19,90 €" */
export const PRICE_MONTH = euro(PRICE_MONTH_CENTS);
/** "180 €" */
export const PRICE_YEAR = euro(PRICE_YEAR_CENTS);
