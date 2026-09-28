import Link from "next/link";
import {
  LABELS_ACTION,
  tonAction,
  type ActionJournal,
  type EntreeJournal,
} from "@/lib/journal";
import { formaterDateHeure } from "@/lib/format";

/** Rend les détails selon l'action, en évitant le dump JSON brut. */
function Description({ entree }: { entree: EntreeJournal }) {
  const d = entree.details ?? {};
  const numero = typeof d.numero === "string" ? d.numero : null;
  const societe = typeof d.societe === "string" ? d.societe : null;
  const nom = typeof d.nom === "string" ? d.nom : null;
  const champs = Array.isArray(d.champs) ? (d.champs as string[]) : null;
  const changements = d.changements as Record<string, unknown> | undefined;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem] text-ink-soft">
      {numero && (
        <span className="font-mono text-[0.75rem] tracking-[0.04em] text-brand">
          {numero}
        </span>
      )}
      {societe && <span>· {societe}</span>}
      {nom && <span>· {nom}</span>}
      {typeof d.role === "string" && d.role === "admin" && (
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-brand">
          admin
        </span>
      )}
      {typeof d.origine === "string" && d.origine === "code_amorcage" && (
        <span className="text-ink-faint">· code d&apos;amorçage</span>
      )}
      {champs && champs.length > 0 && (
        <span className="text-ink-faint">
          · {champs.length} champ{champs.length > 1 ? "s" : ""} modifié
          {champs.length > 1 ? "s" : ""}
        </span>
      )}
      {changements && Object.keys(changements).length > 0 && (
        <span className="text-ink-faint">
          · {Object.keys(changements).length} champ
          {Object.keys(changements).length > 1 ? "s" : ""}
        </span>
      )}
      {typeof d.client_nom === "string" && (
        <span className="text-ink-faint">· signé par {d.client_nom}</span>
      )}
    </div>
  );
}

export function EntreeJournalLigne({ entree }: { entree: EntreeJournal }) {
  const ton = tonAction(entree.action);
  const couleurPuce =
    ton === "jade"
      ? "bg-jade"
      : ton === "rouille"
        ? "bg-rouille"
        : ton === "amber"
          ? "bg-amber"
          : "bg-ink-faint";

  const label =
  LABELS_ACTION[entree.action as ActionJournal] ?? entree.action;;

  // Lien contextuel : on pointe vers la cible si elle existe encore.
  let hrefCible: string | null = null;
  if (entree.table_cible === "fiches_intervention" && entree.ligne_id) {
    hrefCible = `/fiches/${entree.ligne_id}`;
  } else if (entree.table_cible === "techniciens" && entree.ligne_id) {
    hrefCible = `/admin/techniciens/${entree.ligne_id}`;
  }

  const contenu = (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${couleurPuce}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-medium text-ink">{label}</span>
          {entree.acteur_nom && (
            <span className="text-[0.8rem] text-ink-soft">
              par {entree.acteur_nom}
            </span>
          )}
        </div>
        <Description entree={entree} />
      </div>
      <span className="shrink-0 whitespace-nowrap text-[0.72rem] text-ink-faint">
        {formaterDateHeure(entree.created_at)}
      </span>
    </div>
  );

  if (hrefCible) {
    return (
      <Link
        href={hrefCible}
        className="block rounded-2xl bg-white/40 px-5 py-4 ring-1 ring-white/60 transition-all duration-500 ease-mass hover:bg-white/70 hover:shadow-souleve"
      >
        {contenu}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-white/40 px-5 py-4 ring-1 ring-white/60">
      {contenu}
    </div>
  );
}