import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { PuceResultat, PuceStatut } from "@/components/statut";
import { compterParStatut, listerFiches, SANS_TECHNICIEN } from "@/lib/fiches";
import { listerTechniciens } from "@/lib/techniciens";
import { lireSession } from "@/lib/session";
import { supabaseConfigure } from "@/lib/supabase";
import { formaterDate, dureeIntervention, initiales } from "@/lib/format";
import { labelType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  statut?: string;
  technicien?: string;
  supprime?: string;
  erreur?: string;
}>;

export default async function PageFiches({ searchParams }: { searchParams: Params }) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const { q, statut, technicien, supprime, erreur } = await searchParams;

  if (!supabaseConfigure) return <AvertissementConfiguration />;

  const admin = session.role === "admin";
  // Cloisonnement : hors administration, on ne voit que ses propres fiches.
  const limiteA = admin ? null : session.id;

  const [fiches, techniciens, stats] = await Promise.all([
    listerFiches({ recherche: q, statut, technicienId: admin ? technicien : undefined, limiteA }),
    admin ? listerTechniciens() : Promise.resolve([]),
    compterParStatut(limiteA),
  ]);

  const filtre = Boolean(q || statut || (admin && technicien));
  const nomTechnicienFiltre =
    technicien === SANS_TECHNICIEN
      ? "les fiches non attribuées"
      : techniciens.find((t) => t.id === technicien)?.nom;

  return (
    <div className="space-y-12">
      {/* En-tête éditorial */}
      <Reveler>
        <section className="pt-8 md:pt-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {admin ? "Registre · toute l'équipe" : "Mes interventions"}
              </span>
              <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
                Fiches
                <br />
                <span className="text-ink-faint">d&apos;intervention</span>
              </h1>
              {nomTechnicienFiltre && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy/[0.07] px-3.5 py-1.5 text-[0.78rem] text-navy">
                  Filtré sur {nomTechnicienFiltre}
                  <Link href="/fiches" className="text-ink-faint hover:text-ink">
                    ✕
                  </Link>
                </p>
              )}
            </div>

            <Link
              href="/fiches/nouvelle"
              className="group flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] md:w-auto"
            >
              <span>Nouvelle fiche</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <path d="M8 3.5v9M3.5 8h9" />
                </svg>
              </span>
            </Link>
          </div>
        </section>
      </Reveler>

      {(supprime || erreur) && (
        <p
          className={`rounded-2xl px-5 py-3.5 text-[0.85rem] ${
            erreur ? "bg-rouille/10 text-rouille" : "bg-jade/10 text-jade"
          }`}
        >
          {erreur ? "Accès réservé au compte administrateur." : "Fiche supprimée."}
        </p>
      )}

      {/* Bento asymétrique de synthèse */}
      <Reveler delai={80}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Tuile
            className="md:col-span-5"
            valeur={stats.total}
            libelle={admin ? "Fiches de l'équipe" : "Mes fiches"}
            note="Depuis la mise en service"
            large
          />
          <Tuile className="md:col-span-3" valeur={stats.mois} libelle="Ce mois-ci" />
          <Tuile className="md:col-span-2" valeur={stats.signee} libelle="Signées" ton="jade" />
          <Tuile className="md:col-span-2" valeur={stats.brouillon} libelle="À finaliser" ton="amber" />
        </section>
      </Reveler>

      {/* Filtres */}
      <Reveler delai={140}>
        <form className="rounded-[1.75rem] bg-white/50 p-1.5 ring-1 ring-white/70 shadow-flottant backdrop-blur-xl">
          <div
            className={`grid gap-3 rounded-[calc(1.75rem-0.375rem)] bg-surface p-4 sm:items-end ${
              admin ? "sm:grid-cols-[1.6fr_0.8fr_0.8fr_auto]" : "sm:grid-cols-[2fr_0.8fr_auto]"
            }`}
          >
            <div>
              <label className="etiquette" htmlFor="q">
                Rechercher
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                className="champ"
                placeholder="Société, n° de fiche, série, technicien…"
              />
            </div>

            <div>
              <label className="etiquette" htmlFor="statut">
                Statut
              </label>
              <select id="statut" name="statut" defaultValue={statut ?? ""} className="champ">
                <option value="">Tous</option>
                <option value="signee">Signées</option>
                <option value="brouillon">Brouillons</option>
              </select>
            </div>

            {/* Le choix du technicien n'a de sens qu'en administration : un
                technicien ne voit de toute façon que ses propres fiches. */}
            {admin && (
              <div>
                <label className="etiquette" htmlFor="technicien">
                  Technicien
                </label>
                <select
                  id="technicien"
                  name="technicien"
                  defaultValue={technicien ?? ""}
                  className="champ"
                >
                  <option value="">Tous les techniciens</option>
                  {techniciens.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nom}
                      {t.actif ? "" : " (inactif)"}
                    </option>
                  ))}
                  <option value={SANS_TECHNICIEN}>Non attribuées</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-3 text-[0.85rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97]"
              >
                Filtrer
              </button>
              {filtre && (
                <Link
                  href="/fiches"
                  className="grid place-items-center rounded-full px-4 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5"
                >
                  Effacer
                </Link>
              )}
            </div>
          </div>
        </form>
      </Reveler>

      {/* Liste */}
      <section className="space-y-3">
        {fiches.length === 0 ? (
          <Reveler delai={180}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-20 text-center">
                <p className="font-display text-[1.5rem] font-semibold tracking-[-0.03em]">
                  {filtre ? "Aucune fiche ne correspond" : "Aucune fiche pour l'instant"}
                </p>
                <p className="mx-auto mt-3 max-w-sm text-[0.9rem] leading-relaxed text-ink-soft">
                  {filtre
                    ? "Élargissez la recherche ou effacez les filtres."
                    : "La première intervention saisie apparaîtra ici, prête à imprimer."}
                </p>
                {!filtre && (
                  <Link
                    href="/fiches/nouvelle"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
                  >
                    Créer la première fiche
                  </Link>
                )}
              </div>
            </div>
          </Reveler>
        ) : (
          fiches.map((fiche, index) => (
            <Reveler key={fiche.id} delai={Math.min(index, 8) * 45}>
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

                    {/* En administration, l'auteur de la fiche est une donnée de
                        premier plan : on la remonte dans la ligne d'en-tête. */}
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
                        {/* Pour l'administrateur, le nom est déjà dans la pastille
                            d'en-tête : inutile de le répéter ici. */}
                        {!admin && (
                          <p className="text-[0.7rem] text-ink-faint">{fiche.technicien ?? "—"}</p>
                        )}
                        <p className="text-[0.7rem] text-ink-faint">
                          {dureeIntervention(fiche.heure_arrivee, fiche.heure_depart) ?? "durée n. c."}
                        </p>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink-soft transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:bg-ink group-hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
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
            </Reveler>
          ))
        )}
      </section>
    </div>
  );
}

