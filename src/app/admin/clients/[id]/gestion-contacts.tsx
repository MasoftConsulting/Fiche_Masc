"use client";

import { useActionState, useEffect, useState } from "react";
import {
  creerContactAction,
  modifierContactAction,
  supprimerContactAction,
  type EtatContact,
} from "@/app/admin/contacts/actions";
import type { Contact } from "@/lib/contacts";

export function GestionContacts({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Contacts ({contacts.length})
        </h2>
        {!ajoutOuvert && (
          <button
            type="button"
            onClick={() => setAjoutOuvert(true)}
            className="rounded-full bg-ink/[0.05] px-4 py-2 text-[0.78rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.97]"
          >
            + Ajouter un contact
          </button>
        )}
      </header>

      {ajoutOuvert && (
        <BlocAjout clientId={clientId} onFermer={() => setAjoutOuvert(false)} />
      )}

      {contacts.length === 0 && !ajoutOuvert && (
        <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-12 text-center">
            <p className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Aucun contact de référence
            </p>
            <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink-soft">
              Ajoutez les interlocuteurs de ce client. Ils apparaîtront dans la
              fiche d&apos;intervention pour remplir automatiquement le nom, l&apos;email et le
              téléphone.
            </p>
          </div>
        </div>
      )}

      {contacts.map((c) => (
        <LigneContact key={c.id} contact={c} />
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
  const [etat, soumettre, enCours] = useActionState<EtatContact, FormData>(
    creerContactAction,
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
            <label className="block">
              <span className="etiquette">Nom du contact *</span>
              <input
                name="nom"
                className="champ"
                required
                autoFocus
                autoComplete="off"
                placeholder="Ex. Bemate"
              />
            </label>
            <label className="block">
              <span className="etiquette">Poste / Fonction</span>
              <input
                name="poste"
                className="champ"
                autoComplete="off"
                placeholder="Ex. Responsable parc"
              />
            </label>
            <label className="block">
              <span className="etiquette">Email</span>
              <input
                name="email"
                type="email"
                className="champ"
                autoComplete="off"
                placeholder="Ex. bemate@mascos.tg"
              />
            </label>
            <label className="block">
              <span className="etiquette">Téléphone</span>
              <input
                name="telephone"
                type="tel"
                className="champ"
                autoComplete="off"
                placeholder="Ex. 90 12 34 56"
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

function LigneContact({ contact }: { contact: Contact }) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  if (edition) {
    return (
      <BlocEdition contact={contact} onFermer={() => setEdition(false)} />
    );
  }

  return (
    <article className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-700 ease-mass hover:bg-white/70">
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[1.1rem] font-semibold tracking-[-0.03em]">
              {contact.nom}
              {contact.poste && (
                <span className="ml-2 font-sans text-[0.75rem] font-normal text-ink-soft">
                  {contact.poste}
                </span>
              )}
            </h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-ink-soft">
              {contact.email && <span>{contact.email}</span>}
              {contact.telephone && <span>☎ {contact.telephone}</span>}
              {!contact.email && !contact.telephone && (
                <span className="text-ink-faint">Aucune coordonnée</span>
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
                <form action={supprimerContactAction}>
                  <input type="hidden" name="id" value={contact.id} />
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
  contact,
  onFermer,
}: {
  contact: Contact;
  onFermer: () => void;
}) {
  const [etat, soumettre, enCours] = useActionState<EtatContact, FormData>(
    modifierContactAction,
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
          <input type="hidden" name="id" value={contact.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="etiquette">Nom du contact *</span>
              <input
                name="nom"
                defaultValue={contact.nom}
                className="champ"
                required
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Poste / Fonction</span>
              <input
                name="poste"
                defaultValue={contact.poste ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={contact.email ?? ""}
                className="champ"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Téléphone</span>
              <input
                name="telephone"
                type="tel"
                defaultValue={contact.telephone ?? ""}
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