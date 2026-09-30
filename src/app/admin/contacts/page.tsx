import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireSessionAdmin } from "@/lib/session";
import { listerClients } from "@/lib/clients";
import { listerContacts } from "@/lib/contacts";
import { GestionContacts } from "../clients/[id]/gestion-contacts";
import { EnTeteReferentiel, FiltreClient } from "../referentiel";

export const dynamic = "force-dynamic";

/**
 * Tous les contacts de la plateforme, tous clients confondus, avec un
 * formulaire d'ajout où l'on choisit le client. Même composant que sur la
 * page d'un client : ajout, modification et suppression y sont identiques.
 */
export default async function PageContacts({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; contact_supprime?: string }>;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const { client, contact_supprime } = await searchParams;

  const [clients, tous] = await Promise.all([listerClients(), listerContacts(client)]);
  const choix = clients.map((c) => ({ id: c.id, nom: c.nom }));
  const clientFiltre = client && choix.some((c) => c.id === client) ? client : undefined;

  // Regroupés par client, dans l'ordre alphabétique des clients.
  const rang = new Map(choix.map((c, i) => [c.id, i]));
  const contacts = [...tous].sort(
    (a, b) => (rang.get(a.client_id) ?? 0) - (rang.get(b.client_id) ?? 0),
  );

  const retour = clientFiltre ? `/admin/contacts?client=${clientFiltre}` : "/admin/contacts";

  return (
    <div className="space-y-10">
      <Reveler>
        <EnTeteReferentiel
          titre="Contacts"
          sousTitre="de tous les clients"
          total={contacts.length}
          libelle="contacts"
        />
      </Reveler>

      {contact_supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Contact supprimé. Les fiches déjà remplies conservent le nom qu&apos;elles portaient.
        </p>
      )}

      {choix.length === 0 ? (
        <p className="rounded-2xl bg-ink/[0.04] px-5 py-3.5 text-[0.85rem] text-ink-soft">
          Créez d&apos;abord un client : chaque contact est rattaché à un client.
        </p>
      ) : (
        <Reveler delai={80}>
          <div className="space-y-6">
            <FiltreClient clients={choix} valeur={clientFiltre} />
            <GestionContacts
              clientId={clientFiltre}
              clients={choix}
              contacts={contacts}
              retour={retour}
            />
          </div>
        </Reveler>
      )}
    </div>
  );
}
