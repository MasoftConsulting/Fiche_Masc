import { redirect } from "next/navigation";
import { Navigation } from "./navigation";
import { lireSession } from "@/lib/session";
import { deconnexion } from "@/app/actions";

/**
 * Enveloppe commune aux écrans connectés : barre flottante + colonne centrale.
 *
 * Le proxy valide déjà la signature du cookie ; cette lecture sert à connaître
 * le technicien et son rôle, et protège aussi si le matcher du proxy évolue.
 */
export async function Coquille({ children }: { children: React.ReactNode }) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  return (
    <div className="min-h-[100dvh]">
      <Navigation
        technicien={session.technicien}
        role={session.role}
        deconnexion={deconnexion}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8">{children}</main>
    </div>
  );
}
