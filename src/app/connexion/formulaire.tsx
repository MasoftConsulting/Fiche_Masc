"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { connexion, type EtatFormulaire } from "@/app/actions";

function BoutonEntrer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
    >
      <span>{pending ? "Envoi du code…" : "Continuer"}</span>
      {/* Bouton dans le bouton : l'icône vit dans son propre disque. */}
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10" />
        </svg>
      </span>
    </button>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action] = useActionState<EtatFormulaire, FormData>(connexion, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="suite" value={suite} />

      <div>
        <label className="etiquette" htmlFor="code">
          Code d&apos;accès
        </label>
        <input
          id="code"
          name="code"
          type="password"
          className="champ text-center font-mono tracking-[0.18em]"
          placeholder="MSC-••••-••••"
          autoComplete="one-time-code"
          autoFocus
          required
        />
      </div>

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <BoutonEntrer />

      <p className="pt-1 text-center text-[0.75rem] leading-relaxed text-ink-faint">
        Votre code vous identifie : il renseigne seul le champ « Technicien » de
        vos fiches. Un code de confirmation vous sera ensuite envoyé par e-mail.
      </p>
    </form>
  );
}
