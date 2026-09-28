import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { EntreeJournalLigne } from "@/components/entree-journal";
import { lireSessionAdmin } from "@/lib/session";
import { listerTechniciens } from "@/lib/techniciens";
import {
  ACTIONS,
  LABELS_ACTION,
  compterParAction,
  listerJournal,
  type ActionJournal,
} from "@/lib/journal";
import { supabaseConfigure } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAR_PAGE = 50;

type Params = Promise<{
  action?: string;
  acteur?: string;
  page?: string;
}>;

/** Ordre des actions dans le sélecteur — regroupé par domaine. */
const ORDRE_ACTIONS: ActionJournal[] = [
  ACTIONS.FICHE_CREATION,
  ACTIONS.FICHE_MODIFICATION,
  ACTIONS.FICHE_SIGNATURE,
  ACTIONS.FICHE_SUPPRESSION,
  ACTIONS.TECHNICIEN_CREATION,
  ACTIONS.TECHNICIEN_MODIFICATION,
  ACTIONS.TECHNICIEN_DESACTIVATION,
  ACTIONS.TECHNICIEN_REACTIVATION,
  ACTIONS.TECHNICIEN_CODE_REGENE,
  ACTIONS.TECHNICIEN_SUPPRESSION,
  ACTIONS.SESSION_CONNEXION,
  ACTIONS.SESSION_DECONNEXION,
];

export default async function PageJournal({
  searchParams,
}: {
  searchParams: Params;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  if (!supabaseConfigure) {
    return (
      <div className="pt-16">
        <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9">
            <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
              Supabase n&apos;est pas connecté
            </h1>
            <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">
              Le journal vit dans la table{" "}
              <code className="rounded bg-ink/5 px-1.5 py-0.5">journal</code>.
              Renseignez <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const actionFiltre = sp.action && sp.action in LABELS_ACTION ? sp.action : undefined;
  const acteurFiltre = sp.acteur ?? undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const decalage = (page - 1) * PAR_PAGE;

  const [entrees, techniciens, compteurs] = await Promise.all([
    listerJournal({
      action: actionFiltre,
      acteurId: acteurFiltre,
      limite: PAR_PAGE,
      decalage,
    }),
    listerTechniciens(),
    compterParAction(30),
  ]);

  // On ne peut pas savoir combien d'entrées au total sans un count séparé.
  // Une page pleine = probablement d'autres pages après ; une page incomplète
  // = on est à la fin. Approximation suffisante pour une navigation simple.
  const aSuivant = entrees.length === PAR_PAGE;

  const total30j = Object.values(compteurs).reduce((s, n) => s + n, 0);

  const construireLien = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (params.action) p.set("action", params.action);
    if (params.acteur) p.set("acteur", params.acteur);
    if (params.page && params.page !== "1") p.set("page", params.page);
    const qs = p.toString();
    return qs ? `/admin/journal?${qs}` : "/admin/journal";
  };

  const filtresActifs = Boolean(actionFiltre || acteurFiltre);

  return (
    <div className="space-y-10">
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/admin"
            aria-label="Retour à l'administration"
            className="inline-flex items-center gap-2 text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 3.5 5 8l4.5 4.5" />
            </svg>
            Administration
          </Link>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Journal d&apos;activité
              </span>
              <h1 className="mt-6 font-display text-[2.4rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.2rem]">
                Historique
                <br />
                <span className="text-ink-faint">des actions</span>
              </h1>
            </div>
            <p className="text-[0.82rem] text-ink-soft md:max-w-xs">
              {total30j} action{total30j > 1 ? "s" : ""} sur les 30 derniers jours.
              Chaque entrée reste lisible même après suppression de la cible.
            </p>
          </div>
        </header>
      </Reveler>

      <Reveler delai={80}>
        <form className="rounded-[1.5rem] bg-white/50 p-1.5 ring-1 ring-white/70">
          <div className="flex flex-col gap-3 rounded-[calc(1.5rem-0.375rem)] bg-surface p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="etiquette" htmlFor="action">
                Type d&apos;action
              </label>
              <select
                id="action"
                name="action"
                defaultValue={actionFiltre ?? ""}
                className="champ"
              >
                <option value="">Toutes les actions</option>
                {ORDRE_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {LABELS_ACTION[a]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="etiquette" htmlFor="acteur">
                Auteur
              </label>
              <select
                id="acteur"
                name="acteur"
                defaultValue={acteurFiltre ?? ""}
                className="champ"
              >
                <option value="">Tous les auteurs</option>
                {techniciens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                    {t.actif ? "" : " (inactif)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-3 text-[0.85rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97]"
              >
                Filtrer
              </button>
              {filtresActifs && (
                <Link
                  href="/admin/journal"
                  className="grid place-items-center rounded-full px-4 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
                >
                  Effacer
                </Link>
              )}
            </div>
          </div>
        </form>
      </Reveler>

      <section className="space-y-2">
        {entrees.length === 0 ? (
          <Reveler delai={140}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
                <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
                  {filtresActifs ? "Aucune action ne correspond" : "Aucune action enregistrée"}
                </p>
                <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                  {filtresActifs
                    ? "Élargissez les filtres pour retrouver l'historique complet."
                    : "Les prochaines actions effectuées dans l'application apparaîtront ici."}
                </p>
              </div>
            </div>
          </Reveler>
        ) : (
          <>
            {entrees.map((entree, i) => (
              <Reveler key={entree.id} delai={Math.min(i, 8) * 30}>
                <EntreeJournalLigne entree={entree} />
              </Reveler>
            ))}

            {(page > 1 || aSuivant) && (
              <Reveler delai={200}>
                <nav
                  aria-label="Pagination du journal"
                  className="flex items-center justify-center gap-2 pt-6"
                >
                  <Link
                    href={construireLien({
                      action: actionFiltre,
                      acteur: acteurFiltre,
                      page: String(Math.max(1, page - 1)),
                    })}
                    aria-disabled={page === 1}
                    tabIndex={page === 1 ? -1 : undefined}
                    className={`rounded-full px-4 py-2 text-[0.82rem] transition-all duration-500 ease-mass ${
                      page === 1
                        ? "pointer-events-none text-ink-faint/50"
                        : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    ← Précédent
                  </Link>

                  <span className="rounded-full bg-ink/[0.05] px-4 py-2 font-mono text-[0.78rem] text-ink-soft">
                    page {page}
                  </span>

                  <Link
                    href={construireLien({
                      action: actionFiltre,
                      acteur: acteurFiltre,
                      page: String(page + 1),
                    })}
                    aria-disabled={!aSuivant}
                    tabIndex={!aSuivant ? -1 : undefined}
                    className={`rounded-full px-4 py-2 text-[0.82rem] transition-all duration-500 ease-mass ${
                      !aSuivant
                        ? "pointer-events-none text-ink-faint/50"
                        : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    Suivant →
                  </Link>
                </nav>
              </Reveler>
            )}
          </>
        )}
      </section>
    </div>
  );
}