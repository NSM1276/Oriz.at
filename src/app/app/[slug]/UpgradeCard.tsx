import { lockedText, upgradeMailto } from "@/lib/entitlements";
import { PRICE_MONTH, PRICE_YEAR } from "@/lib/offer";

/** Shown where a feature of the plan would be. Until payment runs through Stripe, switching on is a mail to us. */
export function UpgradeCard({ feature, venueName }: { feature: "screen" | "menus" | "printDesign"; venueName: string }) {
  const text = lockedText(feature);
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-onyx/10">
      <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">Abo</p>
      <h1 className="mt-1 text-xl font-semibold">{text.title}</h1>
      <p className="mt-2 text-onyx/70">{text.body}</p>
      <p className="mt-2 text-base text-onyx/60">Das Abo kostet {PRICE_MONTH} im Monat oder {PRICE_YEAR} im Jahr. Die Testphase enthält alles.</p>
      <a
        href={upgradeMailto(venueName)}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-onyx px-5 text-base font-medium text-white"
      >
        Abo anfragen
      </a>
    </section>
  );
}
