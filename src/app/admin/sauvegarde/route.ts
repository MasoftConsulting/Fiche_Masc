import { createAdminClient } from "@/lib/supabase";
import { lireSessionAdmin } from "@/lib/session";
import { journaliser, ACTIONS } from "@/lib/journal";

/**
 * Sauvegarde complète de la base, téléchargée en un fichier JSON.
 *
 * Toutes les lignes de toutes les tables métier, sans transformation : le
 * fichier doit permettre de reconstruire la base (signatures comprises).
 * `codes_mfa` est exclue : des codes de connexion éphémères, sans valeur une
 * fois expirés.
 *
 * La réponse est envoyée au fil de l'eau, par paquets de lignes : Vercel
 * limite à 4,5 Mo la réponse d'une fonction, sauf en streaming. Avec les
 * signatures, une fiche pèse de l'ordre de 15 Ko : sans streaming, la limite
 * serait atteinte vers 300 fiches.
 *
 * Réservée à l'administrateur : le proxy filtre déjà /admin, mais une Route
 * Handler est une route HTTP à part entière, on revérifie.
 */

const TABLES = [
  "techniciens",
  "clients",
  "contacts",
  "equipements",
  "fiches_intervention",
  "journal",
] as const;

const PAQUET = 500;

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await lireSessionAdmin();
  if (!session) return new Response("Réservé à l'administrateur.", { status: 403 });

  const supabase = createAdminClient();
  if (!supabase) return new Response("Supabase n'est pas configuré.", { status: 503 });

  const maintenant = new Date();
  const jour = maintenant.toISOString().slice(0, 10);

  await journaliser(session, ACTIONS.BASE_EXPORT, { details: { tables: TABLES } });

  const encodeur = new TextEncoder();

  const flux = new ReadableStream<Uint8Array>({
    async start(controleur) {
      const ecrire = (texte: string) => controleur.enqueue(encodeur.encode(texte));
      const erreurs: Record<string, string> = {};
      const totaux: Record<string, number> = {};

      try {
        ecrire(
          `{"format":"masc-fiche-sauvegarde","version":1,` +
            `"exporte_le":${JSON.stringify(maintenant.toISOString())},` +
            `"exporte_par":${JSON.stringify(session.technicien)},"tables":{`,
        );

        for (const [i, table] of TABLES.entries()) {
          ecrire(`${i > 0 ? "," : ""}${JSON.stringify(table)}:[`);
          let total = 0;

          // Pagination par `id` : ordre stable d'un paquet à l'autre.
          for (let debut = 0; ; debut += PAQUET) {
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .order("id")
              .range(debut, debut + PAQUET - 1);

            if (error) {
              erreurs[table] = error.message;
              break;
            }

            const lignes = data ?? [];
            for (const ligne of lignes) {
              ecrire(`${total > 0 ? "," : ""}${JSON.stringify(ligne)}`);
              total += 1;
            }
            if (lignes.length < PAQUET) break;
          }

          ecrire("]");
          totaux[table] = total;
        }

        // Les totaux et les erreurs arrivent en fin de fichier : on ne les
        // connaît qu'une fois toutes les tables lues. Une table en erreur
        // apparaît vide (ou incomplète) dans `tables` et nommée ici.
        ecrire(`},"totaux":${JSON.stringify(totaux)},"erreurs":${JSON.stringify(erreurs)}}`);
        controleur.close();
      } catch (e) {
        console.error("[sauvegarde] exception", e);
        // Fichier volontairement laissé invalide : un JSON tronqué ne doit
        // pas passer pour une sauvegarde complète.
        controleur.error(e);
      }
    },
  });

  return new Response(flux, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="masc-fiche-sauvegarde-${jour}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
