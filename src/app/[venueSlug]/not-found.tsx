export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl font-medium text-onyx">Diese Speisekarte gibt es nicht.</h1>
      <p className="mt-3 max-w-sm text-lg text-onyx/75">Bitte prüfen Sie die Adresse oder scannen Sie den QR-Code noch einmal.</p>
      <p className="mt-2 text-base text-onyx/60">This menu does not exist. Please check the address.</p>
      <a href="https://www.oriz.at" className="mt-8 inline-flex min-h-12 items-center rounded-xl px-6 text-base font-medium text-onyx ring-1 ring-onyx/25">
        oriz.at
      </a>
    </main>
  );
}
