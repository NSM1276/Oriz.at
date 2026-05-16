"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";

type Section = { heading: string; body: string };
type Doc = { title: string; sections: Section[] };

const IMPRESSUM_DE: Doc = {
  title: "Impressum",
  sections: [
    {
      heading: "Gemäß § 5 ECG",
      body: "Nasim Nuridinov e.U\nTscherttegasse 39, 1120 Wien, Österreich\nE-Mail: office@oriz.at\nTelefon: +43 677 64292055",
    },
    {
      heading: "Unternehmensgegenstand",
      body: "Webdesign & Webentwicklung",
    },
    {
      heading: "UID-Nummer",
      body: "ATU80802758",
    },
    {
      heading: "Aufsichtsbehörde",
      body: "Magistrat der Stadt Wien · Mitglied der WKO Wien",
    },
    {
      heading: "Haftungsausschluss",
      body: "Alle Inhalte dieser Website wurden sorgfältig erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Informationen wird keine Gewähr übernommen.",
    },
  ],
};

const IMPRESSUM_EN: Doc = {
  title: "Imprint",
  sections: [
    {
      heading: "Pursuant to § 5 ECG",
      body: "Nasim Nuridinov e.U\nTscherttegasse 39, 1120 Vienna, Austria\nEmail: office@oriz.at\nPhone: +43 677 64292055",
    },
    {
      heading: "Business activity",
      body: "Web Design & Web Development",
    },
    {
      heading: "VAT number",
      body: "ATU80802758",
    },
    {
      heading: "Supervisory authority",
      body: "Magistrat der Stadt Wien · Member of WKO Wien",
    },
    {
      heading: "Disclaimer",
      body: "All content on this website has been carefully created. No guarantee is given for the accuracy, completeness or timeliness of the information provided.",
    },
  ],
};

const DATENSCHUTZ_DE: Doc = {
  title: "Datenschutzerklärung",
  sections: [
    {
      heading: "Verantwortlicher gemäß DSGVO",
      body: "Nasim Nuridinov e.U\nTscherttegasse 39, 1120 Wien\nE-Mail: office@oriz.at",
    },
    {
      heading: "Welche Daten wir verarbeiten",
      body: "Diese Website erhebt keine personenbezogenen Daten über Formulare oder Tracking. Es werden keine Cookies gesetzt.\n\nlocalStorage wird ausschließlich dazu verwendet, Ihre Sprachpräferenz (DE/EN) zu speichern. Dies ist eine technisch notwendige Funktion und bedarf keiner Einwilligung (§ 25 Abs. 2 TDSG).",
    },
    {
      heading: "Schriftarten (selbst gehostet)",
      body: "Diese Website verwendet die Schriftarten Inter Tight und Instrument Serif, die ausschließlich von unserem eigenen Server geladen werden. Es werden keine Daten an Dritte übertragen.",
    },
    {
      heading: "Kontakt per E-Mail oder Telefon",
      body: "Wenn Sie uns per E-Mail oder Telefon kontaktieren, werden Ihre Daten zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.",
    },
    {
      heading: "Ihre Rechte",
      body: "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit. Beschwerden können bei der Österreichischen Datenschutzbehörde (dsb.gv.at) eingereicht werden.",
    },
  ],
};

const DATENSCHUTZ_EN: Doc = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "Controller under GDPR",
      body: "Nasim Nuridinov e.U, Tscherttegasse 39, 1120 Vienna\nEmail: office@oriz.at",
    },
    {
      heading: "What data we process",
      body: "This website does not collect personal data through forms or tracking. No cookies are set.\n\nlocalStorage is used exclusively to remember your language preference (DE/EN). This is a technically necessary function and requires no consent (§ 25 (2) TDSG).",
    },
    {
      heading: "Fonts (self-hosted)",
      body: "This website uses the fonts Inter Tight and Instrument Serif, loaded exclusively from our own server. No data is transferred to third parties.",
    },
    {
      heading: "Contact by email or phone",
      body: "If you contact us by email or phone, your details will be used to process your enquiry and will not be passed on to third parties. Legal basis: Art. 6(1)(b) GDPR.",
    },
    {
      heading: "Your rights",
      body: "You have the right to access, rectification, erasure, restriction of processing and data portability. Complaints may be lodged with the Austrian Data Protection Authority (dsb.gv.at).",
    },
  ],
};

const DOCS: Record<Locale, { impressum: Doc; datenschutz: Doc }> = {
  de: { impressum: IMPRESSUM_DE, datenschutz: DATENSCHUTZ_DE },
  en: { impressum: IMPRESSUM_EN, datenschutz: DATENSCHUTZ_EN },
};

function Modal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(10,10,10,0.80)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto bg-onyx text-parchment"
        style={{ borderTop: "1px solid rgba(198,155,60,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 bg-onyx flex items-center justify-between px-8 py-5"
          style={{ borderBottom: "1px solid rgba(245,240,236,0.07)" }}
        >
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
            {doc.title}
          </span>
          <button
            onClick={onClose}
            className="font-sans text-[10px] tracking-regal uppercase text-parchment/30 hover:text-gold transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-8">
          {doc.sections.map(({ heading, body }) => (
            <div key={heading}>
              <div className="font-sans text-[10px] tracking-regal uppercase text-parchment/35 mb-2">
                {heading}
              </div>
              <p className="font-display text-sm text-parchment/60 italic leading-relaxed whitespace-pre-line">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LegalLinks() {
  const { locale, t } = useT();
  const [open, setOpen] = useState<"impressum" | "datenschutz" | null>(null);

  const docs = DOCS[locale];

  return (
    <>
      <div className="flex gap-6">
        <button
          onClick={() => setOpen("impressum")}
          className="font-sans text-[10px] tracking-regal uppercase text-parchment/20 hover:text-gold transition-colors"
        >
          {t.legal.impressum}
        </button>
        <button
          onClick={() => setOpen("datenschutz")}
          className="font-sans text-[10px] tracking-regal uppercase text-parchment/20 hover:text-gold transition-colors"
        >
          {t.legal.datenschutz}
        </button>
      </div>

      {open === "impressum" && (
        <Modal doc={docs.impressum} onClose={() => setOpen(null)} />
      )}
      {open === "datenschutz" && (
        <Modal doc={docs.datenschutz} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
