"use client";

import { useActionState } from "react";
import {
  creerClientAction,
  modifierClientAction,
  type EtatClient,
} from "./actions";
import type { Client } from "@/lib/clients";

export function FormulaireClient({
  client,
  onSucces,
}: {
  client?: Client;
  onSucces?: () => void;
}) {
  const edition = Boolean(client);
  const action = edition ? modifierClientAction : creerClientAction;
  const [etat, soumettre, enCours] = useActionState<EtatClient, FormData>(action, {});

  // En édition, on prévient le parent une fois l'enregistrement réussi.
  if (etat.ok && onSucces) onSucces();

  return (
    <form action={soumettre} className="space-y-5">
      {client && <input type="hidden" name="id" value={client.id} />}

      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <label className="block">
          <span className="etiquette">Nom de la société *</span>
          <input
            name="nom"
            defaultValue={client?.nom ?? ""}
            className="champ"
            required
            autoComplete="off"
            placeholder="Ex. Mascos Consulting"
          />
        </label>

        <label className="block">
          <span className="etiquette">Téléphone</span>
          <input
            name="telephone"
            type="tel"
            defaultValue={client?.telephone ?? ""}
            className="champ"
            autoComplete="off"
            placeholder="Ex. 90 90 90 90"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="etiquette">Adresse</span>
          <input
            name="adresse"
            defaultValue={client?.adresse ?? ""}
            className="champ"
            autoComplete="off"
            placeholder="Ex. Boulevard du 30 août"
          />
        </label>

        <label className="block">
          <span className="etiquette">Précision lieu</span>
          <input
            name="contact"
            defaultValue={client?.contact ?? ""}
            className="champ"
            autoComplete="off"
            placeholder="Ex. Adidogomé, 2e étage"
          />
        </label>
      </div>

      <label className="block">
        <span className="etiquette">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={client?.email ?? ""}
          className="champ"
          autoComplete="off"
          placeholder="Ex. contact@mascos.tg"
        />
      </label>

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
        >
          {enCours
            ? "Enregistrement…"
            : edition
              ? "Enregistrer les modifications"
              : "Créer le client"}
        </button>
      </div>
    </form>
  );
}