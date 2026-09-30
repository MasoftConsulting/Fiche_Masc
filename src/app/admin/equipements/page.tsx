import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireSessionAdmin } from "@/lib/session";
import { listerClients } from "@/lib/clients";
import { listerEquipements } from "@/lib/equipements";
import { GestionEquipements } from "../clients/[id]/gestion-equipements";
import { EnTeteReferentiel, FiltreClient } from "../referentiel";

export const dynamic = "force-dynamic";

/**
 * Tous les equipements de la plateforme, tous clients confondus, avec un
 * formulaire d'ajout où l'on choisit le client. Même composant que sur la
 * page d'un client : ajout, modification et suppression y sont identiques.
 */
export default async function PageEquipements({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; equipement_supprime?: string }>;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const { client, equipement_supprime } = await searchParams;

  const [clients, tous] = await Promise.all([listerClients(), listerEquipements(client)]);
  const choix = clients.map((c) => ({ id: c.id, nom: c.nom }));
  const clientFiltre = client && choix.some((c) => c.id === client) ? client : undefined;

  // Regroupés par client, dans l'ordre alphabétique des clients.
  const rang = new Map(choix.map((c, i) => [c.id, i]));
  const equipements = [...tous].sort(
    (a, b) => (rang.get(a.client_id) ?? 0) - (rang.get(b.client_id) ?? 0),
  );

  const retour = clientFiltre ? `/admin/equipements?client=${clientFiltre}` : "/admin/equipements";

  return (
    <div className="space-y-10">
      <Reveler>
        <EnTeteReferentiel
          titre="Équipements"
          sousTitre="de tous les clients"
          total={equipements.length}
          libelle="équipements"
        />
      </Reveler>

      {equipement_supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Équipement supprimé.
        </p>
      )}

      {choix.length === 0 ? (
        <p className="rounded-2xl bg-ink/[0.04] px-5 py-3.5 text-[0.85rem] text-ink-soft">
          Créez d&apos;abord un client : chaque équipement est rattaché à un client.
        </p>
      ) : (
        <Reveler delai={80}>
          <div className="space-y-6">
            <FiltreClient clients={choix} valeur={clientFiltre} />
            <GestionEquipements
              clientId={clientFiltre}
              clients={choix}
              equipements={equipements}
              retour={retour}
            />
          </div>
        </Reveler>
      )}
    </div>
  );
}
