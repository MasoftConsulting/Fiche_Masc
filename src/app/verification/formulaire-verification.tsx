"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  verifierCodeAction,
  renvoyerCodeAction,
  type EtatFormulaire,
} from "@/app/actions";

function BoutonValider() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-between gap-3 rounded-full bg-ink py-3 pr-2 pl-6 text-[0.95rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
    >
      <span>{pending ? "Vérification…" : "Valider"}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8.4l3.4 3.4L13 4.6" />
        </svg>
      </span>
    </button>
  );
}

export function FormulaireVerification({ technicien }: { technicien: string }) {
  const [etat, action] = useActionState<EtatFormulaire, FormData>(
    verifierCodeAction,
    {},
  );

  return (
    <div className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <form action={action} className="space-y-5">
          <label className="block">
            <span className="etiquette">Code à 6 chiffres</span>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              required
              className="champ text-center font-mono text-[1.5rem] tracking-[0.4em]"
              placeholder="••••••"
            />
          </label>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <BoutonValider />
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
          <form action={renvoyerCodeAction}>
            <button
              type="submit"
              className="text-[0.78rem] text-ink-soft underline-offset-4 transition-colors duration-500 ease-mass hover:text-ink hover:underline"
            >
              Renvoyer un code
            </button>
          </form>

          <Link
            href="/connexion"
            className="text-[0.78rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
          >
            Utiliser un autre code
          </Link>
        </div>

        <p className="mt-5 text-center text-[0.72rem] text-ink-faint">
          Connecté en tant que {technicien}
        </p>
      </div>
    </div>
  );
}