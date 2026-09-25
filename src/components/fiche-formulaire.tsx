"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { enregistrerFiche, type EtatFormulaire } from "@/app/actions";
import { LogoComplet } from "./marque";
import { SignaturePad } from "./signature-pad";
import { RESULTATS, TESTS_EFFECTUES, TYPES_INTERVENTION, type Fiche } from "@/lib/types";

/**
 * Saisie de la fiche d'intervention.
 *
 * L'ordre et les intitulés suivent exactement le document papier (sections 1 à
 * 9) : un technicien qui connaît le formulaire imprimé retrouve ses repères.
 */
export function FicheFormulaire({
  fiche,
  numeroPropose,
  technicienParDefaut,
}: {
  fiche?: Fiche;
  numeroPropose?: string;
  technicienParDefaut: string;
}) {
  const [etat, action] = useActionState<EtatFormulaire, FormData>(enregistrerFiche, {});
  const v = fiche;

  return (
    <form action={action} className="space-y-6">
      {v && <input type="hidden" name="id" value={v.id} />}
      {!v && <input type="hidden" name="numero" value={numeroPropose ?? ""} />}

      {/* Bandeau de marque, calqué sur l'en-tête de la feuille imprimée : le
          technicien retrouve à l'écran le document qu'il fera signer. */}
      <header className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
        <div className="flex flex-col items-center gap-5 rounded-[calc(2rem-0.375rem)] bg-navy-deep px-6 py-6 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <span className="shrink-0 rounded-2xl bg-white px-4 py-3">
            <LogoComplet largeur={78} priority />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.3rem]">
              MA SOFT CONSULTING
            </p>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-white/55">
              Solutions d&apos;impression · Maintenance · Installation · Configuration
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="font-display text-[0.98rem] font-semibold text-white">
              Fiche d&apos;intervention
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.65rem] text-[#ffd24a]">
              <span className="h-1.5 w-1.5 bg-[#ffd24a]" />
              Validation client requise
            </p>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------- en-tête */}
      <Section titre="En-tête" numero="0" description="Identification de la fiche">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Champ label="N° intervention">
            <input
              className="champ font-mono"
              defaultValue={v?.numero ?? numeroPropose ?? ""}
              readOnly
              aria-readonly="true"
            />
          </Champ>
          <Champ label="Date d'intervention">
            <input
              type="date"
              name="date_intervention"
              className="champ"
              defaultValue={v?.date_intervention ?? new Date().toISOString().slice(0, 10)}
            />
          </Champ>
          <Champ label="Arrivée">
            <input type="time" name="heure_arrivee" className="champ" defaultValue={v?.heure_arrivee ?? ""} />
          </Champ>
          <Champ label="Départ">
            <input type="time" name="heure_depart" className="champ" defaultValue={v?.heure_depart ?? ""} />
          </Champ>
          <Champ label="Facturable">
            <select name="facturable" className="champ" defaultValue={v?.facturable ?? ""}>
              <option value="">—</option>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
            </select>
          </Champ>
        </div>
      </Section>

      {/* --------------------------------------------- 1. informations */}
      <Section titre="Informations générales" numero="1">
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Société *">
            <input name="societe" className="champ" defaultValue={v?.societe ?? ""} required placeholder="UTB" />
          </Champ>
          <Champ label="Adresse">
            <input name="adresse" className="champ" defaultValue={v?.adresse ?? ""} placeholder="Boulevard Circulaire, Lomé" />
          </Champ>
          <Champ label="Contact">
            <input name="contact" className="champ" defaultValue={v?.contact ?? ""} />
          </Champ>
          <Champ label="Téléphone">
            <input name="telephone" type="tel" className="champ" defaultValue={v?.telephone ?? ""} />
          </Champ>
          <Champ label="Email">
            <input name="email" type="email" className="champ" defaultValue={v?.email ?? ""} />
          </Champ>
          <Champ label="Technicien">
            <input name="technicien" className="champ" defaultValue={v?.technicien ?? technicienParDefaut} />
          </Champ>
        </div>
      </Section>

      {/* ------------------------------------------------ 2. type */}
      <Section titre="Type d'intervention" numero="2" description="Plusieurs choix possibles">
        <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {TYPES_INTERVENTION.map((type) => (
            <label
              key={type.cle}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-500 ease-mass hover:bg-ink/[0.03]"
            >
              <input
                type="checkbox"
                name={`type_${type.cle}`}
                className="case"
                defaultChecked={v?.types.includes(type.cle)}
              />
              <span className="text-[0.9rem] text-ink">{type.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 max-w-md">
          <Champ label="Préciser « Autre »">
            <input name="type_autre" className="champ" defaultValue={v?.type_autre ?? ""} />
          </Champ>
        </div>
      </Section>

      {/* -------------------------------------------- 3. matériel */}
      <Section titre="Matériel concerné" numero="3">
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Marque / Modèle">
            <input name="marque_modele" className="champ" defaultValue={v?.marque_modele ?? ""} />
          </Champ>
          <Champ label="N° de série">
            <input name="numero_serie" className="champ font-mono" defaultValue={v?.numero_serie ?? ""} />
          </Champ>
          <Champ label="Adresse IP">
            <input name="adresse_ip" className="champ font-mono" defaultValue={v?.adresse_ip ?? ""} placeholder="192.168.1.50" />
          </Champ>
          <Champ label="Localisation">
            <input name="localisation" className="champ" defaultValue={v?.localisation ?? ""} />
          </Champ>
        </div>
      </Section>

      {/* -------------------------------------------- 4. compteurs */}
      <Section titre="Compteur machine" numero="4" description="Relevé validé par le client">
        <div className="grid gap-4 sm:grid-cols-2">
          <Compteur
            titre="Noir & blanc"
            nom="compteur_nb"
            valeur={v?.compteur_nb ?? ""}
            valide={v?.compteur_nb_valide ?? false}
          />
          <Compteur
            titre="Couleur"
            nom="compteur_couleur"
            valeur={v?.compteur_couleur ?? ""}
            valide={v?.compteur_couleur_valide ?? false}
          />
        </div>
      </Section>

      {/* ---------------------------------------------- 5. détail */}
      <Section titre="Détail de l'intervention" numero="5">
        <textarea
          name="detail"
          className="champ min-h-[11rem]"
          defaultValue={v?.detail ?? ""}
          placeholder="Constat, opérations réalisées, pièces remplacées…"
        />
      </Section>

      {/* --------------------------------------------- 6. résultat */}
      <Section titre="Résultat de l'intervention" numero="6">
        <div className="grid gap-3 sm:grid-cols-3">
          {RESULTATS.map((resultat) => (
            <label
              key={resultat.cle}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-500 ease-mass hover:bg-ink/[0.03]"
            >
              <input
                type="radio"
                name="resultat"
                value={resultat.cle}
                className="pastille"
                defaultChecked={v?.resultat === resultat.cle}
              />
              <span className="text-[0.9rem]">{resultat.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <Champ label="Commentaires">
            <input name="commentaires" className="champ" defaultValue={v?.commentaires ?? ""} />
          </Champ>
        </div>
      </Section>

      {/* ------------------------------------------------ 7. tests */}
      <Section titre="Tests effectués" numero="7">
        <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTS_EFFECTUES.map((test) => (
            <label
              key={test.cle}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-500 ease-mass hover:bg-ink/[0.03]"
            >
              <input
                type="checkbox"
                name={`test_${test.cle}`}
                className="case"
                defaultChecked={v?.tests.includes(test.cle)}
              />
              <span className="text-[0.9rem]">{test.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <Champ label="Autres tests">
            <input name="tests_autres" className="champ" defaultValue={v?.tests_autres ?? ""} />
          </Champ>
        </div>
      </Section>

      {/* -------------------------------------- 8. recommandations */}
      <Section titre="Recommandations / actions à prévoir" numero="8">
        <textarea
          name="recommandations"
          className="champ min-h-[9rem]"
          defaultValue={v?.recommandations ?? ""}
          placeholder="Consommables à commander, prochaine visite, formation à planifier…"
        />
      </Section>

      {/* ------------------------------------------- 9. validation */}
      <Section
        titre="Validation client"
        numero="9"
        description="La fiche passe en « signée » dès que le client a signé"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Nom du client">
            <input name="client_nom" className="champ" defaultValue={v?.client_nom ?? ""} />
          </Champ>
          <Champ label="Fonction">
            <input name="client_fonction" className="champ" defaultValue={v?.client_fonction ?? ""} />
          </Champ>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <SignaturePad
            nom="signature_client"
            legende="Signature client + tampon"
            valeurInitiale={v?.signature_client}
          />
          <SignaturePad
            nom="signature_technicien"
            legende="Signature technicien"
            valeurInitiale={v?.signature_technicien}
          />
        </div>
      </Section>

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-5 py-4 text-[0.87rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <BarreActions id={v?.id} />
    </form>
  );
}

/* ------------------------------------------------------------ éléments */

function Section({
  titre,
  numero,
  description,
  children,
}: {
  titre: string;
  numero: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-7 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span className="font-mono text-[0.7rem] text-brand">{numero.padStart(2, "0")}</span>
          <div>
            <h2 className="font-display text-[1.3rem] font-semibold tracking-[-0.03em]">{titre}</h2>
            {description && <p className="mt-1 text-[0.78rem] text-ink-faint">{description}</p>}
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="etiquette">{label}</span>
      {children}
    </label>
  );
}

function Compteur({
  titre,
  nom,
  valeur,
  valide,
}: {
  titre: string;
  nom: string;
  valeur: string;
  valide: boolean;
}) {
  return (
    <div className="rounded-[1.35rem] bg-ink/[0.03] p-1.5 ring-1 ring-hairline">
      <div className="rounded-[calc(1.35rem-0.375rem)] bg-surface p-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-navy">{titre}</p>
        <div className="mt-4">
          <Champ label="Compteur actuel">
            <input name={nom} className="champ font-mono" inputMode="numeric" defaultValue={valeur} />
          </Champ>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input type="checkbox" name={`${nom}_valide`} className="case" defaultChecked={valide} />
          <span className="text-[0.83rem] text-ink-soft">Relevé validé par le client</span>
        </label>
      </div>
    </div>
  );
}

function BarreActions({ id }: { id?: string }) {
  const { pending } = useFormStatus();

  return (
    <div
      className="sticky z-20 mt-8"
      // Au-dessus de la barre gestuelle iOS, jamais dessous.
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="rounded-full border border-white/60 bg-white/70 p-2 shadow-souleve backdrop-blur-2xl">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:pl-5">
          <p className="hidden text-[0.78rem] text-ink-soft sm:block">
            {id ? "Modification de la fiche" : "Nouvelle fiche"} — les champs vides restent vides à
            l&apos;impression.
          </p>

          <div className="flex w-full gap-2 sm:w-auto">
            {id && (
              <Link
                href={`/impression/${id}`}
                target="_blank"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink/[0.05] px-5 py-3 text-[0.88rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.98] sm:flex-none"
              >
                Aperçu impression
              </Link>
            )}

            <button
              type="submit"
              disabled={pending}
              className="group flex flex-1 items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.92rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              <span>{pending ? "Enregistrement…" : "Enregistrer"}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8.4l3.4 3.4L13 4.6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
