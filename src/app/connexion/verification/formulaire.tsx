"use client";

import { useActionState } from "react";
import {
  annulerConnexion,
  renvoyerCode,
  verifierConnexion,
  type EtatFormulaire,
} from "@/app/actions";

export function FormulaireVerification() {
  const [etat, verifier, verification] = useActionState<EtatFormulaire, FormData>(
    verifierConnexion,
    {},
  );
  const [etatRenvoi, renvoyer, renvoi] = useActionState<EtatFormulaire, FormData>(
    renvoyerCode,
    {},
  );

  const erreur = etat.erreur ?? etatRenvoi.erreur;

  return (
    <div className="space-y-5">
      <form action={verifier} className="space-y-5">
        <div>
          <label className="etiquette" htmlFor="code">
            Code de connexion
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="champ text-center font-mono text-[1.4rem] tracking-[0.5em]"
            placeholder="••••••"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </div>

        {erreur && (
          <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
            {erreur}
          </p>
        )}
        {!erreur && etatRenvoi.message && (
          <p className="rounded-2xl bg-ink/[0.04] px-4 py-3 text-[0.85rem] text-ink-soft">
            {etatRenvoi.message}
          </p>
        )}

        <button
          type="submit"
          disabled={verification}
          className="w-full rounded-full bg-ink py-3.5 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
        >
          {verification ? "Vérification…" : "Se connecter"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 pt-1 text-[0.78rem]">
        <form action={annulerConnexion}>
          <button type="submit" className="text-ink-soft underline underline-offset-2 hover:text-ink">
            Changer de code d&apos;accès
          </button>
        </form>
        <form action={renvoyer}>
          <button
            type="submit"
            disabled={renvoi}
            className="text-ink underline underline-offset-2 disabled:opacity-60"
          >
            {renvoi ? "Envoi…" : "Renvoyer un code"}
          </button>
        </form>
      </div>
    </div>
  );
}
