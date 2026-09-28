import Link from "next/link";
import { PuceResultat, PuceStatut } from "@/components/statut";
import { formaterDate, dureeIntervention, initiales } from "@/lib/format";
import { labelType, type Fiche } from "@/lib/types";

/**
 * Sous-ensemble des champs de `Fiche` affichés par la carte.
 *
 * Dérivé du type officiel via `Pick<>` plutôt que redéclaré : les puces
 * `PuceStatut` et `PuceResultat` attendent des types stricts (`Statut`,
 * `Resultat`), et redéclarer l'interface en `string` casserait le typage.
 */
type FicheListe = Pick<
  Fiche,
  | "id"
  | "numero"
  | "statut"
  | "resultat"
  | "technicien"
  | "date_intervention"
  | "societe"
  | "contact"
  | "marque_modele"
  | "localisation"
  | "heure_arrivee"
  | "heure_depart"
  | "types"
>;

export function CarteFiche({
  fiche,
  admin,
}: {
  fiche: FicheListe;
  admin: boolean;
}) {
  return (
    <Link
      href={`/fiches/${fiche.id}`}
      className="group block rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-700 ease-mass hover:bg-white/80 hover:shadow-souleve"
    >
      <article className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-[0.72rem] tracking-[0.06em] text-brand">
            {fiche.numero}
          </span>
          <PuceStatut statut={fiche.statut} />
          <PuceResultat resultat={fiche.resultat} />

          {admin && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/[0.07] py-0.5 pr-2.5 pl-0.5 text-[0.68rem] text-navy">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-navy text-[0.52rem] font-semibold text-white">
                {initiales(fiche.technicien)}
              </span>
              {fiche.technicien ?? "Non attribuée"}
            </span>
          )}

          <span className="ml-auto text-[0.75rem] text-ink-faint">
            {formaterDate(fiche.date_intervention)}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[1.35rem] font-semibold tracking-[-0.03em]">
              {fiche.societe ?? "Société non renseignée"}
            </h2>
            <p className="mt-1 truncate text-[0.82rem] text-ink-soft">
              {[fiche.contact, fiche.marque_modele, fiche.localisation]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              {!admin && (
                <p className="text-[0.7rem] text-ink-faint">
                  {fiche.technicien ?? "—"}
                </p>
              )}
              <p className="text-[0.7rem] text-ink-faint">
                {dureeIntervention(fiche.heure_arrivee, fiche.heure_depart) ??
                  "durée n. c."}
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink-soft transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:bg-ink group-hover:text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10" />
              </svg>
            </span>
          </div>
        </div>

        {fiche.types.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-hairline pt-4">
            {fiche.types.slice(0, 4).map((type) => (
              <span
                key={type}
                className="rounded-full bg-ink/[0.04] px-2.5 py-1 text-[0.68rem] text-ink-soft"
              >
                {labelType(type)}
              </span>
            ))}
            {fiche.types.length > 4 && (
              <span className="px-1.5 py-1 text-[0.68rem] text-ink-faint">
                +{fiche.types.length - 4}
              </span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}