// Texts of the main page, German and English. The layout lives in components/landing/HomePage.tsx.
// Plan prices are deliberately NOT on this page (owner decision: no public pricing here); the plans
// are on /carta. Only the one-off setup service shows its price (SETUP_PRICE, set from lib/services.ts).

export const SETUP_PRICE: { de: string; en: string } | null = {
  de: "ab € 149 für bis zu 80 Gerichte",
  en: "from € 149 for up to 80 dishes",
};

export type Pair = { title: string; body: string };

export type HomeCopy = {
  lang: "de" | "en";
  path: "/" | "/en";
  meta: { title: string; description: string; ogTitle: string; ogDescription: string; ogLocale: string };
  skip: string;
  homeLabel: string;
  navLabel: string;
  nav: { features: string; steps: string; faq: string; login: string };
  headerCta: string;
  /** Link to the other language version, shown in the header. */
  switcher: { href: string; label: string; ariaLabel: string; hrefLang: string };
  hero: {
    eyebrow: string;
    h1: [string, string, string];
    lead: string;
    ctaPrimary: string;
    ctaDemo: string;
    note: string;
    /** Only the English page: the owner app and sign-up are in German for now. */
    langNote: string | null;
    demoTitle: string;
    demoCaption: string;
    demoFull: string;
  };
  factsLabel: string;
  facts: { big: string; label: string; body: string }[];
  painsHeading: string;
  pains: Pair[];
  painsClosing: string;
  featuresEyebrow: string;
  featuresHeading: string;
  features: Pair[];
  featuresTv: string;
  stepsEyebrow: string;
  stepsHeading: string;
  steps: { n: string; title: string; body: string }[];
  stepsCta: string;
  done: { eyebrow: string; heading: string; body: string; note: string; cta: string };
  whoHeading: string;
  venues: string[];
  faqEyebrow: string;
  faqHeading: string;
  faq: { q: string; a: string }[];
  final: { heading: string; body: string; cta: string; questions: string; or: string };
  footer: { label: string; tagline: string; pricing: string; login: string };
  jsonLd: { description: string; inLanguage: string[] };
};

