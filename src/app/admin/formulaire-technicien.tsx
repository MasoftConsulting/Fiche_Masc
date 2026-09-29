"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CodeRevele } from "@/components/code-revele";
import { creerTechnicienAction, type EtatAdmin } from "./actions";

function BoutonCreer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.9rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
    >
      <span>{pending ? "Création…" : "Créer le code"}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </span>
    </button>
  );
}

export function FormulaireTechnicien() {
  const [etat, action] = useActionState<EtatAdmin, FormData>(creerTechnicienAction, {});
  const [codeManuel, setCodeManuel] = useState(false);

  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-7 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span className="font-mono text-[0.7rem] text-brand">+</span>
          <div>
            <h2 className="font-display text-[1.3rem] font-semibold tracking-[-0.03em]">
              Ajouter un technicien
            </h2>
            <p className="mt-1 text-[0.78rem] text-ink-faint">
              Le code est généré automatiquement et affiché une seule fois
            </p>
          </div>
        </header>

        <form action={action} key={etat.code ?? "vierge"} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="etiquette">Nom du technicien</span>
              <input
                name="nom"
                className="champ"
                placeholder="M. Raphael"
                required
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="etiquette">Rôle</span>
              <select name="role" className="champ" defaultValue="technicien">
                <option value="technicien">Technicien</option>
                <option value="admin">Administrateur</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="etiquette">Email</span>
            <input
              name="email"
              type="email"
              className="champ"
              placeholder="technicien@masoft.tg"
              autoComplete="off"
            />
            <p className="mt-2 text-[0.72rem] text-ink-soft">
              Requis pour la double authentification. Un code de vérification
              y sera envoyé à chaque connexion. Peut être laissé vide pour
              l&apos;instant, à compléter avant l&apos;activation du MFA.
            </p>
          </label>

          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="case"
                checked={codeManuel}
                onChange={(e) => setCodeManuel(e.target.checked)}
              />
              <span className="text-[0.85rem] text-ink-soft">Choisir le code moi-même</span>
            </label>

            {codeManuel && (
              <div className="mt-4 max-w-sm">
                <label className="block">
                  <span className="etiquette">Code d&apos;accès</span>
                  <input
                    name="code"
                    className="champ font-mono tracking-[0.12em]"
                    placeholder="6 caractères minimum"
                    minLength={6}
                    autoComplete="off"
                  />
                </label>
              </div>
            )}
          </div>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <BoutonCreer />
        </form>

        {etat.code && (
          <div className="mt-7">
            <CodeRevele code={etat.code} nom={etat.nom} />
          </div>
        )}
      </div>
    </section>
  );
}