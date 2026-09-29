"use client";

import { useState } from "react";
import { rouvrirFicheAction } from "@/app/actions";

/**
 * Bouton de réouverture d'une fiche signée, réservé à l'administrateur.
 *
 * Deux temps : un premier clic révèle un champ « motif » optionnel et les
 * boutons de confirmation. L'action vide les signatures côté serveur et
 * repasse la fiche en brouillon.
 */
export function BoutonRouvrir({
  id,
  numero,
}: {
  id: string;
  numero: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="rounded-full bg-amber/10 px-4 py-3 text-[0.82rem] font-medium text-amber transition-all duration-500 ease-mass hover:bg-amber/20 active:scale-[0.97]"
      >
        Rouvrir pour correction
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-amber/[0.08] p-4 ring-1 ring-amber/20">
      <p className="text-[0.82rem] text-ink">
        Rouvrir la fiche <strong className="font-mono">{numero}</strong> ? La
        signature du client sera effacée et la fiche redeviendra un brouillon
        modifiable.
      </p>

      <form action={rouvrirFicheAction} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={id} />

        <label className="block">
          <span className="text-[0.72rem] text-ink-soft">
            Motif (optionnel)
          </span>
          <input
            type="text"
            name="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="champ mt-1"
            placeholder="Ex. adresse incorrecte, oubli d'une ligne"
            autoComplete="off"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="rounded-full bg-amber px-4 py-2 text-[0.78rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-amber/90 active:scale-[0.97]"
          >
            Oui, rouvrir
          </button>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="rounded-full px-3 py-2 text-[0.78rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}