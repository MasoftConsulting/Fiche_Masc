"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CodeRevele } from "@/components/code-revele";
import { initiales, formaterDate } from "@/lib/format";
import type { TechnicienAvecStats } from "@/lib/techniciens";
import {
  basculerActifAction,
  regenererCodeAction,
  renommerTechnicienAction,
  supprimerTechnicienAction,
  type EtatAdmin,
} from "./actions";

export function CarteTechnicien({ technicien }: { technicien: TechnicienAvecStats }) {
  const [etat, regenerer] = useActionState<EtatAdmin, FormData>(regenererCodeAction, {});
  const [renomme, setRenomme] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-700 ease-mass ${
        technicien.actif
          ? "bg-white/45 ring-white/60 hover:bg-white/70 hover:shadow-souleve"
          : "bg-ink/[0.03] ring-hairline"
      }`}
    >
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Identité */}
          <div className="flex min-w-0 items-center gap-4">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[0.78rem] font-semibold text-white ${
                technicien.actif ? "bg-navy" : "bg-ink-faint"
              }`}
            >
              {initiales(technicien.nom)}
            </span>

            <div className="min-w-0">
              {renomme ? (
                <form
                  action={renommerTechnicienAction}
                  onSubmit={() => setRenomme(false)}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={technicien.id} />
                  <input
                    name="nom"
                    defaultValue={technicien.nom}
                    className="champ py-1.5 text-[0.95rem]"
                    autoFocus
                    required
                    minLength={2}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-2 text-[0.75rem] font-medium text-white active:scale-[0.97]"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenomme(false)}
                    className="rounded-full px-3 py-2 text-[0.75rem] text-ink-faint hover:text-ink"
                  >
                    Annuler
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="truncate font-display text-[1.2rem] font-semibold tracking-[-0.03em]">
                    {technicien.nom}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRenomme(true)}
                    className="text-[0.72rem] text-ink-faint underline-offset-2 transition-colors duration-500 ease-mass hover:text-ink hover:underline"
                  >
                    renommer
                  </button>
                </div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {technicien.role === "admin" && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-brand">
                    Admin
                  </span>
                )}
                {!technicien.actif && (
                  <span className="rounded-full bg-rouille/10 px-2.5 py-1 text-[0.62rem] font-medium text-rouille">
                    Désactivé
                  </span>
                )}
                <span className="text-[0.74rem] text-ink-faint">
                  Dernière intervention · {formaterDate(technicien.derniere)}
                </span>
              </div>
            </div>
          </div>

          {/* Compte des fiches */}
          <div className="flex shrink-0 items-center gap-6 border-t border-hairline pt-4 lg:border-t-0 lg:pt-0">
            <Compte valeur={technicien.total} libelle="fiches" />
            <Compte valeur={technicien.signees} libelle="signées" ton="text-jade" />
            <Compte valeur={technicien.brouillons} libelle="brouillons" ton="text-amber" />
            <Compte valeur={technicien.mois} libelle="ce mois" />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
          <Link
            href={`/fiches?technicien=${technicien.id}`}
            className="group flex items-center gap-2 rounded-full bg-ink/[0.05] px-4 py-2 text-[0.78rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.97]"
          >
            Voir ses fiches
            <span className="transition-transform duration-500 ease-mass group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <form action={regenerer}>
            <input type="hidden" name="id" value={technicien.id} />
            <button
              type="submit"
              className="rounded-full px-4 py-2 text-[0.78rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink active:scale-[0.97]"
            >
              Nouveau code
            </button>
          </form>

          <form action={basculerActifAction}>
            <input type="hidden" name="id" value={technicien.id} />
            <input type="hidden" name="actif" value={technicien.actif ? "0" : "1"} />
            <button
              type="submit"
              className="rounded-full px-4 py-2 text-[0.78rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink active:scale-[0.97]"
            >
              {technicien.actif ? "Désactiver" : "Réactiver"}
            </button>
          </form>

          {/* Suppression en deux temps : pas de window.confirm, qui ne suit pas
              la charte et se fait bloquer par certains navigateurs. */}
          <div className="ml-auto">
            {confirmeSuppression ? (
              <div className="flex items-center gap-2">
                <span className="text-[0.75rem] text-ink-soft">
                  Ses {technicien.total} fiche{technicien.total > 1 ? "s" : ""} seront conservées.
                </span>
                <form action={supprimerTechnicienAction}>
                  <input type="hidden" name="id" value={technicien.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-rouille px-4 py-2 text-[0.78rem] font-medium text-white transition-all duration-500 ease-mass active:scale-[0.97]"
                  >
                    Confirmer
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmeSuppression(false)}
                  className="rounded-full px-3 py-2 text-[0.78rem] text-ink-faint hover:text-ink"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmeSuppression(true)}
                className="rounded-full px-4 py-2 text-[0.78rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille active:scale-[0.97]"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>

        {etat.erreur && (
          <p className="mt-4 rounded-2xl bg-rouille/10 px-4 py-3 text-[0.82rem] text-rouille">
            {etat.erreur}
          </p>
        )}

        {etat.code && (
          <div className="mt-4">
            <CodeRevele code={etat.code} nom={etat.nom} />
          </div>
        )}
      </div>
    </article>
  );
}

function Compte({
  valeur,
  libelle,
  ton = "text-ink",
}: {
  valeur: number;
  libelle: string;
  ton?: string;
}) {
  return (
    <div className="text-center">
      <p className={`font-display text-[1.45rem] leading-none font-semibold tracking-[-0.04em] ${ton}`}>
        {valeur}
      </p>
      <p className="mt-1.5 text-[0.66rem] text-ink-faint">{libelle}</p>
    </div>
  );
}
