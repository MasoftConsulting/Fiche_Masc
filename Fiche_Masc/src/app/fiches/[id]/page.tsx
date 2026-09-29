import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FicheFormulaire } from "@/components/fiche-formulaire";
import { Reveler } from "@/components/reveler";
import { PuceStatut } from "@/components/statut";
import { supprimerFiche } from "@/app/actions";
import { lireFiche } from "@/lib/fiches";
import { lireSession } from "@/lib/session";
import { formaterDateHeure } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PageFiche({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enregistre?: string }>;
}) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const { id } = await params;
  const { enregistre } = await searchParams;

  const fiche = await lireFiche(id);
  if (!fiche) notFound();

  // Cloisonnement : hors administration, on n'ouvre que ses propres fiches.
  // `notFound` plutôt qu'un message d'erreur — inutile de révéler l'existence
  // d'une fiche appartenant à quelqu'un d'autre.
  if (session.role !== "admin" && fiche.technicien_id !== session.id) notFound();

  return (
    <div className="space-y-8">
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/fiches"
            className="inline-flex items-center gap-2 text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 3.5 5 8l4.5 4.5" />
            </svg>
            Toutes les fiches
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[0.78rem] tracking-[0.06em] text-brand">
                  {fiche.numero}
                </span>
                <PuceStatut statut={fiche.statut} />
              </div>
              <h1 className="mt-3 font-display text-[2.3rem] leading-[0.98] font-semibold tracking-[-0.045em] sm:text-[3rem]">
                {fiche.societe ?? "Société non renseignée"}
              </h1>
              <p className="mt-2 text-[0.8rem] text-ink-faint">
                Dernière modification · {formaterDateHeure(fiche.updated_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/impression/${fiche.id}`}
                target="_blank"
                className="group flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-[0.88rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
              >
                <span>Imprimer</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z" />
                  </svg>
                </span>
              </Link>

              {session.role === "admin" && (
                <form action={supprimerFiche}>
                  <input type="hidden" name="id" value={fiche.id} />
                  <button
                    type="submit"
                    className="rounded-full px-4 py-3 text-[0.82rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille active:scale-[0.97]"
                  >
                    Supprimer
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>
      </Reveler>

      {enregistre && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Fiche enregistrée.
        </p>
      )}

      <Reveler delai={90}>
        <FicheFormulaire fiche={fiche} technicienParDefaut={session.technicien} />
      </Reveler>
    </div>
  );
}
