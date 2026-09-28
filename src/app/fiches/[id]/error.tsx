"use client";

import Link from "next/link";

export default function ErreurFiche({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-16">
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9 text-center">
          <p className="font-mono text-[0.72rem] tracking-[0.08em] text-rouille">
            {error.digest ?? "ERREUR"}
          </p>
          <h1 className="mt-4 font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
            Impossible de charger cette fiche
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
            Une erreur est survenue lors de la lecture des données.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={reset}
              className="rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
            >
              Réessayer
            </button>
            <Link
              href="/fiches"
              className="rounded-full px-6 py-3 text-[0.88rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5"
            >
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}