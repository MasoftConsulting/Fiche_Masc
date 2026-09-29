import "server-only";
import { createAdminClient } from "./supabase";
import type { Session } from "./session";

const TABLE = "journal";

/**
 * Catalogue des actions tracées.
 *
 * Une constante centrale évite les fautes de frappe silencieuses (un
 * "fiche.creation" mal orthographié produirait une ligne fantôme impossible à
 * filtrer). Toute nouvelle action doit être ajoutée ici avant d'être utilisée.
 */
export const ACTIONS = {
  // Fiches
  FICHE_CREATION: "fiche.creation",
  FICHE_MODIFICATION: "fiche.modification",
  FICHE_SIGNATURE: "fiche.signature",
  FICHE_SUPPRESSION: "fiche.suppression",
  FICHE_REOUVERTURE: "fiche.reouverture",
  // Techniciens
  TECHNICIEN_CREATION: "technicien.creation",
  TECHNICIEN_MODIFICATION: "technicien.modification",
  TECHNICIEN_DESACTIVATION: "technicien.desactivation",
  TECHNICIEN_REACTIVATION: "technicien.reactivation",
  TECHNICIEN_SUPPRESSION: "technicien.suppression",
  TECHNICIEN_CODE_REGENE: "technicien.code_regene",
  // Clients
  CLIENT_CREATION: "client.creation",
  CLIENT_MODIFICATION: "client.modification",
  CLIENT_SUPPRESSION: "client.suppression",
  // Équipements
  EQUIPEMENT_CREATION: "equipement.creation",
  EQUIPEMENT_MODIFICATION: "equipement.modification",
  EQUIPEMENT_SUPPRESSION: "equipement.suppression",
  // Contacts
  CONTACT_CREATION: "contact.creation",
  CONTACT_MODIFICATION: "contact.modification",
  CONTACT_SUPPRESSION: "contact.suppression",
  // Sessions
  SESSION_CONNEXION: "session.connexion",
  SESSION_DECONNEXION: "session.deconnexion",
} as const;

export type ActionJournal = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * Libellé lisible d'une action.
 *
 * Utilisé côté page /admin/journal pour l'affichage. Centralisé ici pour
 * qu'un renommage ne casse pas silencieusement l'UI.
 */
export const LABELS_ACTION: Record<ActionJournal, string> = {
  [ACTIONS.FICHE_CREATION]: "Fiche créée",
  [ACTIONS.FICHE_MODIFICATION]: "Fiche modifiée",
  [ACTIONS.FICHE_SIGNATURE]: "Fiche signée",
  [ACTIONS.FICHE_SUPPRESSION]: "Fiche supprimée",
  [ACTIONS.FICHE_REOUVERTURE]: "Fiche rouverte",
  [ACTIONS.TECHNICIEN_CREATION]: "Technicien créé",
  [ACTIONS.TECHNICIEN_MODIFICATION]: "Technicien modifié",
  [ACTIONS.TECHNICIEN_DESACTIVATION]: "Technicien désactivé",
  [ACTIONS.TECHNICIEN_REACTIVATION]: "Technicien réactivé",
  [ACTIONS.TECHNICIEN_SUPPRESSION]: "Technicien supprimé",
  [ACTIONS.TECHNICIEN_CODE_REGENE]: "Code régénéré",
  [ACTIONS.CLIENT_CREATION]: "Client créé",
  [ACTIONS.CLIENT_MODIFICATION]: "Client modifié",
  [ACTIONS.CLIENT_SUPPRESSION]: "Client supprimé",
  [ACTIONS.EQUIPEMENT_CREATION]: "Équipement créé",
  [ACTIONS.EQUIPEMENT_MODIFICATION]: "Équipement modifié",
  [ACTIONS.EQUIPEMENT_SUPPRESSION]: "Équipement supprimé",
  [ACTIONS.CONTACT_CREATION]: "Contact créé",
  [ACTIONS.CONTACT_MODIFICATION]: "Contact modifié",
  [ACTIONS.CONTACT_SUPPRESSION]: "Contact supprimé",
  [ACTIONS.SESSION_CONNEXION]: "Connexion",
  [ACTIONS.SESSION_DECONNEXION]: "Déconnexion",
};

