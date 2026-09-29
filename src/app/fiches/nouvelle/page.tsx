import Link from "next/link";
import { redirect } from "next/navigation";
import { FicheFormulaire } from "@/components/fiche-formulaire";
import { Reveler } from "@/components/reveler";
import { prochainNumero, historiqueParClient } from "@/lib/fiches";
import { listerClients } from "@/lib/clients";
import { listerEquipements } from "@/lib/equipements";
import { listerContacts } from "@/lib/contacts";
import { listerTechniciens } from "@/lib/techniciens";
import { lireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PageNouvelleFiche() {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  // Seul l'administrateur peut créer une fiche. Un technicien y accède par
  // affectation depuis son registre.
  if (session.role !== "admin") redirect("/fiches");

  const [numero, clients, equipements, contacts, techniciens] = await Promise.all([
    prochainNumero(),
    listerClients(),
    listerEquipements(),
    listerContacts(),
    listerTechniciens(),
  ]);

  const historique = await historiqueParClient(
    clients.map((c) => c.id),
    5,
  );

  // Seuls les comptes en base peuvent être affectés.
  const affectables = techniciens.filter((t) => t.actif);

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

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[2.4rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.2rem]">
              Nouvelle
              <br />
              <span className="text-ink-faint">intervention</span>
            </h1>
            <span className="rounded-full bg-navy px-4 py-2 font-mono text-[0.78rem] tracking-[0.06em] text-white">
              {numero}
            </span>
          </div>
        </header>
      </Reveler>

      <Reveler delai={90}>
        <FicheFormulaire
          numeroPropose={numero}
          technicienParDefaut={session.technicien}
          clients={clients}
          equipements={equipements}
          contacts={contacts}
          historique={historique}
          techniciens={affectables}
          sessionUtilisateur={{
            id: session.id,
            role: session.role,
            technicien: session.technicien,
          }}
        />
      </Reveler>
    </div>
  );
}