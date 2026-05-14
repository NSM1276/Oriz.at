"use client";

type Props = {
  slug: string | null;
  name: string;
  onClose: () => void;
};

export function QRModal({ slug, name, onClose }: Props) {
  if (!slug) return null;

  const url = `https://oriz-at.vercel.app/${slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=20&color=0A0A0A&bgcolor=F5F0EC&data=${encodeURIComponent(url)}`;

  async function handleDownload() {
    const res = await fetch(qrSrc);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${slug}.png`;
    a.click();
  }

  return (
    <>
      <div className="fixed inset-0 bg-onyx/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-parchment w-full max-w-xs shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-onyx/10">
            <div>
              <span className="font-sans text-[10px] tracking-regal uppercase text-gold">QR Code</span>
              <h2 className="font-display text-lg text-onyx mt-0.5 truncate">{name}</h2>
            </div>
            <button onClick={onClose} className="text-onyx/40 hover:text-onyx transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 flex flex-col items-center gap-5">
            {/* QR */}
            <div className="border border-onyx/10 p-2 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt={`QR code for ${name}`} width={240} height={240} />
            </div>

            {/* URL */}
            <div className="w-full">
              <label className="block font-sans text-[10px] tracking-regal uppercase text-onyx/50 mb-1.5">Menu URL</label>
              <div className="flex items-center gap-2">
                <input readOnly value={url}
                  className="flex-1 font-sans text-xs bg-white border border-onyx/15 px-3 py-2 text-onyx/70 focus:outline-none"
                  onClick={e => (e.target as HTMLInputElement).select()} />
                <button
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="font-sans text-[10px] tracking-regal uppercase text-onyx/50 border border-onyx/20 px-3 py-2 hover:border-onyx/40 hover:text-onyx transition-colors whitespace-nowrap">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button onClick={handleDownload}
              className="w-full bg-onyx text-parchment font-sans text-[11px] tracking-regal uppercase py-3 hover:bg-onyx/85 transition-colors">
              Download QR ↓
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
