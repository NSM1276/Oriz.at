// Texts of the main page, German and English. The layout lives in components/landing/HomePage.tsx.
// One plan with its price on the page (lib/offer.ts). Nobody signs up from here: the page leads to
// a WhatsApp message or a call, and the account is opened through a personal link afterwards.
// Setup and photo editing are "on request" — no price is printed for them.

import { PRICE_MONTH, PRICE_YEAR, TRIAL_DAYS } from "./offer.ts";

export type Pair = { title: string; body: string };

export type HomeCopy = {
  lang: "de" | "en";
  path: "/" | "/en";
  meta: { title: string; description: string; ogTitle: string; ogDescription: string; ogLocale: string };
  skip: string;
  homeLabel: string;
  navLabel: string;
  nav: { steps: string; price: string; faq: string; login: string };
  /** Link to the other language version, shown in the header. */
  switcher: { href: string; label: string; ariaLabel: string; hrefLang: string };
  /** Text already typed into the WhatsApp chat a visitor opens from this page. */
  whatsappText: string;
  contact: { whatsapp: string; call: string; mail: string };
  hero: {
    eyebrow: string;
    h1: [string, string, string];
    lead: string;
    ctaDemo: string;
    note: string;
    /** Only the English page: the owner app is in German for now. */
    langNote: string | null;
    demoTitle: string;
    demoCaption: string;
    demoFull: string;
  };
  stepsHeading: string;
  steps: Pair[];
  reasonsHeading: string;
  reasons: Pair[];
  price: {
    eyebrow: string;
    heading: string;
    month: string;
    year: string;
    trial: string;
    includedLabel: string;
    included: string[];
    extraLabel: string;
    extra: string[];
    note: string;
  };
  person: { eyebrow: string; heading: string; body: string; role: string };
  faqHeading: string;
  faq: { q: string; a: string }[];
  footer: { label: string; tagline: string; login: string };
  jsonLd: { description: string; inLanguage: string[] };
};