export const HOME_DE: HomeCopy = {
  lang: "de",
  path: "/",
  meta: {
    title: "Digitale Speisekarte per QR-Code für Wien | ORIZ Carta",
    description:
      "Digitale Speisekarte für Restaurants & Cafés in Wien: QR-Code am Tisch, Allergene, Fotos, mehrere Sprachen. Preise in Sekunden ändern. 14 Tage kostenlos testen.",
    ogTitle: "Digitale Speisekarte per QR-Code — ORIZ Carta, Wien",
    ogDescription:
      "Ihre Karte auf jedem Handy: Fotos, 14 EU-Allergene, vier Sprachen. Preis geändert? Gericht aus? Ein Tap, kein Neudruck.",
    ogLocale: "de_AT",
  },
  skip: "Zum Inhalt springen",
  homeLabel: "ORIZ — Startseite",
  navLabel: "Hauptnavigation",
  nav: { features: "Funktionen", steps: "So geht’s", faq: "Fragen", login: "Login" },
  headerCta: "Kostenlos testen",
  switcher: { href: "/en", label: "EN", ariaLabel: "English version", hrefLang: "en" },
  hero: {
    eyebrow: "Digitale Speisekarte · aus Wien",
    h1: ["Ihre Speisekarte.", "Auf jedem Handy.", "In Sekunden aktuell."],
    lead: "Gäste scannen den QR-Code am Tisch und sehen Ihre Karte — mit Fotos, Allergenen und in vier Sprachen. Preis geändert? Gericht aus? Ein Tap, kein Neudruck.",
    ctaPrimary: "14 Tage kostenlos testen",
    ctaDemo: "Live-Demo ansehen",
    note: "Keine App für Ihre Gäste · Monatlich kündbar · Daten in der EU",
    langNote: null,
    demoTitle: "Live-Demo: Speisekarte der Trattoria Belvedere",
    demoCaption: "Das ist die echte Karte der Trattoria Belvedere — scrollen Sie durch.",
    demoFull: "Im Vollbild öffnen",
  },
  factsLabel: "Auf einen Blick",
  facts: [
    { big: "14", label: "EU-Allergene", body: "pro Gericht, mit den Codes A–R" },
    { big: "4", label: "Sprachen", body: "Deutsch, Englisch, Italienisch, Ukrainisch" },
    { big: "0", label: "Apps für Ihre Gäste", body: "Kamera auf den QR-Code, fertig" },
    { big: "Sek.", label: "statt Neudruck", body: "Preis ändern, Gericht ausverkauft melden" },
  ],
  painsHeading: "Die Papierkarte kostet Sie Geld und Nerven.",
  pains: [
    { title: "Neudruck bei jeder Preisänderung", body: "Jede Korrektur kostet Geld, und bis die neue Karte da ist, stimmt sie nicht." },
    { title: "Allergene: veraltet oder vergessen", body: "Falsche Angaben sind ein Risiko für Ihre Gäste — und für Sie." },
    { title: "Touristen verstehen die Karte nicht", body: "Wer die Gerichte nicht kennt, bestellt vorsichtig — oder das Günstigste." },
    { title: "Das PDF auf der Website", body: "Winzig am Handy, langsam beim Laden, vom Vorjahr." },
  ],
  painsClosing: "ORIZ Carta ersetzt das alles — mit einer Karte, die immer stimmt.",
  featuresEyebrow: "Funktionen",
  featuresHeading: "Alles, was eine gute Speisekarte braucht.",
  features: [
    { title: "Fotos und drei Erscheinungsbilder", body: "Klassisch wie Papier, mit großen Fotos oder modern in Karten. In Ihren Farben, mit Ihrem Logo." },
    { title: "Allergene nach EU-Recht", body: "Alle 14 Allergengruppen pro Gericht. Gäste filtern nach dem, was sie nicht vertragen." },
    { title: "Größen und mehrere Preise", body: "0,3 l und 0,5 l, Glas und Flasche, klein und groß — sauber dargestellt, ohne Tricks." },
    { title: "Ausverkauft in einem Tap", body: "Das Schnitzel ist aus? Ein Tap am Handy — und kein Gast bestellt es mehr." },
    { title: "Vier Sprachen", body: "Gäste wählen Deutsch, Englisch, Italienisch oder Ukrainisch. Auch die Allergene übersetzen sich mit." },
    { title: "Service per Tap", body: "Gäste rufen die Bedienung mit Tischnummer. Ihr Team sieht jeden Ruf sofort auf Handy oder Tablet." },
  ],
  featuresTv: "Auch als Bildschirm für den Fernseher an der Wand: Ihre Karte läuft dort automatisch mit.",
  stepsEyebrow: "So geht’s",
  stepsHeading: "In drei Schritten online.",
  steps: [
    { n: "1", title: "Konto anlegen", body: "In zwei Minuten. Name Ihres Lokals, E-Mail, Passwort." },
    { n: "2", title: "Karte eintragen", body: "Text Ihrer Karte einfügen — Bereiche, Preise, Größen und Allergene werden erkannt. Oder wir tippen sie für Sie ein." },
    { n: "3", title: "QR-Code aufstellen", body: "Tischaufsteller drucken und hinstellen. Ab jetzt ändern Sie alles am Handy." },
  ],
  stepsCta: "Jetzt kostenlos starten",
  done: {
    eyebrow: "Keine Zeit?",
    heading: "Wir machen Ihre Karte für Sie.",
    body: "Schicken Sie uns Fotos Ihrer Karte, ein PDF oder einen Link. Wir tragen jedes Gericht von Hand ein — mit Preisen, Größen und Allergenen, auf Wunsch mit Übersetzungen. Dazu bearbeiten wir Ihre Gerichtsfotos, damit sie ruhig und einheitlich aussehen.",
    note: "Einmalig, ohne Abo. Menschen statt Automatik: Sie bekommen, was auf Ihrer Karte steht.",
    cta: "Konto anlegen und bestellen",
  },
  whoHeading: "Für Gastronomie in Wien und ganz Österreich.",
  venues: ["Restaurants", "Cafés", "Bars", "Heurige", "Hotel-Restaurants", "Imbisse & Bistros"],
  faqEyebrow: "Häufige Fragen",
  faqHeading: "Gut zu wissen.",
  faq: [
    {
      q: "Brauchen meine Gäste eine App?",
      a: "Nein. Gäste scannen den QR-Code mit der normalen Handykamera, die Karte öffnet sich im Browser. Kein Download, keine Anmeldung.",
    },
    {
      q: "Was kostet ORIZ Carta?",
      a: "Die ersten 14 Tage testen Sie alle Funktionen kostenlos. Danach ist ORIZ monatlich kündbar, ohne Einrichtungsgebühr. Die aktuellen Pakete sehen Sie auf der Seite Carta.",
    },
    {
      q: "Wie lange dauert die Einrichtung?",
      a: "Wenn Sie den Text Ihrer Karte zur Hand haben, unter einer Stunde. Sie haben keine Zeit? Dann tragen wir Ihre Karte für Sie ein — schicken Sie uns Fotos, PDF oder einen Link.",
    },
    {
      q: "Kann ich die Karte selbst ändern?",
      a: "Ja, jederzeit und am Handy: Preise, Beschreibungen, Fotos, Allergene, neue Gerichte. Ein Gericht als „ausverkauft“ markieren dauert einen Tap.",
    },
    {
      q: "Wie funktionieren die Allergene?",
      a: "Pro Gericht hinterlegen Sie die Allergengruppen nach der EU-Verordnung 1169/2011 mit den in Österreich üblichen Codes A bis R. Gäste sehen sie bei jedem Gericht und können danach filtern. Für die Richtigkeit der Angaben bleibt Ihr Lokal verantwortlich — wir helfen beim Eintragen.",
    },
    {
      q: "Brauche ich die Papierkarte danach nicht mehr?",
      a: "Das entscheiden Sie. Viele Lokale lassen eine Papierkarte liegen und stellen zusätzlich den QR-Code auf — so sind beide Gäste glücklich.",
    },
    {
      q: "Wo liegen unsere Daten?",
      a: "Datenbank und Fotos liegen bei einem EU-Anbieter in Frankfurt. ORIZ ist ein Wiener Unternehmen; Impressum und Datenschutzerklärung finden Sie ganz unten.",
    },
    {
      q: "Kann ich jederzeit kündigen?",
      a: "Ja, monatlich. Ohne Mindestlaufzeit.",
    },
  ],
  final: {
    heading: "Bereit für eine Karte, die immer stimmt?",
    body: "14 Tage alle Funktionen kostenlos testen. Das Konto ist in zwei Minuten angelegt.",
    cta: "14 Tage kostenlos testen",
    questions: "Fragen?",
    or: "oder",
  },
  footer: { label: "Fußzeile", tagline: "Wien · Daten in der EU", pricing: "Preise & Pakete", login: "Restaurant-Login" },
  jsonLd: {
    description: "Digitale Speisekarte per QR-Code für Restaurants, Cafés und Bars: Fotos, EU-Allergene, mehrere Sprachen, Preise in Sekunden ändern.",
    inLanguage: ["de", "en", "it", "uk"],
  },
};

