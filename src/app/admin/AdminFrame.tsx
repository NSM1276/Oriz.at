import { AdminNav } from "./AdminNav";

// The frame of the platform admin: the same dark header and bottom bar the owners know from
// their own admin, so both feel like one product. Every /admin page for platform admins uses it.
export function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment font-sans text-onyx [color-scheme:light]">
      <header className="sticky top-0 z-20 bg-onyx text-parchment">
        <div className="mx-auto max-w-3xl px-4 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="flex items-baseline gap-3 pb-3">
            <p className="font-display text-[26px] font-medium leading-tight">ORIZ</p>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Verwaltung</p>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pb-16">{children}</main>
    </div>
  );
}

/** Page heading: one big title, an optional line under it and an optional button on the right. */
export function AdminTitle({ title, line, action }: { title: string; line?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-4xl font-medium leading-tight">{title}</h1>
        {line && <p className="mt-1 text-base text-onyx/65">{line}</p>}
      </div>
      {action}
    </div>
  );
}
