"use client";

import { useState } from "react";

/**
 * Affichage unique d'un code d'accès.
 *
 * Seule l'empreinte du code est conservée en base : ce bloc est le seul moment
 * où l'administrateur peut le lire. Le message le dit explicitement pour qu'il
 * ne referme pas la page sans l'avoir transmis.
 */
export function CodeRevele({ code, nom }: { code: string; nom?: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2200);
    } catch {
      // Presse-papiers refusé (page non sécurisée, permission) : le code reste
      // sélectionnable à la main, on n'affiche pas d'erreur bloquante.
      setCopie(false);
    }
  }

  return (
    <div className="rounded-[1.35rem] bg-jade/[0.08] p-1.5 ring-1 ring-jade/20">
      <div className="rounded-[calc(1.35rem-0.375rem)] bg-surface p-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-jade">
          {nom ? `Code de ${nom}` : "Nouveau code"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="select-all rounded-xl bg-ink/[0.05] px-4 py-2.5 font-mono text-[1.05rem] tracking-[0.14em] text-ink">
            {code}
          </code>
          <button
            type="button"
            onClick={copier}
            className="rounded-full bg-ink/[0.05] px-4 py-2 text-[0.78rem] font-medium text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/[0.09] hover:text-ink active:scale-[0.97]"
          >
            {copie ? "Copié" : "Copier"}
          </button>
        </div>

        <p className="mt-3 text-[0.76rem] leading-relaxed text-ink-soft">
          Notez-le maintenant : il n&apos;est stocké nulle part et ne pourra plus
          être relu. En cas de perte, générez-en un nouveau.
        </p>
      </div>
    </div>
  );
}
