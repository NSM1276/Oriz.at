import Link from "next/link";

// Building blocks of the owner's admin, so every page looks and reads the same:
// white cards on a warm ground, one small caps label per card, big numbers with a comparison.
// Sizes follow what owners know from the big merchant apps: 16-17 px text, 44 px tap targets.

export const cardClass = "rounded-2xl bg-white ring-1 ring-onyx/10";

export function Card({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return <section className={`${cardClass} ${padded ? "p-5" : ""} ${className}`}>{children}</section>;
}

export function Label({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A5C14]">{children}</p>
      {action}
    </div>
  );
}

export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-base font-medium text-onyx/75 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

/** "+12 %" in green, "−8 %" in red, nothing when there is nothing to compare with. */
export function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0) return now > 0 ? <span className="text-sm font-medium text-emerald-700">neu</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-sm text-onyx/55">gleich</span>;
  return (
    <span className={`text-sm font-medium ${pct > 0 ? "text-emerald-700" : "text-red-700"}`}>
      {pct > 0 ? "+" : "−"}{Math.abs(pct)} %
    </span>
  );
}

export function StatTile({
  value,
  title,
  hint,
  delta,
  href,
}: {
  value: string;
  title: string;
  hint?: React.ReactNode;
  delta?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-baseline gap-2">
        <p className="font-display text-4xl font-medium leading-none tabular-nums">{value}</p>
        {delta}
      </div>
      <p className="mt-1.5 text-base font-medium leading-tight">{title}</p>
      {hint && <p className="text-sm leading-snug text-onyx/60">{hint}</p>}
    </>
  );
  const cls = `${cardClass} block p-4`;
  return href ? <Link href={href} className={`${cls} active:bg-onyx/5`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-onyx/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** One row of a list inside a card: text left, chevron right, the whole row tappable. */
export function RowLink({ href, title, hint, external, tone }: { href: string; title: string; hint?: string; external?: boolean; tone?: "warn" }) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className={`block text-[17px] font-semibold leading-snug ${tone === "warn" ? "text-amber-900" : ""}`}>{title}</span>
        {hint && <span className="block text-base leading-snug text-onyx/60">{hint}</span>}
      </span>
      <span aria-hidden className="shrink-0 text-xl text-onyx/40">{external ? "↗" : "›"}</span>
    </>
  );
  const cls = "flex min-h-16 items-center justify-between gap-3 px-5 py-3 active:bg-onyx/5";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link href={href} className={cls}>{inner}</Link>
  );
}
