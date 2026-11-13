"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slugify, slugProblem } from "@/lib/slug";
import { checkSlug, createVenue } from "./actions";

type SlugState = { kind: "idle" | "checking" | "ok" } | { kind: "error"; message: string };

export function NewVenueForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // The address follows the name until the owner types one of their own.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  // Shape problems are shown at once; availability is asked of the server
  // after a short pause in typing.
  useEffect(() => {
    if (!slug) { setSlugState({ kind: "idle" }); return; }
    const problem = slugProblem(slug);
    if (problem) { setSlugState({ kind: "error", message: problem }); return; }
    setSlugState({ kind: "checking" });
    const timer = setTimeout(async () => {
      const res = await checkSlug(slug);
      setSlugState(res.ok ? { kind: "ok" } : { kind: "error", message: res.error });
    }, 350);
    return () => clearTimeout(timer);
  }, [slug]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createVenue({ name, slug });
      if (res.ok) router.push(`/app/${res.slug}/start`);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl bg-white p-6 ring-1 ring-onyx/10">
      <label className="block">
        <span className="text-base font-medium">Name des Lokals</span>
        <input
          required
          maxLength={80}
          autoComplete="organization"
          placeholder="z. B. Gasthaus zur Linde"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-onyx/20 bg-white px-3 py-3 text-base outline-none focus:border-onyx"
        />
      </label>

      <label className="block">
        <span className="text-base font-medium">Adresse der Speisekarte</span>
        <div className="mt-1 flex items-center rounded-xl border border-onyx/20 bg-white focus-within:border-onyx">
          <input
            required
            maxLength={40}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={slug}
            onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
            className="min-w-0 flex-1 bg-transparent py-3 pl-3 text-base outline-none"
          />
          <span className="pr-3 text-base text-onyx/60">.oriz.at</span>
        </div>
        <span
          aria-live="polite"
          className={`mt-1 block text-sm ${slugState.kind === "error" ? "text-red-700" : slugState.kind === "ok" ? "text-emerald-700" : "text-onyx/60"}`}
        >
          {slugState.kind === "error" && slugState.message}
          {slugState.kind === "ok" && "Frei."}
          {slugState.kind === "checking" && "Wird geprüft…"}
          {slugState.kind === "idle" && "Gäste sehen diese Adresse. Sie lässt sich später nur über uns ändern."}
        </span>
      </label>

      {error && <p className="text-base text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={pending || slugState.kind !== "ok"}
        className="w-full rounded-xl bg-onyx py-3 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Wird angelegt…" : "Weiter"}
      </button>
    </form>
  );
}
