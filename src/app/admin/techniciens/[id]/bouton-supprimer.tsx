"use client";

import { useState } from "react";
import { supprimerTechnicienAction } from "../../actions";

export function BoutonSupprimer({
  id,
  nom,
  nombreFiches,
}: {
  id: string;
  nom: string;
  nombreFiches: number;
}) {
  const [confirme, setConfirme] = useState(false);

  if (!confirme) {
    return (
      <button
        type="button"
        onClick={() => setConfirme(true)}
        className="rounded-full bg-rouille/10 px-5 py-3 text-[0.85rem] font-medium text-rouille transition-all duration-500 ease-mass hover:bg-rouille/20 active:scale-[0.97]"
      >
        Supprimer définitivement
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-rouille/[0.08] px-5 py-4">
      <p className="text-[0.85rem] text-rouille">
        Confirmez la suppression de <strong>{nom}</strong>. Ses {nombreFiches}{" "}
        fiche{nombreFiches > 1 ? "s" : ""} resteront au registre.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <form action={supprimerTechnicienAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="rounded-full bg-rouille px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-rouille/90 active:scale-[0.97]"
          >
            Oui, supprimer
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirme(false)}
          className="rounded-full px-4 py-2.5 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}