function Tuile({
  valeur,
  libelle,
  note,
  ton,
  large = false,
  className = "",
}: {
  valeur: number;
  libelle: string;
  note?: string;
  ton?: "jade" | "amber";
  large?: boolean;
  className?: string;
}) {
  const couleur = ton === "jade" ? "text-jade" : ton === "amber" ? "text-amber" : "text-ink";

  return (
    <div className={`rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 ${className}`}>
      <div
        className={`flex h-full flex-col justify-between rounded-[calc(1.6rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ${
          large ? "px-7 py-8" : "px-5 py-6"
        }`}
      >
        <p
          className={`font-display font-semibold tracking-[-0.045em] ${couleur} ${
            large ? "text-[3.4rem] leading-none" : "text-[2.1rem] leading-none"
          }`}
        >
          {valeur}
        </p>
        <div className="mt-5">
          <p className="text-[0.8rem] font-medium text-ink">{libelle}</p>
          {note && <p className="mt-1 text-[0.72rem] text-ink-faint">{note}</p>}
        </div>
      </div>
    </div>
  );
}

function AvertissementConfiguration() {
  return (
    <div className="pt-16">
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9">
          <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
            Supabase n&apos;est pas connecté
          </h1>
          <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">
            Renseignez <code className="rounded bg-ink/5 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            et <code className="rounded bg-ink/5 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> dans
            <code className="mx-1 rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>, puis exécutez
            <code className="mx-1 rounded bg-ink/5 px-1.5 py-0.5">supabase/schema.sql</code> dans
            l&apos;éditeur SQL du projet Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