export const HOME_DE: HomeCopy = {
  lang: "de",
  path: "/",
  meta: {
    title: "Digitale Speisekarte per QR-Code für Wien | ORIZ",
    description: `Digitale Speisekarte für Restaurants und Cafés in Wien: QR-Code am Tisch, Allergene, fünf Sprachen, Kellner rufen. ${PRICE_MONTH} im Monat. Persönlich eingerichtet.`,
    ogTitle: "Digitale Speisekarte per QR-Code — ORIZ, Wien",
    ogDescription: "Ihre Karte am Handy Ihrer Gäste. Preise ändern Sie selbst, in Sekunden. Wir übersetzen sie für Sie.",
    ogLocale: "de_AT",
  },
  skip: "Zum Inhalt springen",
  homeLabel: "ORIZ — Startseite",
  navLabel: "Hauptnavigation",
  nav: { steps: "So geht’s", price: "Preis", faq: "Fragen", login: "Login" },
  switcher: { href: "/en", label: "EN", ariaLabel: "English version", hrefLang: "en" },
  whatsappText: "Guten Tag, ich interessiere mich für ORIZ.",
  contact: { whatsapp: "WhatsApp schreiben", call: "Anrufen", mail: "E-Mail" },
  hero: {
    eyebrow: "Digitale Speisekarte · aus Wien",
    h1: ["Ihre Speisekarte.", "Am Handy Ihrer Gäste.", "Immer aktuell."],
    lead: "Gäste scannen den QR-Code am Tisch und sehen Ihre Karte. Preise und Gerichte ändern Sie selbst, in Sekunden.",
    ctaDemo: "Beispiel-Karte ansehen",
    note: "Keine App für Ihre Gäste · Monatlich kündbar · Daten in der EU",
    langNote: null,
    demoTitle: "Beispiel: Speisekarte der Trattoria Belvedere",
    demoCaption: "Eine echte Karte. Scrollen Sie durch.",
    demoFull: "Groß öffnen",
  },
  stepsHeading: "So einfach geht es.",
  steps: [
    { title: "Wir sprechen kurz.", body: "Per WhatsApp, am Telefon oder bei Ihnen im Lokal. Danach bekommen Sie Ihren persönlichen Zugang." },
    { title: "Ihre Karte kommt hinein.", body: "Text einfügen oder Datei hochladen. Oder Sie schicken uns die Karte und wir tragen sie ein." },
    { title: "QR-Code auf den Tisch.", body: "Aufkleber drucken, hinstellen, fertig. Ab jetzt ändern Sie alles am Handy." },
  ],
  reasonsHeading: "Warum ORIZ.",
  reasons: [
    { title: "Wir übersetzen Ihre Karte für Sie.", body: "Mit unserem eigenen Küchen-Wörterbuch für 20 Sprachen. Damit der Tafelspitz auch auf Englisch stimmt." },
    { title: "Allergene, wie Österreich sie verlangt.", body: "Die 14 Allergene mit den Buchstaben A bis R, bei jedem Gericht. Gäste filtern nach dem, was sie nicht vertragen." },
    { title: "Gäste rufen den Kellner vom Tisch.", body: "Bestellen, zahlen, Hilfe: ein Tipp am Handy. Ihr Team sieht sofort, welcher Tisch ruft." },
    { title: "Die Papierkarte gleich dazu.", body: "Aus denselben Daten drucken Sie Ihre Karte als A4-Blatt. Preis geändert, ein Blatt neu, fertig." },
  ],
  price: {
    eyebrow: "Preis",
    heading: "Ein Preis. Alles dabei.",
    month: `${PRICE_MONTH} im Monat`,
    year: `oder ${PRICE_YEAR} im Jahr`,
    trial: `${TRIAL_DAYS} Tage kostenlos testen. Monatlich kündbar, ohne Einrichtungsgebühr.`,
    includedLabel: "Inklusive",
    included: [
      "Beliebig viele Gerichte, Fotos und Bereiche",
      "Fünf Sprachen: Deutsch, Englisch, Italienisch, Französisch, Spanisch",
      "Allergene A bis R mit Filter für Gäste",
      "QR-Code für jeden Tisch und „Kellner rufen“",
      "Druckfertige Karte als PDF",
      "Ihre Farben, Ihr Logo, Ihre eigene Adresse",
    ],
    extraLabel: "Auf Anfrage",
    extra: [
      "Wir tragen Ihre Karte für Sie ein",
      "Weitere Sprachen, bis zu 20",
      "Wir bearbeiten Ihre Gerichtsfotos",
    ],
    note: "Endpreise, keine Umsatzsteuer (Kleinunternehmerregelung).",
  },
  person: {
    eyebrow: "Persönlich",
    heading: "Ich zeige es Ihnen gerne.",
    body: "Zehn Minuten bei Ihnen im Lokal oder am Telefon. Sie sehen Ihre eigene Karte am Handy, bevor Sie sich entscheiden.",
    role: "ORIZ, Wien",
  },
  faqHeading: "Häufige Fragen.",
  faq: [
    {
      q: "Brauchen meine Gäste eine App?",
      a: "Nein. Gäste scannen den QR-Code mit der normalen Handykamera, die Karte öffnet sich im Browser. Kein Download, keine Anmeldung.",
    },
    {
      q: "Wie bekomme ich einen Zugang?",
      a: `Schreiben Sie mir per WhatsApp oder rufen Sie an. Nach einem kurzen Gespräch bekommen Sie Ihren persönlichen Link und testen ${TRIAL_DAYS} Tage kostenlos.`,
    },
    {
      q: "Kann ich die Karte selbst ändern?",
      a: "Ja, jederzeit und am Handy: Preise, Beschreibungen, Fotos, Allergene, neue Gerichte. Ein Gericht als „ausverkauft“ markieren dauert einen Tipp.",
    },
    {
      q: "Ich habe keine Zeit, die Karte einzutippen.",
      a: "Schicken Sie uns Fotos Ihrer Karte, ein PDF oder einen Link. Wir tragen alles ein. Den Preis dafür sagen wir Ihnen vorher, er hängt von der Größe Ihrer Karte ab.",
    },
    {
      q: "Brauche ich die Papierkarte danach nicht mehr?",
      a: "Das entscheiden Sie. Viele Lokale lassen eine Papierkarte liegen und stellen zusätzlich den QR-Code auf. Die Papierkarte drucken Sie aus denselben Daten.",
    },
    {
      q: "Wo liegen unsere Daten?",
      a: "Datenbank und Fotos liegen in Frankfurt. ORIZ ist ein Wiener Unternehmen; Impressum und Datenschutzerklärung finden Sie ganz unten.",
    },
  ],
  footer: { label: "Fußzeile", tagline: "Wien · Daten in der EU", login: "Restaurant-Login" },
  jsonLd: {
    description: "Digitale Speisekarte per QR-Code für Restaurants, Cafés und Bars: Allergene, mehrere Sprachen, Kellner rufen, druckfertige Karte.",
    inLanguage: ["de", "en", "it", "fr", "es"],
  },
};

