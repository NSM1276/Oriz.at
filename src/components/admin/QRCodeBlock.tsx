"use client";

export function QRCodeBlock({ slug }: { slug: string }) {
  const menuUrl = `https://oriz.at/${slug}`;
  const qrDisplay = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=0a0a0a&margin=2`;
  const qrDownload = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=0a0a0a&margin=4&format=png`;

  return (
    <div
      className="mb-10 flex items-center gap-6 px-5 py-5"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* QR image always on white so scanner works on any bg */}
      <div className="shrink-0 p-2 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDisplay} alt="QR Code" width={88} height={88} />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="font-sans text-[10px] tracking-regal uppercase mb-1"
          style={{ color: 'var(--color-muted)' }}
        >
          Ihr QR-Code · Menü-Link
        </div>
        <div
          className="font-sans text-sm mb-4 truncate"
          style={{ color: 'var(--color-text)' }}
        >
          {menuUrl}
        </div>
        <a
          href={qrDownload}
          download={`qr-${slug}.png`}
          className="font-sans text-[10px] tracking-regal uppercase px-4 py-2 inline-block transition-opacity hover:opacity-80"
          style={{
            border: '1px solid var(--color-text)',
            color: 'var(--color-text)',
          }}
        >
          Herunterladen (PNG)
        </a>
      </div>
    </div>
  );
}
