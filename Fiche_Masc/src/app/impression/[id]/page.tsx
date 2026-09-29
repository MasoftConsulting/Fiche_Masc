import { notFound, redirect } from "next/navigation";
import { FichePapier } from "@/components/fiche-papier";
import { lireFiche } from "@/lib/fiches";
import { lireSession } from "@/lib/session";
import { BarreOutils } from "../barre-outils";

export const dynamic = "force-dynamic";

export default async function PageImpression({ params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const { id } = await params;
  const fiche = await lireFiche(id);
  if (!fiche) notFound();

  // Même cloisonnement que la page d'édition : la vue imprimable ne doit pas
  // être une porte dérobée vers les fiches des autres techniciens.
  if (session.role !== "admin" && fiche.technicien_id !== session.id) notFound();

  return (
    <div className="plan-travail">
      <BarreOutils retour={`/fiches/${fiche.id}`} numero={fiche.numero} />
      <div className="cadre-echelle">
        <FichePapier fiche={fiche} />
      </div>
    </div>
  );
}
