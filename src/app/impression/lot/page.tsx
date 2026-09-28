import { notFound, redirect } from "next/navigation";
import { FichePapier } from "@/components/fiche-papier";
import { lireFiches } from "@/lib/fiches";
import { lireSession } from "@/lib/session";
import { BarreOutilsLot } from "./barre-outils-lot";

export const dynamic = "force-dynamic";

/** Nombre maximum de fiches imprimables en un seul lot. */
const LOT_MAX = 100;

export default async function PageImpressionLot({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const { ids: idsBruts } = await searchParams;

  // Découpage + filtrage. Les ids vides, dupliqués ou malformés sont écartés
  // silencieusement : c'est une vue d'impression, pas un formulaire — mieux
  // vaut imprimer ce qu'on peut que renvoyer une erreur sur une URL bricolée.
  const ids = Array.from(
    new Set(
      (idsBruts ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ).slice(0, LOT_MAX);

  if (ids.length === 0) notFound();

  const fiches = await lireFiches(ids);

  // Cloisonnement : un technicien ne peut imprimer que ses propres fiches.
  // On filtre au lieu de refuser en bloc — s'il a coché par erreur une fiche
  // d'un collègue, on lui imprime quand même les siennes.
  const autorisees =
    session.role === "admin"
      ? fiches
      : fiches.filter((f) => f.technicien_id === session.id);

  if (autorisees.length === 0) notFound();

  // On réordonne selon l'ordre demandé par l'utilisateur (celui de la
  // sélection dans la liste), pas celui retourné par Postgres.
  const parId = new Map(autorisees.map((f) => [f.id, f]));
  const ordonnees = ids.map((id) => parId.get(id)).filter((f) => f !== undefined);

  return (
    <div className="plan-travail">
      <BarreOutilsLot nombre={ordonnees.length} retour="/fiches" />

      {ordonnees.map((fiche, index) => (
        <div
          key={fiche.id}
          className="cadre-echelle"
          style={
            index < ordonnees.length - 1
              ? { breakAfter: "page", pageBreakAfter: "always" }
              : undefined
          }
        >
          <FichePapier fiche={fiche} />
        </div>
      ))}
    </div>
  );
}