// Branded review partner buttons — Google multicolor, TripAdvisor green, Facebook blue.
// Used across all three profile themes.

type Props = {
  googleUrl?: string | null;
  tripadvisorUrl?: string | null;
  facebookUrl?: string | null;
  muted: string;
  border: string;
  text: string;
};

export function ReviewButtons({ googleUrl, tripadvisorUrl, facebookUrl, muted, border, text }: Props) {
  const buttons = [
    googleUrl && { key: "google", label: "Google", url: googleUrl, icon: <GoogleIcon /> },
    tripadvisorUrl && { key: "tripadvisor", label: "TripAdvisor", url: tripadvisorUrl, icon: <TripAdvisorIcon /> },
    facebookUrl && { key: "facebook", label: "Facebook", url: facebookUrl, icon: <FacebookIcon /> },
  ].filter(Boolean) as { key: string; label: string; url: string; icon: React.ReactNode }[];

  if (buttons.length === 0) return null;

  return (
    <section className="mt-12 text-center">
      <h2
        className="mb-4 font-sans text-[11px] tracking-regal uppercase"
        style={{ color: muted }}
      >
        Bewerten Sie uns
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {buttons.map((b) => (
          <a
            key={b.key}
            href={b.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 font-sans text-[12px] tracking-wide transition-opacity hover:opacity-80 active:opacity-60"
            style={{
              border: `1px solid ${border}`,
              color: text,
              borderRadius: "6px",
              minHeight: "44px",
              backgroundColor: "transparent",
            }}
          >
            {b.icon}
            {b.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TripAdvisorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M12 6.5c-3.1 0-5.93.7-8.2 1.9H0l1.62 1.76A4.7 4.7 0 0 0 4.78 18a4.7 4.7 0 0 0 3.5-1.56L9.9 18l1.62-1.76L13.14 18l1.62-1.56A4.7 4.7 0 0 0 18.28 18a4.7 4.7 0 0 0 3.13-8.04L24 8.4h-3.8A18.3 18.3 0 0 0 12 6.5zm-7.22 9.9a2.65 2.65 0 1 1 0-5.3 2.65 2.65 0 0 1 0 5.3zm7.22-.13a3.13 3.13 0 0 0-1.96-2.9 7.6 7.6 0 0 1 3.92 0A3.13 3.13 0 0 0 12 16.27zm6.28.13a2.65 2.65 0 1 1 0-5.3 2.65 2.65 0 0 1 0 5.3zm0-3.97a1.32 1.32 0 1 0 0 2.64 1.32 1.32 0 0 0 0-2.64zm-12.56 0a1.32 1.32 0 1 0 0 2.64 1.32 1.32 0 0 0 0-2.64z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
