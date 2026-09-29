import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireSessionAdmin } from "@/lib/session";
import { lireTechnicienAvecStats } from "@/lib/techniciens";
import { initiales, formaterDate } from "@/lib/format";
import { FormulaireEdition } from "./formulaire-edition";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ erreur?: string }>;

export default async function PageTechnicien({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const { id } = await params;
  const { erreur } = await searchParams;

  const technicien = await lireTechnicienAvecStats(id);
  if (!technicien) notFound();

  const estSoiMeme = session.id === technicien.id;

  return (
    <div className="space-y-10">
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/admin/techniciens"
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

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-[0.95rem] font-semibold text-white ${
                  technicien.actif ? "bg-navy" : "bg-ink-faint"
                }`}
              >
                {initiales(technicien.nom)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {technicien.role === "admin" && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-brand">
                      Admin
                    </span>
                  )}
                  {!technicien.actif && (
                    <span className="rounded-full bg-rouille/10 px-2.5 py-1 text-[0.62rem] font-medium text-rouille">
                      Désactivé
                    </span>
                  )}
                  {estSoiMeme && (
                    <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[0.62rem] font-medium text-ink-soft">
                      Vous
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[2.4rem]">
                  {technicien.nom}
                </h1>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hairline pt-5 sm:grid-cols-4 sm:border-t-0 sm:pt-0">
              <Stat valeur={technicien.total} libelle="fiches" />
              <Stat valeur={technicien.signees} libelle="signées" ton="text-jade" />
              <Stat valeur={technicien.brouillons} libelle="brouillons" ton="text-amber" />
              <Stat valeur={technicien.mois} libelle="ce mois" />
            </dl>
          </div>
        </header>
      </Reveler>

      {erreur && <MessageErreur code={erreur} />}

      <Reveler delai={80}>
        <FormulaireEdition
          technicien={{
            id: technicien.id,
            nom: technicien.nom,
            email: technicien.email,
            role: technicien.role,
            actif: technicien.actif,
            total: technicien.total,
            derniere: technicien.derniere,
          }}
          estSoiMeme={estSoiMeme}
        />
      </Reveler>
    </div>
  );
}

function Stat({
  valeur,
  libelle,
  ton = "text-ink",
}: {
  valeur: number;
  libelle: string;
  ton?: string;
}) {
  return (
    <div>
      <dt
        className={`font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em] ${ton}`}
      >
        {valeur}
      </dt>
      <dd className="mt-1.5 text-[0.72rem] text-ink-faint">{libelle}</dd>
    </div>
  );
}

function MessageErreur({ code }: { code: string }) {
  const messages: Record<string, string> = {
    "auto-desactivation":
      "Vous ne pouvez pas désactiver votre propre compte — vous perdriez l'accès à l'administration.",
    "auto-retrogradation":
      "Vous ne pouvez pas retirer votre propre rôle d'administrateur. Demandez à un autre admin de le faire.",
    "auto-suppression":
      "Vous ne pouvez pas supprimer votre propre compte. Demandez à un autre admin de le faire.",
    "dernier-admin":
      "Impossible : ce technicien est le dernier administrateur actif. Promouvez d'abord quelqu'un d'autre.",
    "nom-invalide": "Le nom doit contenir au moins 2 caractères.",
  };
  const message = messages[code] ?? "Une erreur est survenue.";

  return (
    <p className="rounded-2xl bg-rouille/10 px-5 py-3.5 text-[0.85rem] text-rouille">
      {message}
    </p>
  );
}