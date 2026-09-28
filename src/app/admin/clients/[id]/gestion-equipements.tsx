"use client";

import { useActionState, useEffect, useState } from "react";
import {
  creerEquipementAction,
  modifierEquipementAction,
  supprimerEquipementAction,
  type EtatEquipement,
} from "@/app/admin/equipements/actions";
import type { Equipement } from "@/lib/equipements";

export function GestionEquipements({
  clientId,
  equipements,
}: {
  clientId: string;
  equipements: Equipement[];
}) {
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Équipements ({equipements.length})
        </h2>
        {!ajoutOuvert && (
          <button
            type="button"
            onClick={() => setAjoutOuvert(true)}
            className="rounded-full bg-ink/[0.05] px-4 py-2 text-[0.78rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.97]"
          >
            + Ajouter un équipement
          </button>
        )}
      </header>

      {ajoutOuvert && (
        <BlocAjout clientId={clientId} onFermer={() => setAjoutOuvert(false)} />
      )}

      {equipements.length === 0 && !ajoutOuvert && (
        <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-12 text-center">
            <p className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Aucun équipement
            </p>
            <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink-soft">
              Ajoutez les machines de ce client pour les retrouver ensuite dans la
              fiche d&apos;intervention.
            </p>
          </div>
        </div>
      )}

      {equipements.map((e) => (
        <LigneEquipement key={e.id} equipement={e} />
      ))}
    </section>
  );
}

/* -------------------------------------------------------- ajout */

function BlocAjout({
  clientId,
  onFermer,
}: {
  clientId: string;
  onFermer: () => void;
}) {
  const [etat, soumettre, enCours] = useActionState<EtatEquipement, FormData>(
    creerEquipementAction,
    {},
  );

  useEffect(() => {
    if (etat.ok) onFermer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.ok]);

  return (
    <div className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-brand/30">
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-6">
        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="client_id" value={clientId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="etiquette">Marque / Modèle *</span>
              <input
                name="marque_modele"
                className="champ"
                required
                autoFocus
                autoComplete="off"
                placeholder="Ex. HP LaserJet M428"
              />
            </label>
            <label className="block">
              <span className="etiquette">N° de série</span>
              <input name="numero_serie" className="champ" autoComplete="off" />
            </label>
            <label className="block">
              <span className="etiquette">Adresse IP</span>
              <input
                name="adresse_ip"
                className="champ"
                autoComplete="off"
                placeholder="Ex. 192.168.1.42"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="etiquette">Localisation</span>
              <input
                name="localisation"
                className="champ"
                autoComplete="off"
                placeholder="Ex. Atelier, 2e étage"
              />
            </label>
          </div>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onFermer}
              className="rounded-full px-4 py-2 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97] disabled:opacity-60"
            >
              {enCours ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- ligne + édition */

function LigneEquipement({ equipement }: { equipement: Equipement }) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  if (edition) {
    return (
      <BlocEdition
        equipement={equipement}
        onFermer={() => setEdition(false)}
      />
    );
  }

  return (
    <article className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-700 ease-mass hover:bg-white/70">
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[1.1rem] font-semibold tracking-[-0.03em]">
              {equipement.marque_modele ?? "—"}
            </h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-ink-soft">
              {equipement.numero_serie && (
                <span>
                  <span className="text-ink-faint">N° série</span>{" "}
                  {equipement.numero_serie}
                </span>
              )}
              {equipement.adresse_ip && (
                <span>
                  <span className="text-ink-faint">IP</span> {equipement.adresse_ip}
                </span>
              )}
              {equipement.localisation && (
                <span>
                  <span className="text-ink-faint">Lieu</span>{" "}
                  {equipement.localisation}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!confirmeSuppression ? (
              <>
                <button
                  type="button"
                  onClick={() => setEdition(true)}
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmeSuppression(true)}
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
                >
                  Supprimer
                </button>
              </>
            ) : (
              <>
                <span className="mr-2 text-[0.75rem] text-ink-soft">
                  Confirmer ?
                </span>
                <form action={supprimerEquipementAction}>
                  <input type="hidden" name="id" value={equipement.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-rouille px-3 py-2 text-[0.75rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-rouille/90 active:scale-[0.97]"
                  >
                    Oui
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmeSuppression(false)}
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-faint hover:text-ink"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function BlocEdition({
  equipement,
  onFermer,
}: {
  equipement: Equipement;
  onFermer: () => void;
}) {
  const [etat, soumettre, enCours] = useActionState<EtatEquipement, FormData>(
    modifierEquipementAction,
    {},
  );

  useEffect(() => {
    if (etat.ok) onFermer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.ok]);

  return (
    <div className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-brand/30">
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-6">
        <form action={soumettre} className="space-y-4">
          <input type="hidden" name="id" value={equipement.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="etiquette">Marque / Modèle *</span>
              <input
                name="marque_modele"
                defaultValue={equipement.marque_modele ?? ""}
                className="champ"
                required
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">N° de série</span>
              <input
                name="numero_serie"
                defaultValue={equipement.numero_serie ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Adresse IP</span>
              <input
                name="adresse_ip"
                defaultValue={equipement.adresse_ip ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="etiquette">Localisation</span>
              <input
                name="localisation"
                defaultValue={equipement.localisation ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
          </div>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onFermer}
              className="rounded-full px-4 py-2 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97] disabled:opacity-60"
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}