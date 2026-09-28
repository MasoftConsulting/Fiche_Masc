"use client";

import { useActionState, useState } from "react";
import {
  modifierClientAction,
  supprimerClientAction,
  type EtatClient,
} from "../actions";
import type { Client } from "@/lib/clients";

export function EditionClient({ client }: { client: Client }) {
  const [etat, enregistrer, enCours] = useActionState<EtatClient, FormData>(
    modifierClientAction,
    {},
  );
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span className="font-mono text-[0.7rem] text-brand">01</span>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Coordonnées du client
            </h2>
            <p className="mt-1 text-[0.76rem] text-ink-faint">
              Ces valeurs sont recopiées au moment de la création d&apos;une fiche.
              Les fiches déjà signées conservent les valeurs de l&apos;époque.
            </p>
          </div>
        </header>

        <form action={enregistrer} className="space-y-5">
          <input type="hidden" name="id" value={client.id} />

          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="etiquette">Nom de la société *</span>
              <input
                name="nom"
                defaultValue={client.nom}
                className="champ"
                required
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Téléphone</span>
              <input
                name="telephone"
                type="tel"
                defaultValue={client.telephone ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="etiquette">Adresse</span>
              <input
                name="adresse"
                defaultValue={client.adresse ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Précision lieu</span>
              <input
                name="contact"
                defaultValue={client.contact ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
          </div>

          <label className="block">
            <span className="etiquette">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className="champ"
              autoComplete="off"
            />
          </label>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[calc(2rem-0.375rem)] bg-rouille/[0.05] p-6 sm:p-8">
        <header className="mb-5 flex items-baseline gap-4 border-b border-hairline pb-4">
          <span className="font-mono text-[0.7rem] text-rouille">02</span>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Suppression
            </h2>
            <p className="mt-1 text-[0.76rem] text-ink-faint">
              Les équipements liés seront retirés. Les fiches restent au registre,
              au nom qu&apos;elles portaient.
            </p>
          </div>
        </header>

        {confirmeSuppression ? (
          <div className="space-y-3">
            <p className="text-[0.85rem] text-rouille">
              Confirmez la suppression de <strong>{client.nom}</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <form action={supprimerClientAction}>
                <input type="hidden" name="id" value={client.id} />
                <button
                  type="submit"
                  className="rounded-full bg-rouille px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-rouille/90 active:scale-[0.97]"
                >
                  Oui, supprimer
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmeSuppression(false)}
                className="rounded-full px-4 py-2.5 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmeSuppression(true)}
            className="rounded-full bg-rouille/10 px-5 py-2.5 text-[0.82rem] font-medium text-rouille transition-all duration-500 ease-mass hover:bg-rouille/20 active:scale-[0.97]"
          >
            Supprimer ce client
          </button>
        )}
      </div>
    </section>
  );
}