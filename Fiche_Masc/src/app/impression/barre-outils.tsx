"use client";

import Link from "next/link";

/**
 * Barre d'action au-dessus de la feuille. Masquée à l'impression par la règle
 * `@media print` de impression.css.
 */
export function BarreOutils({ retour, numero }: { retour: string; numero: string }) {
  return (
    <div className="barre-outils">
      <div className="flex items-center gap-3">
        <Link
          href={retour}
          className="text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
        >
          ← Retour à la fiche
        </Link>
        <span className="hidden font-mono text-[0.72rem] text-ink-faint sm:block">{numero}</span>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="group flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
      >
        <span>Imprimer</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
