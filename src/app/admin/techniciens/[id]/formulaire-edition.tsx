"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CodeRevele } from "@/components/code-revele";
import { formaterDate } from "@/lib/format";
import { BoutonSupprimer } from "./bouton-supprimer";
import {
  enregistrerTechnicienAction,
  regenererCodeAction,
  type EtatAdmin,
} from "../../actions";

type TechnicienEditable = {
  id: string;
  nom: string;
  email: string | null;
  role: "technicien" | "admin";
  actif: boolean;
  total: number;
  derniere: string | null;
};

export function FormulaireEdition({
  technicien,
  estSoiMeme,
}: {
  technicien: TechnicienEditable;
  estSoiMeme: boolean;
}) {
  const [etatEnreg, enregistrer, enregEnCours] = useActionState<EtatAdmin, FormData>(
    enregistrerTechnicienAction,
    {},
  );
  const [etatCode, regenerer, codeEnCours] = useActionState<EtatAdmin, FormData>(
    regenererCodeAction,
    {},
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
        <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
          <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
            <span className="font-mono text-[0.7rem] text-brand">01</span>
            <div>
              <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                Identité et accès
              </h2>
              <p className="mt-1 text-[0.76rem] text-ink-faint">
                Le nom change sans toucher aux fiches déjà signées : celles-ci
                conservent le nom qu&apos;elles portaient.
              </p>
            </div>
          </header>

          <form action={enregistrer} className="space-y-6">
            <input type="hidden" name="id" value={technicien.id} />

            <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
              <label className="block">
                <span className="etiquette">Nom du technicien</span>
                <input
                  name="nom"
                  defaultValue={technicien.nom}
                  className="champ"
                  required
                  minLength={2}
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className="etiquette">Rôle</span>
                <select
                  name="role"
                  defaultValue={technicien.role}
                  className="champ"
                  disabled={estSoiMeme}
                >
                  <option value="technicien">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
                {estSoiMeme && (
                  <p className="mt-1.5 text-[0.72rem] text-ink-faint">
                    Vous ne pouvez pas modifier votre propre rôle.
                  </p>
                )}
              </label>
            </div>

            <label className="block">
              <span className="etiquette">Adresse e-mail</span>
              <input
                name="email"
                type="email"
                defaultValue={technicien.email ?? ""}
                className="champ"
                required
                autoComplete="off"
              />
              <span className="mt-1.5 block text-[0.72rem] text-ink-faint">
                {technicien.email
                  ? "Reçoit le code à 6 chiffres demandé à chaque connexion."
                  : "Aucune adresse : ce technicien ne peut pas se connecter tant qu'elle n'est pas renseignée."}
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink/[0.03] px-4 py-3.5">
              <input
                type="checkbox"
                name="actif"
                value="1"
                defaultChecked={technicien.actif}
                className="case mt-0.5"
                disabled={estSoiMeme}
              />
              <span className="flex-1">
                <span className="block text-[0.85rem] font-medium text-ink">
                  Compte actif
                </span>
                <span className="mt-0.5 block text-[0.75rem] text-ink-soft">
                  Un compte inactif ne peut plus se connecter, mais ses fiches
                  restent visibles dans le registre.
                  {estSoiMeme && " Vous ne pouvez pas désactiver votre propre compte."}
                </span>
              </span>
            </label>

            {etatEnreg.erreur && (
              <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
                {etatEnreg.erreur}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-[0.74rem] text-ink-faint">
                Dernière intervention · {formaterDate(technicien.derniere)}
              </p>
              <button
                type="submit"
                disabled={enregEnCours}
                className="rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
              >
                {enregEnCours ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
        <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
          <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
            <span className="font-mono text-[0.7rem] text-brand">02</span>
            <div>
              <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                Code d&apos;accès
              </h2>
              <p className="mt-1 text-[0.76rem] text-ink-faint">
                Seule l&apos;empreinte du code est conservée. Il est impossible
                de le relire : régénérez-en un nouveau si perdu.
              </p>
            </div>
          </header>

          <form action={regenerer} className="space-y-4">
            <input type="hidden" name="id" value={technicien.id} />
            <button
              type="submit"
              disabled={codeEnCours}
              className="rounded-full bg-ink/[0.05] px-5 py-3 text-[0.85rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.97] disabled:opacity-60"
            >
              {codeEnCours ? "Génération…" : "Générer un nouveau code"}
            </button>
          </form>

          {etatCode.erreur && (
            <p className="mt-4 rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etatCode.erreur}
            </p>
          )}

          {etatCode.code && (
            <div className="mt-4">
              <CodeRevele code={etatCode.code} nom={etatCode.nom} />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] bg-rouille/[0.06] p-1.5 ring-1 ring-rouille/15">
        <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 sm:p-8">
          <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
            <span className="font-mono text-[0.7rem] text-rouille">03</span>
            <div>
              <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                Suppression
              </h2>
              <p className="mt-1 text-[0.76rem] text-ink-faint">
                Ses {technicien.total} fiche{technicien.total > 1 ? "s" : ""}{" "}
                resteront au registre, au nom qu&apos;elles portaient. La
                suppression est définitive.
              </p>
            </div>
          </header>

          {estSoiMeme ? (
            <p className="rounded-2xl bg-ink/[0.04] px-4 py-3 text-[0.82rem] text-ink-soft">
              Vous ne pouvez pas supprimer votre propre compte. Demandez à un
              autre administrateur de le faire.
            </p>
          ) : (
            <BoutonSupprimer
              id={technicien.id}
              nom={technicien.nom}
              nombreFiches={technicien.total}
            />
          )}
        </div>
      </section>

      <p className="px-1 pt-2 text-center text-[0.76rem] text-ink-faint">
        <Link
          href={`/fiches?technicien=${technicien.id}`}
          className="text-ink underline underline-offset-2"
        >
          Voir les fiches de {technicien.nom}
        </Link>
      </p>
    </div>
  );
}