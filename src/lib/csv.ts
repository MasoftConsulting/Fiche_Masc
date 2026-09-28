import "server-only";

/**
 * Génère un CSV compatible Excel (France).
 *
 * Trois choix qui ne sont pas arbitraires :
 *
 *  - Séparateur point-virgule. Excel FR interprète la virgule comme séparateur
 *    décimal (1,5) ; un CSV avec virgules serait ouvert en une seule colonne.
 *    Le point-virgule est la convention attendue.
 *
 *  - Retours de ligne CRLF. La RFC 4180 les prescrit, et Excel sur Windows
 *    saute des lignes si on utilise \n seul dans certains cas.
 *
 *  - BOM UTF-8 ajouté par l'appelant. Sans lui, Excel (au moins jusqu'à 365)
 *    lit le fichier en ANSI et corrompt tous les accents.
 */

const SEPARATEUR = ";";
const FIN_LIGNE = "\r\n";

export type Colonne = {
  /** Nom de la propriété dans les objets fournis. */
  cle: string;
  /** En-tête affiché dans la première ligne du CSV. */
  titre: string;
};

/**
 * Échappe une valeur selon la RFC 4180.
 *
 * Un champ est entouré de guillemets s'il contient le séparateur, un guillemet
 * ou un saut de ligne. Les guillemets internes sont doublés.
 */
function echapper(valeur: string): string {
  if (
    valeur.includes(SEPARATEUR) ||
    valeur.includes('"') ||
    valeur.includes("\n") ||
    valeur.includes("\r")
  ) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

export function versCSV(
  lignes: Record<string, unknown>[],
  colonnes: Colonne[],
): string {
  const entete = colonnes.map((c) => echapper(c.titre)).join(SEPARATEUR);

  const corps = lignes
    .map((ligne) =>
      colonnes
        .map((c) => echapper(String(ligne[c.cle] ?? "").replace(/\s+/g, " ").trim()))
        .join(SEPARATEUR),
    )
    .join(FIN_LIGNE);

  return corps ? `${entete}${FIN_LIGNE}${corps}` : entete;
}

/** Préfixe le contenu pour qu'Excel reconnaisse l'UTF-8. */
export function avecBOM(contenu: string): string {
  return "\uFEFF" + contenu;
}