export const HOME_EN: HomeCopy = {
  lang: "en",
  path: "/en",
  meta: {
    title: "Digital menu with QR code for restaurants in Vienna | ORIZ Carta",
    description:
      "Digital menu for restaurants & cafés in Vienna: QR code on the table, allergens, photos, several languages. Change prices in seconds. Try free for 14 days.",
    ogTitle: "Digital menu with QR code — ORIZ Carta, Vienna",
    ogDescription:
      "Your menu on every phone: photos, 14 EU allergens, four languages. Price changed? Dish sold out? One tap, no reprint.",
    ogLocale: "en_GB",
  },
  skip: "Skip to content",
  homeLabel: "ORIZ — Home",
  navLabel: "Main navigation",
  nav: { features: "Features", steps: "How it works", faq: "Questions", login: "Login" },
  headerCta: "Try free",
  switcher: { href: "/", label: "DE", ariaLabel: "Deutsche Version", hrefLang: "de" },
  hero: {
    eyebrow: "Digital menu · from Vienna",
    h1: ["Your menu.", "On every phone.", "Up to date in seconds."],
    lead: "Guests scan the QR code on the table and see your menu — with photos, allergens and in four languages. Price changed? Dish sold out? One tap, no reprint.",
    ctaPrimary: "Try free for 14 days",
    ctaDemo: "See the live demo",
    note: "No app for your guests · Cancel monthly · Data in the EU",
    langNote: "Sign-up and the owner app are in German for now. The guest menu comes in four languages.",
    demoTitle: "Live demo: menu of Trattoria Belvedere",
    demoCaption: "This is the real menu of Trattoria Belvedere — scroll through it.",
    demoFull: "Open full screen",
  },
  factsLabel: "At a glance",
  facts: [
    { big: "14", label: "EU allergens", body: "per dish, with the codes A–R used in Austria" },
    { big: "4", label: "Languages", body: "German, English, Italian, Ukrainian" },
    { big: "0", label: "Apps for your guests", body: "Camera on the QR code, done" },
    { big: "Secs", label: "instead of a reprint", body: "Change a price, mark a dish as sold out" },
  ],
  painsHeading: "The paper menu costs you money and nerves.",
  pains: [
    { title: "A reprint for every price change", body: "Every correction costs money, and until the new menu arrives, it is wrong." },
    { title: "Allergens: outdated or forgotten", body: "Wrong information is a risk for your guests — and for you." },
    { title: "Tourists do not understand the menu", body: "Guests who do not know the dishes order carefully — or order the cheapest." },
    { title: "The PDF on the website", body: "Tiny on a phone, slow to load, from last year." },
  ],
  painsClosing: "ORIZ Carta replaces all of that — with a menu that is always right.",
  featuresEyebrow: "Features",
  featuresHeading: "Everything a good menu needs.",
  features: [
    { title: "Photos and three looks", body: "Classic like paper, with large photos, or modern in cards. In your colours, with your logo." },
    { title: "Allergens under EU law", body: "All 14 allergen groups per dish. Guests filter by what they cannot eat." },
    { title: "Sizes and several prices", body: "0.3 l and 0.5 l, glass and bottle, small and large — shown cleanly, no tricks." },
    { title: "Sold out in one tap", body: "Out of schnitzel? One tap on your phone — and no guest orders it any more." },
    { title: "Four languages", body: "Guests choose German, English, Italian or Ukrainian. The allergens are translated too." },
    { title: "Service by tap", body: "Guests call the waiter with their table number. Your team sees every call right away on a phone or tablet." },
  ],
  featuresTv: "Also as a screen for the TV on the wall: your menu runs there automatically.",
  stepsEyebrow: "How it works",
  stepsHeading: "Online in three steps.",
  steps: [
    { n: "1", title: "Create an account", body: "In two minutes. Name of your venue, email, password." },
    { n: "2", title: "Enter your menu", body: "Paste the text of your menu — sections, prices, sizes and allergens are recognised. Or we type it in for you." },
    { n: "3", title: "Put up the QR code", body: "Print the table stand and put it on the table. From now on you change everything on your phone." },
  ],
  stepsCta: "Start free now",
  done: {
    eyebrow: "No time?",
    heading: "We set up your menu for you.",
    body: "Send us photos of your menu, a PDF or a link. We enter every dish by hand — with prices, sizes and allergens, with translations on request. We also edit your dish photos so they look calm and consistent.",
    note: "One-off, no subscription. People instead of automation: you get what is on your menu.",
    cta: "Create an account and order",
  },
  whoHeading: "For hospitality in Vienna and all of Austria.",
  venues: ["Restaurants", "Cafés", "Bars", "Heuriger taverns", "Hotel restaurants", "Snack bars & bistros"],
  faqEyebrow: "Frequently asked questions",
  faqHeading: "Good to know.",
  faq: [
    {
      q: "Do my guests need an app?",
      a: "No. Guests scan the QR code with their normal phone camera and the menu opens in the browser. No download, no sign-up.",
    },
    {
      q: "What does ORIZ Carta cost?",
      a: "For the first 14 days you test all features for free. After that ORIZ can be cancelled monthly, with no set-up fee. You can see the current plans on the Carta page.",
    },
    {
      q: "How long does set-up take?",
      a: "Under an hour if you have the text of your menu at hand. No time? Then we enter your menu for you — send us photos, a PDF or a link.",
    },
    {
      q: "Can I change the menu myself?",
      a: "Yes, any time and on your phone: prices, descriptions, photos, allergens, new dishes. Marking a dish as “sold out” takes one tap.",
    },
    {
      q: "How do the allergens work?",
      a: "For each dish you enter the allergen groups under EU regulation 1169/2011, with the codes A to R customary in Austria. Guests see them on every dish and can filter by them. Your venue stays responsible for the accuracy of the information — we help with entering it.",
    },
    {
      q: "Will I no longer need the paper menu?",
      a: "That is up to you. Many venues leave a paper menu out and also put up the QR code — that way both kinds of guest are happy.",
    },
    {
      q: "Where is our data kept?",
      a: "The database and photos are kept with an EU provider in Frankfurt. ORIZ is a Vienna company; the legal notice and privacy policy (both in German) are at the very bottom.",
    },
    {
      q: "Can I cancel at any time?",
      a: "Yes, monthly. No minimum term.",
    },
  ],
  final: {
    heading: "Ready for a menu that is always right?",
    body: "Try all features free for 14 days. Your account is set up in two minutes.",
    cta: "Try free for 14 days",
    questions: "Questions?",
    or: "or",
  },
  footer: { label: "Footer", tagline: "Vienna · Data in the EU", pricing: "Pricing & plans", login: "Restaurant login" },
  jsonLd: {
    description: "Digital menu with QR code for restaurants, cafés and bars: photos, EU allergens, several languages, change prices in seconds.",
    inLanguage: ["en", "de", "it", "uk"],
  },
};
