import { PLAN_PRICE_EUR, lockedText, upgradeMailto } from "@/lib/entitlements";

/** Shown where a Pro feature would be. Until payment runs through Stripe, switching on is a mail to us. */
export function UpgradeCard({ feature, venueName }: { feature: "screen" | "menus" | "printDesign"; venueName: string }) {
  const text = lockedText(feature);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Pro</p>
      <h1 className="mt-1 text-xl font-semibold">{text.title}</h1>
      <p className="mt-2 text-stone-600">{text.body}</p>
      <p className="mt-2 text-sm text-stone-500">Pro kostet {PLAN_PRICE_EUR.pro} € pro Monat (netto). Die Testphase enthält alle Pro-Funktionen.</p>
      <a
        href={upgradeMailto(venueName)}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-medium text-white"
      >
        Pro anfragen
      </a>
    </section>
  );
}
