import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { Tuile } from "@/components/tuile";
import { Pagination } from "@/components/pagination";
import { FiltresFiches } from "@/components/filtres-fiches";
import { AvertissementConfiguration } from "@/components/avertissement-configuration";
import { ListeFichesSelection } from "@/components/liste-fiches-selection";
import {
  compterParStatut,
  estPeriode,
  listerFiches,
  SANS_TECHNICIEN,
} from "@/lib/fiches";
import { listerTechniciens } from "@/lib/techniciens";
import { lireSession } from "@/lib/session";
import { supabaseConfigure } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  statut?: string;
  technicien?: string;
  periode?: string;
  page?: string;
  supprime?: string;
  erreur?: string;
}>;

type FiltresCourants = {
  q?: string;
  statut?: string;
  technicien?: string;
  periode?: string;
};

/** Reconstruit une URL de filtre en conservant les paramètres courants. */
function construireUrl(
  base: string,
  actuels: FiltresCourants,
  modifications: FiltresCourants,
): string {
  const p = new URLSearchParams();
  const tout = { ...actuels, ...modifications };
  for (const [cle, valeur] of Object.entries(tout)) {
    if (valeur) p.set(cle, valeur);
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

function construireLienExport(actuels: FiltresCourants): string {
  const p = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(actuels)) {
    if (valeur) p.set(cle, valeur);
  }
  const qs = p.toString();
  return qs ? `/fiches/export?${qs}` : "/fiches/export";
}

/** Chip de filtre actif : cliquable pour le retirer. */
function Chip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-navy/[0.07] py-1.5 pr-3 pl-3.5 text-[0.78rem] text-navy transition-all duration-500 ease-mass hover:bg-navy/[0.12]"
    >
      {label}
      <span
        aria-hidden="true"
        className="grid h-4 w-4 place-items-center rounded-full bg-navy/10 text-[0.72rem] transition-all duration-500 ease-mass group-hover:bg-navy/20"
      >
        ✕
      </span>
    </Link>
  );
}