export const HOME_EN: HomeCopy = {
  lang: "en",
  path: "/en",
  meta: {
    title: "Digital menu with QR code for restaurants in Vienna | ORIZ",
    description: `Digital menu for restaurants and cafés in Vienna: QR code on the table, allergens, five languages, call the waiter. ${PRICE_MONTH} a month. Set up in person.`,
    ogTitle: "Digital menu with QR code — ORIZ, Vienna",
    ogDescription: "Your menu on your guests' phones. You change prices yourself, in seconds. We translate it for you.",
    ogLocale: "en_GB",
  },
  skip: "Skip to content",
  homeLabel: "ORIZ — home",
  navLabel: "Main navigation",
  nav: { steps: "How it works", price: "Price", faq: "Questions", login: "Login" },
  switcher: { href: "/", label: "DE", ariaLabel: "Deutsche Version", hrefLang: "de" },
  whatsappText: "Hello, I am interested in ORIZ.",
  contact: { whatsapp: "Message on WhatsApp", call: "Call", mail: "E-mail" },
  hero: {
    eyebrow: "Digital menu · from Vienna",
    h1: ["Your menu.", "On your guests' phones.", "Always up to date."],
    lead: "Guests scan the QR code on the table and see your menu. You change prices and dishes yourself, in seconds.",
    ctaDemo: "See a sample menu",
    note: "No app for your guests · Cancel monthly · Data in the EU",
    langNote: "The owner's dashboard is in German for now. We are happy to help in English.",
    demoTitle: "Sample: menu of Trattoria Belvedere",
    demoCaption: "A real menu. Scroll through it.",
    demoFull: "Open full size",
  },
  stepsHeading: "It is this simple.",
  steps: [
    { title: "We talk briefly.", body: "On WhatsApp, by phone or at your place. Then you get your personal access." },
    { title: "Your menu goes in.", body: "Paste the text or upload a file. Or send us the menu and we enter it for you." },
    { title: "QR code on the table.", body: "Print the stickers, put them out, done. From now on you change everything on your phone." },
  ],
  reasonsHeading: "Why ORIZ.",
  reasons: [
    { title: "We translate your menu for you.", body: "With our own kitchen dictionary for 20 languages. So that Tafelspitz is right in English too." },
    { title: "Allergens the way Austria requires.", body: "The 14 allergens with the letters A to R, on every dish. Guests filter by what they cannot eat." },
    { title: "Guests call the waiter from the table.", body: "Order, pay, help: one tap on the phone. Your team sees at once which table is calling." },
    { title: "The paper menu comes with it.", body: "From the same data you print your menu as an A4 sheet. Price changed, one sheet reprinted, done." },
  ],
  price: {
    eyebrow: "Price",
    heading: "One price. Everything included.",
    month: `${PRICE_MONTH} a month`,
    year: `or ${PRICE_YEAR} a year`,
    trial: `Try it free for ${TRIAL_DAYS} days. Cancel monthly, no setup fee.`,
    includedLabel: "Included",
    included: [
      "As many dishes, photos and sections as you like",
      "Five languages: German, English, Italian, French, Spanish",
      "Allergens A to R with a filter for guests",
      "A QR code for every table and “call the waiter”",
      "Print-ready menu as a PDF",
      "Your colours, your logo, your own address",
    ],
    extraLabel: "On request",
    extra: [
      "We enter your menu for you",
      "More languages, up to 20",
      "We edit your dish photos",
    ],
    note: "Final prices, no VAT (Austrian small-business rule).",
  },
  person: {
    eyebrow: "In person",
    heading: "I am happy to show you.",
    body: "Ten minutes at your place or on the phone. You see your own menu on a phone before you decide.",
    role: "ORIZ, Vienna",
  },
  faqHeading: "Common questions.",
  faq: [
    {
      q: "Do my guests need an app?",
      a: "No. Guests scan the QR code with the normal phone camera and the menu opens in the browser. No download, no sign-up.",
    },
    {
      q: "How do I get access?",
      a: `Message me on WhatsApp or call. After a short talk you get your personal link and try it free for ${TRIAL_DAYS} days.`,
    },
    {
      q: "Can I change the menu myself?",
      a: "Yes, any time and on your phone: prices, descriptions, photos, allergens, new dishes. Marking a dish as sold out takes one tap.",
    },
    {
      q: "I have no time to type in the menu.",
      a: "Send us photos of your menu, a PDF or a link. We enter everything. We tell you the price beforehand; it depends on the size of your menu.",
    },
    {
      q: "Do I still need the paper menu?",
      a: "That is up to you. Many places keep a paper menu and put the QR code next to it. You print the paper menu from the same data.",
    },
    {
      q: "Where is our data stored?",
      a: "Database and photos are in Frankfurt. ORIZ is a Viennese company; the legal notice and privacy policy are at the bottom of the page.",
    },
  ],
  footer: { label: "Footer", tagline: "Vienna · Data in the EU", login: "Restaurant login" },
  jsonLd: {
    description: "Digital menu with QR code for restaurants, cafés and bars: allergens, several languages, call the waiter, print-ready menu.",
    inLanguage: ["de", "en", "it", "fr", "es"],
  },
};