/** Ton visuel associé à chaque action, pour colorer la puce dans la liste. */
export function tonAction(
  action: string,
): "jade" | "rouille" | "amber" | "neutre" {
  if (action.endsWith(".suppression")) return "rouille";
  if (action.endsWith(".creation")) return "jade";
  if (
    action === ACTIONS.FICHE_SIGNATURE ||
    action === ACTIONS.TECHNICIEN_CODE_REGENE
  ) {
    return "jade";
  }
  if (
    action === ACTIONS.TECHNICIEN_DESACTIVATION ||
    action === ACTIONS.FICHE_MODIFICATION ||
    action === ACTIONS.FICHE_REOUVERTURE ||
    action.endsWith(".modification")
  ) {
    return "amber";
  }
  return "neutre";
}

export type EntreeJournal = {
  id: string;
  created_at: string;
  action: string;
  table_cible: string | null;
  ligne_id: string | null;
  acteur_id: string | null;
  acteur_nom: string | null;
  details: Record<string, unknown> | null;
};

export type OptionsJournal = {
  /** Nombre maximum d'entrées à retourner. Par défaut 100, plafonné à 500. */
  limite?: number;
  /** Nombre d'entrées à sauter (pagination simple). */
  decalage?: number;
  /** Ne garder qu'un type d'action. */
  action?: string;
  /** Ne garder qu'un acteur. */
  acteurId?: string;
};

/* ---------------------------------------------------------------- écriture */

/**
 * Ajoute une entrée au journal.
 *
 * Ne jette jamais : si l'écriture échoue, on log côté serveur et on rend la
 * main. Un journal secondaire ne doit pas faire tomber une action métier qui,
 * elle, a réussi.
 */
export async function journaliser(
  session: Session,
  action: ActionJournal,
  options: {
    tableCible?: string;
    ligneId?: string;
    acteurNom?: string;
    details?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    const { error } = await supabase.from(TABLE).insert({
      action,
      table_cible: options.tableCible ?? null,
      ligne_id: options.ligneId ?? null,
      acteur_id: session.id,
      acteur_nom: options.acteurNom ?? session.technicien,
      details: options.details ?? null,
    });

    if (error) {
      console.error("[journal] journaliser", error.message);
    }
  } catch (e) {
    console.error("[journal] journaliser — exception", e);
  }
}

/* ---------------------------------------------------------------- lecture */

export async function listerJournal(
  options: OptionsJournal = {},
): Promise<EntreeJournal[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const limite = Math.min(options.limite ?? 100, 500);
  const decalage = Math.max(options.decalage ?? 0, 0);

  let requete = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .range(decalage, decalage + limite - 1);

  if (options.action) requete = requete.eq("action", options.action);
  if (options.acteurId) requete = requete.eq("acteur_id", options.acteurId);

  const { data, error } = await requete;
  if (error) {
    console.error("[journal] listerJournal", error.message);
    return [];
  }
  return (data ?? []) as EntreeJournal[];
}

export async function compterParAction(
  jours = 30,
): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  if (!supabase) return {};

  const depuis = new Date();
  depuis.setDate(depuis.getDate() - jours);

  const { data, error } = await supabase
    .from(TABLE)
    .select("action")
    .gte("created_at", depuis.toISOString())
    .limit(10_000);

  if (error) {
    console.error("[journal] compterParAction", error.message);
    return {};
  }

  const compteur: Record<string, number> = {};
  for (const ligne of (data ?? []) as { action: string }[]) {
    compteur[ligne.action] = (compteur[ligne.action] ?? 0) + 1;
  }
  return compteur;
}