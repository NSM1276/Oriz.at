"use client";

import { QRCodeBlock } from "@/components/admin/QRCodeBlock";
import { ChangePasswordButton } from "@/components/admin/ChangePasswordButton";
import { AI_CAPTION_ENABLED } from "@/lib/feature-flags";

// Everything an owner needs rarely, folded away so the daily view stays short:
// QR code, print, the phone shortcut, plan and password. Collapsed by default,
// plain <details> so it works without JavaScript.

type Props = {
  slug: string;
  plan: string;
  aiUsed: number;
  aiLimit: number;
  isDark: boolean;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
};

const SHORTCUT_URL = "https://oriz.at/i";
const SHORTCUT_QR = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
  SHORTCUT_URL,
)}&bgcolor=ffffff&color=0a0a0a&margin=2`;

export function OwnerToolbox({
  slug, plan, aiUsed, aiLimit, isDark, text, dim, muted, border, accent,
}: Props) {
  const aiLow = AI_CAPTION_ENABLED && aiLimit - aiUsed <= 0;

  return (
    <details className="mb-10 group" style={{ border: `1px solid ${border}` }}>
      <summary
        className="font-sans text-[11px] tracking-regal uppercase px-5 py-4 cursor-pointer list-none flex items-center justify-between select-none"
        style={{ color: dim }}
      >
        <span>QR-Code, Drucken &amp; Konto</span>
        <span
          className="transition-transform duration-300 group-open:rotate-180"
          style={{ color: muted }}
          aria-hidden
        >
          ▾
        </span>
      </summary>

      <div className="px-5 pb-6 pt-1 space-y-8" style={{ borderTop: `1px solid ${border}` }}>
        {/* QR for the guest menu */}
        <div className="pt-6">
          <QRCodeBlock slug={slug} />
        </div>

        {/* Links */}
        <div className="flex gap-3 flex-wrap">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-80"
            style={{
              border: `1px solid ${isDark ? "rgba(245,240,236,0.35)" : "rgba(10,10,10,0.35)"}`,
              color: text,
            }}
          >
            Menü ansehen →
          </a>
          <a
            href={`/${slug}/print`}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-80"
            style={{ backgroundColor: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}
          >
            Menü drucken / PDF ↓
          </a>
        </div>

        {/* Phone shortcut */}
        <div className="flex items-start gap-5 flex-wrap">
          <div className="shrink-0 p-2 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHORTCUT_QR} alt="QR-Code zur Verwaltung" width={88} height={88} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-sans text-[10px] tracking-regal uppercase mb-1" style={{ color: muted }}>
              Auf dem Handy speichern
            </div>
            <div className="font-sans text-sm mb-2" style={{ color: text }}>
              oriz.at/i
            </div>
            <p className="font-sans text-xs leading-relaxed" style={{ color: dim }}>
              Diesen Code mit der Handy-Kamera scannen, dann im Browser auf
              „Zum Home-Bildschirm“ tippen. Danach öffnet ein Symbol Ihre
              Verwaltung direkt — ohne Adresse eintippen.
            </p>
          </div>
        </div>

        {/* Plan + account */}
        <div
          className="flex items-center justify-between gap-4 flex-wrap pt-6"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-sans text-[10px] tracking-regal uppercase" style={{ color: muted }}>
                Plan
              </span>
              <span className="font-display text-lg capitalize" style={{ color: text }}>
                {plan}
              </span>
            </div>
            {AI_CAPTION_ENABLED && (
              <div className="flex items-center gap-3">
                <span className="font-sans text-[10px] tracking-regal uppercase" style={{ color: muted }}>
                  AI-Texte
                </span>
                <span className="font-display text-lg tabular-nums">
                  <span style={{ color: aiLow ? (isDark ? "#FCA5A5" : "#DC2626") : text }}>{aiUsed}</span>
                  <span style={{ color: muted }}> / {aiLimit}</span>
                </span>
              </div>
            )}
          </div>
          <ChangePasswordButton />
        </div>
      </div>
    </details>
  );
}
