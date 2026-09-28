"use client";

import { useState } from "react";
import { Reveler } from "./reveler";
import { CarteFiche } from "./carte-fiche";
import type { Fiche } from "@/lib/types";

/**
 * Liste des fiches avec sélection multiple.
 *
 * La sélection vit uniquement côté client : elle est perdue au changement de
 * page ou de filtre, et c'est volontaire — imprimer un lot hétérogène composé
 * de plusieurs pages serait une source de confusion.
 */
export function ListeFichesSelection({
  fiches,
  admin,
}: {
  fiches: Fiche[];
  admin: boolean;
}) {
  const [selection, setSelection] = useState<Set<string>>(new Set());

  const basculer = (id: string) => {
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      if (suivante.has(id)) suivante.delete(id);
      else suivante.add(id);
      return suivante;
    });
  };

  const toutDeselectionner = () => setSelection(new Set());

  const imprimerSelection = () => {
    if (selection.size === 0) return;
    const ids = Array.from(selection).join(",");
    window.open(`/impression/lot?ids=${ids}`, "_blank", "noopener");
  };

  return (
    <>
      <div className="space-y-3">
        {fiches.map((fiche, index) => (
          <Reveler key={fiche.id} delai={Math.min(index, 8) * 45}>
            <div className="flex items-start gap-3">
              <CaseSelection
                cochee={selection.has(fiche.id)}
                onToggle={() => basculer(fiche.id)}
                numero={fiche.numero}
              />
              <div className="min-w-0 flex-1">
                <CarteFiche fiche={fiche} admin={admin} />
              </div>
            </div>
          </Reveler>
        ))}
      </div>

      <BarreSelection
        nombre={selection.size}
        onImprimer={imprimerSelection}
        onAnnuler={toutDeselectionner}
      />
    </>
  );
}

/* -------------------------------------------------------- sous-composants */

/**
 * Case à cocher ronde, positionnée à gauche de la carte.
 *
 * Le `<span>` extérieur de taille constante (28px) empêche le décalage du
 * contenu quand on coche : la largeur de la case ne change pas, seule sa
 * couleur intérieure évolue.
 */
function CaseSelection({
  cochee,
  onToggle,
  numero,
}: {
  cochee: boolean;
  onToggle: () => void;
  numero: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={cochee}
      aria-label={`${cochee ? "Retirer" : "Sélectionner"} la fiche ${numero}`}
      className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-500 ease-mass"
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full border transition-all duration-500 ease-mass ${
          cochee
            ? "border-ink bg-ink text-white"
            : "border-ink/20 bg-transparent text-transparent hover:border-ink/40"
        }`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 5" />
        </svg>
      </span>
    </button>
  );
}

/**
 * Barre d'actions flottante, en bas de page.
 *
 * Toujours montée pour que l'apparition et la disparition soient animées.
 * `pointer-events-none` quand invisible : elle ne bloque jamais le clic sur
 * la dernière carte.
 */
function BarreSelection({
  nombre,
  onImprimer,
  onAnnuler,
}: {
  nombre: number;
  onImprimer: () => void;
  onAnnuler: () => void;
}) {
  const visible = nombre > 0;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-all duration-500 ease-mass ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${
          visible ? "" : "invisible"
        }`}
      >
        <span className="text-[0.85rem] font-medium">
          {nombre} fiche{nombre > 1 ? "s" : ""} sélectionnée{nombre > 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={onImprimer}
          className="group flex items-center gap-2 rounded-full bg-white/12 py-1.5 pr-1.5 pl-4 text-[0.82rem] font-medium transition-all duration-500 ease-mass hover:bg-white/20 active:scale-[0.97]"
        >
          Imprimer
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-all duration-500 ease-mass group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          onClick={onAnnuler}
          aria-label="Annuler la sélection"
          className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition-all duration-500 ease-mass hover:bg-white/10 hover:text-white active:scale-[0.95]"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}