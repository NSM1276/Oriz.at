"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-onyx shrink-0">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <span className="font-display text-2xl text-parchment tracking-wide">ORIZ</span>
          <p className="font-sans text-[10px] tracking-regal uppercase text-gold mt-0.5">Super Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-none text-parchment/80 hover:text-parchment hover:bg-white/5 transition font-sans text-[13px] tracking-wide"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 opacity-60">
              <path d="M2 3.5A1.5 1.5 0 013.5 2h8A1.5 1.5 0 0113 3.5v8A1.5 1.5 0 0111.5 13h-8A1.5 1.5 0 012 11.5v-8z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7h5M5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Venues
          </a>
          <a
            href="/admin/leads"
            className="flex items-center gap-3 px-3 py-2 rounded-none text-parchment/80 hover:text-parchment hover:bg-white/5 transition font-sans text-[13px] tracking-wide"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 opacity-60">
              <path d="M2 4l5.5 4L13 4M2 4v7a1 1 0 001 1h9a1 1 0 001-1V4M2 4a1 1 0 011-1h9a1 1 0 011 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Leads
          </a>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-parchment/50 hover:text-parchment/80 transition font-sans text-[13px] tracking-wide"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
              <path d="M9 2H3.5A1.5 1.5 0 002 3.5v8A1.5 1.5 0 003.5 13H9M11 5l3 2.5L11 10M6 7.5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
