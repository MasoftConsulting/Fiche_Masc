import type { NextRequest } from "next/server";
import { lireSession } from "@/lib/session";
import { estPeriode, listerFiches } from "@/lib/fiches";
import { avecBOM, versCSV, type Colonne } from "@/lib/csv";
import { formaterDate, dureeIntervention } from "@/lib/format";
import { labelType } from "@/lib/types";
import { supabaseConfigure } from "@/lib/supabase";

/**
 * Export CSV des fiches filtrées.
 *
 * Route Handler plutôt que Server Action : on renvoie un fichier téléchargeable
 * (Content-Disposition: attachment), pas une donnée structurée.
 *
 * Le cloisonnement est réappliqué ici : une Route Handler est une route HTTP
 * publique, elle n'hérite pas des protections de la page /fiches.
 */

export async function GET(req: NextRequest) {
  if (!supabaseConfigure) {
    return new Response("Supabase n'est pas configuré.", { status: 503 });
  }

  const session = await lireSession();
  if (!session) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const periodeBrute = sp.get("periode");
  const periode = estPeriode(periodeBrute) ? periodeBrute : undefined;

  const admin = session.role === "admin";

  const { fiches } = await listerFiches({
    recherche: sp.get("q") ?? undefined,
    statut: sp.get("statut") ?? undefined,
    technicienId: admin ? sp.get("technicien") ?? undefined : undefined,
    limiteA: admin ? null : session.id,
    periode,
    // Volontairement très large : l'export n'est pas paginé, l'utilisateur
    // veut tout ce qui correspond au filtre courant.
    limite: 10_000,
  });

  const colonnes: Colonne[] = [
    { cle: "numero", titre: "N° fiche" },
    { cle: "date_intervention", titre: "Date" },
    { cle: "societe", titre: "Client" },
    { cle: "contact", titre: "Contact" },
    { cle: "technicien", titre: "Technicien" },
    { cle: "types", titre: "Types d'intervention" },
    { cle: "heure_arrivee", titre: "Arrivée" },
    { cle: "heure_depart", titre: "Départ" },
    { cle: "duree", titre: "Durée" },
    { cle: "resultat", titre: "Résultat" },
    { cle: "statut", titre: "Statut" },
    { cle: "facturable", titre: "Facturable" },
  ];

  const lignes = fiches.map((f) => ({
    numero: f.numero,
    date_intervention: formaterDate(f.date_intervention),
    societe: f.societe ?? "",
    contact: f.contact ?? "",
    technicien: f.technicien ?? "",
    types: f.types.map(labelType).join(" · "),
    heure_arrivee: f.heure_arrivee ?? "",
    heure_depart: f.heure_depart ?? "",
    duree: dureeIntervention(f.heure_arrivee, f.heure_depart) ?? "",
    resultat: f.resultat ?? "",
    statut: f.statut === "signee" ? "Signée" : "Brouillon",
    facturable: f.facturable ?? "",
  }));

  const csv = avecBOM(versCSV(lignes, colonnes));

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const nomFichier = `fiches-${aujourdhui}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
      "Cache-Control": "no-store",
    },
  });
}