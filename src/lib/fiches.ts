import "server-only";
import { createAdminClient } from "./supabase";
import type { Fiche } from "./types";

const TABLE = "fiches_intervention";

/** Valeur du filtre visant les fiches sans auteur rattaché. */
export const SANS_TECHNICIEN = "sans";

export type Filtres = {
  recherche?: string;
  statut?: string;
  /**
   * Filtre choisi dans l'interface (réservé à l'administrateur) : l'identifiant
   * d'un technicien, ou SANS_TECHNICIEN pour les fiches non rattachées.
   */
  technicienId?: string;
  /**
   * Cloisonnement : un technicien ne voit que ses propres fiches. Appliqué
   * après le filtre d'interface, il ne peut donc pas être contourné en
   * bricolant l'URL.
   */
  limiteA?: string | null;
};

/** Liste des fiches, la plus récente en tête. */
export async function listerFiches(filtres: Filtres = {}): Promise<Fiche[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let requete = supabase.from(TABLE).select("*").order("created_at", { ascending: false });

  if (filtres.statut === "brouillon" || filtres.statut === "signee") {
    requete = requete.eq("statut", filtres.statut);
  }
  if (filtres.technicienId === SANS_TECHNICIEN) {
    // Fiches saisies avec le code d'amorçage administrateur, ou dont le
    // technicien a été supprimé depuis (`on delete set null`).
    requete = requete.is("technicien_id", null);
  } else if (filtres.technicienId) {
    requete = requete.eq("technicien_id", filtres.technicienId);
  }
  if (filtres.limiteA) {
    requete = requete.eq("technicien_id", filtres.limiteA);
  }
  if (filtres.recherche) {
    // Échappe les virgules et parenthèses, qui sont des séparateurs dans la
    // syntaxe `or()` de PostgREST et casseraient la requête.
    const terme = filtres.recherche.replace(/[,()]/g, " ").trim();
    if (terme) {
      requete = requete.or(
        ["numero", "societe", "contact", "technicien", "marque_modele", "numero_serie"]
          .map((c) => `${c}.ilike.%${terme}%`)
          .join(","),
      );
    }
  }

  const { data, error } = await requete.limit(500);
  if (error) {
    console.error("[fiches] listerFiches", error.message);
    return [];
  }
  return (data ?? []) as Fiche[];
}

export async function lireFiche(id: string): Promise<Fiche | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[fiches] lireFiche", error.message);
    return null;
  }
  return (data as Fiche) ?? null;
}

/**
 * Numéro suivant au format FI-AAAA-NNN.
 *
 * Calculé par la fonction SQL `prochain_numero_fiche` : la lecture du maximum
 * et l'insertion restent proches dans le temps, et la contrainte d'unicité sur
 * `numero` rattrape le cas limite de deux créations simultanées.
 */
export async function prochainNumero(): Promise<string> {
  const annee = new Date().getFullYear();
  const supabase = createAdminClient();
  if (!supabase) return `FI-${annee}-001`;

  const { data, error } = await supabase.rpc("prochain_numero_fiche", { annee });
  if (error || typeof data !== "string") {
    if (error) console.error("[fiches] prochainNumero", error.message);
    return `FI-${annee}-001`;
  }
  return data;
}

/** Synthèse du registre, cloisonnée au technicien si `limiteA` est fourni. */
export async function compterParStatut(limiteA?: string | null) {
  const supabase = createAdminClient();
  if (!supabase) return { total: 0, brouillon: 0, signee: 0, mois: 0 };

  let requete = supabase.from(TABLE).select("statut, created_at").limit(5000);
  if (limiteA) requete = requete.eq("technicien_id", limiteA);

  const { data } = await requete;
  const lignes = (data ?? []) as { statut: string; created_at: string }[];

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return {
    total: lignes.length,
    brouillon: lignes.filter((l) => l.statut === "brouillon").length,
    signee: lignes.filter((l) => l.statut === "signee").length,
    mois: lignes.filter((l) => new Date(l.created_at) >= debutMois).length,
  };
}
