import { whatsappUrl } from "@/lib/contact-info";

/** A quiet "write to us" line for pages where an owner may get stuck. */
export function WhatsAppHelp({ message, className = "" }: { message: string; className?: string }) {
  return (
    <p className={`text-sm text-stone-600 ${className}`}>
      Fragen oder Hilfe nötig?{" "}
      <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="font-medium text-stone-900 underline">
        Schreiben Sie uns auf WhatsApp
      </a>
    </p>
  );
}
