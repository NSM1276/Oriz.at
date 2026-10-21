import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ORIZ — Verwaltung",
  robots: { index: false, follow: false },
};

// The owner app is deliberately neutral: the restaurant's own colours belong
// to the guest menu, not to the tool that edits it.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      {children}
    </div>
  );
}