export default async function PageFiches({
  searchParams,
}: {
  searchParams: Params;
}) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const sp = await searchParams;
  const { q, statut, technicien, supprime, erreur } = sp;
  const periode = estPeriode(sp.periode) ? sp.periode : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  if (!supabaseConfigure) return <AvertissementConfiguration />;

  const admin = session.role === "admin";
  const limiteA = admin ? null : session.id;

  const [resultat, techniciens, stats] = await Promise.all([
    listerFiches({
      recherche: q,
      statut,
      technicienId: admin ? technicien : undefined,
      limiteA,
      periode,
      page,
    }),
    admin ? listerTechniciens() : Promise.resolve([]),
    compterParStatut(limiteA),
  ]);

  const { fiches, pages } = resultat;

  const filtreActif = Boolean(q || statut || periode || (admin && technicien));
  const nomTechnicienFiltre =
    technicien === SANS_TECHNICIEN
      ? "les fiches non attribuées"
      : techniciens.find((t) => t.id === technicien)?.nom;

  const filtresCourants: FiltresCourants = { q, statut, technicien, periode };

  const construireLien = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (statut) p.set("statut", statut);
    if (admin && technicien) p.set("technicien", technicien);
    if (periode) p.set("periode", periode);
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return qs ? `/fiches?${qs}` : "/fiches";
  };

  const labelPeriode =
    periode === "7j"
      ? "7 derniers jours"
      : periode === "mois"
        ? "ce mois-ci"
        : periode === "annee"
          ? "cette année"
          : null;

  return (
    <div className="space-y-12">
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
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Link
                href={construireLienExport(filtresCourants)}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink/[0.05] px-5 py-3 text-[0.85rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/[0.09] active:scale-[0.97]"
              >
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
                  <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13h10" />
                </svg>
                Exporter
              </Link>

              {admin && (
                <Link
                  href="/fiches/nouvelle"
                  className="group flex items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
                >
                  <span>Nouvelle fiche</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M8 3.5v9M3.5 8h9" />
                    </svg>
                  </span>
                </Link>
              )}
            </div>
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

      {filtreActif && (
        <Reveler delai={60}>
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Filtres actifs
            </span>

            {periode && labelPeriode && (
              <Chip
                label={labelPeriode}
                href={construireUrl("/fiches", filtresCourants, {
                  periode: undefined,
                })}
              />
            )}
            {statut && (
              <Chip
                label={statut === "signee" ? "Signées" : "Brouillons"}
                href={construireUrl("/fiches", filtresCourants, {
                  statut: undefined,
                })}
              />
            )}
            {q && (
              <Chip
                label={`« ${q} »`}
                href={construireUrl("/fiches", filtresCourants, { q: undefined })}
              />
            )}
            {admin && technicien && nomTechnicienFiltre && (
              <Chip
                label={`Technicien : ${nomTechnicienFiltre}`}
                href={construireUrl("/fiches", filtresCourants, {
                  technicien: undefined,
                })}
              />
            )}

            <Link
              href="/fiches"
              className="ml-1 text-[0.75rem] text-ink-soft underline underline-offset-4 transition-colors duration-500 ease-mass hover:text-ink"
            >
              Tout effacer
            </Link>
          </div>
        </Reveler>
      )}

      <Reveler delai={80}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Tuile
            className="md:col-span-5"
            valeur={stats.total}
            libelle={admin ? "Fiches de l'équipe" : "Mes fiches"}
            note="Depuis la mise en service"
            large
            href="/fiches"
            actif={!filtreActif}
          />
          <Tuile
            className="md:col-span-3"
            valeur={stats.mois}
            libelle="Ce mois-ci"
            href={construireUrl("/fiches", filtresCourants, { periode: "mois" })}
            actif={periode === "mois"}
          />
          <Tuile
            className="md:col-span-2"
            valeur={stats.signee}
            libelle="Signées"
            ton="jade"
            href={construireUrl("/fiches", filtresCourants, { statut: "signee" })}
            actif={statut === "signee"}
          />
          <Tuile
            className="md:col-span-2"
            valeur={stats.brouillon}
            libelle="À finaliser"
            ton="amber"
            href={construireUrl("/fiches", filtresCourants, { statut: "brouillon" })}
            actif={statut === "brouillon"}
          />
        </section>
      </Reveler>

      <Reveler delai={140}>
        <FiltresFiches
          admin={admin}
          techniciens={techniciens}
          SANS_TECHNICIEN={SANS_TECHNICIEN}
          valeursInitiales={{
            q: q ?? "",
            statut: statut ?? "",
            technicien: technicien ?? "",
            periode: periode ?? "",
          }}
        />
      </Reveler>

      <section className="space-y-3">
        {fiches.length === 0 ? (
          <Reveler delai={180}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-20 text-center">
                <p className="font-display text-[1.5rem] font-semibold tracking-[-0.03em]">
                  {filtreActif
                    ? "Aucune fiche ne correspond"
                    : admin
                      ? "Aucune fiche pour l'instant"
                      : "Aucune intervention affectée"}
                </p>
                <p className="mx-auto mt-3 max-w-sm text-[0.9rem] leading-relaxed text-ink-soft">
                  {filtreActif
                    ? "Élargissez la recherche ou effacez les filtres."
                    : admin
                      ? "La première intervention saisie apparaîtra ici, prête à imprimer."
                      : "Aucune fiche ne vous est encore affectée. Vous serez notifié dès qu'une intervention vous sera attribuée."}
                </p>
                {!filtreActif && admin && (
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
          <>
            <ListeFichesSelection fiches={fiches} admin={admin} />
            <Pagination
              page={page}
              pages={pages}
              construireLien={construireLien}
            />
          </>
        )}
      </section>
    </div>
  );
}