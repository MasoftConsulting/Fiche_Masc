import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "./supabase";
import { hacherCode } from "./session";

const TABLE = "techniciens";

export type Technicien = {
  id: string;
  nom: string;
  /** Destinataire du code de connexion (double authentification). */
  email: string | null;
  role: "technicien" | "admin";
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type TechnicienAvecStats = Technicien & {
  total: number;
  signees: number;
  brouillons: number;
  mois: number;
  derniere: string | null;
};

/**
 * Code lisible à dicter au téléphone : alphabet sans les caractères que l'on
 * confond à l'oral ou à l'écrit (0/O, 1/I/L, 2/Z, 5/S, 8/B).
 */
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";

export function genererCode() {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `MSC-${bloc()}-${bloc()}`;
}

/* ------------------------------------------------------------- connexion */

/** Adresse normalisée, ou null si vide. `false` si le format est invalide. */
export function normaliserEmail(valeur: string): string | null | false {
  const email = valeur.trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : false;
}

/** Retrouve le technicien porteur de ce code, s'il est encore actif. */
export async function authentifierParCode(code: string): Promise<Technicien | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("code_hash", hacherCode(code))
    .eq("actif", true)
    .maybeSingle();

  if (error) {
    console.error("[techniciens] authentifierParCode", error.message);
    return null;
  }
  return (data as Technicien) ?? null;
}

/* ---------------------------------------------------------------- lecture */

export async function listerTechniciens(): Promise<Technicien[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLE).select("*").order("nom");
  if (error) {
    console.error("[techniciens] listerTechniciens", error.message);
    return [];
  }
  return (data ?? []) as Technicien[];
}

/**
 * Les techniciens avec le décompte de leurs fiches.
 *
 * Deux requêtes puis agrégation en mémoire, plutôt qu'un décompte par
 * technicien : l'effectif d'une équipe terrain se compte en dizaines, et cela
 * évite d'ajouter une vue SQL à maintenir.
 */
export async function listerTechniciensAvecStats(): Promise<TechnicienAvecStats[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const [techniciens, fiches] = await Promise.all([
    listerTechniciens(),
    supabase
      .from("fiches_intervention")
      .select("technicien_id, statut, created_at, date_intervention")
      .limit(5000),
  ]);

  const lignes = (fiches.data ?? []) as {
    technicien_id: string | null;
    statut: string;
    created_at: string;
    date_intervention: string | null;
  }[];

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  return techniciens.map((technicien) => {
    const siennes = lignes.filter((l) => l.technicien_id === technicien.id);
    const dates = siennes
      .map((l) => l.date_intervention ?? l.created_at.slice(0, 10))
      .sort();

    return {
      ...technicien,
      total: siennes.length,
      signees: siennes.filter((l) => l.statut === "signee").length,
      brouillons: siennes.filter((l) => l.statut === "brouillon").length,
      mois: siennes.filter((l) => new Date(l.created_at) >= debutMois).length,
      derniere: dates.length > 0 ? dates[dates.length - 1] : null,
    };
  });
}

/** Un technicien par son identifiant, ou null s'il n'existe pas. */
export async function lireTechnicien(id: string): Promise<Technicien | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[techniciens] lireTechnicien", error.message);
    return null;
  }
  return (data as Technicien) ?? null;
}

/**
 * Un technicien avec ses statistiques d'activité.
 *
 * Réutilise l'agrégat global plutôt que d'écrire une requête dédiée : à
 * l'échelle d'une équipe (quelques dizaines de personnes), le surcoût de
 * calculer les stats de tout le monde puis de filtrer est négligeable, et
 * cela évite de dupliquer la logique de comptage à deux endroits.
 */
export async function lireTechnicienAvecStats(
  id: string,
): Promise<TechnicienAvecStats | null> {
  const tous = await listerTechniciensAvecStats();
  return tous.find((t) => t.id === id) ?? null;
}

/* --------------------------------------------------------------- écriture */

export type ResultatCode = { technicien: Technicien; code: string };

/**
 * Crée un technicien et son code.
 *
 * Le code en clair n'est retourné qu'ici : il n'est stocké nulle part, donc
 * l'administrateur doit le transmettre tout de suite. En cas de collision
 * d'empreinte (contrainte d'unicité), on retente avec un autre tirage.
 */
export async function creerTechnicien(
  nom: string,
  role: Technicien["role"] = "technicien",
  codeImpose?: string,
  email: string | null = null,
): Promise<ResultatCode | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  for (let essai = 0; essai < 5; essai += 1) {
    const code = codeImpose?.trim() || genererCode();

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ nom, email, role, code_hash: hacherCode(code) })
      .select("*")
      .single();

    if (!error) return { technicien: data as Technicien, code };

    if (error.code === "23505") {
      // Empreinte déjà prise. Un code imposé par l'administrateur est un
      // doublon réel : inutile de retenter.
      if (codeImpose) return { erreur: "Ce code est déjà attribué à un autre technicien." };
      continue;
    }
    return { erreur: error.message };
  }

  return { erreur: "Impossible de générer un code disponible. Réessayez." };
}

export async function regenererCode(id: string): Promise<ResultatCode | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  for (let essai = 0; essai < 5; essai += 1) {
    const code = genererCode();

    const { data, error } = await supabase
      .from(TABLE)
      .update({ code_hash: hacherCode(code) })
      .eq("id", id)
      .select("*")
      .single();

    if (!error) return { technicien: data as Technicien, code };
    if (error.code === "23505") continue;
    return { erreur: error.message };
  }

  return { erreur: "Impossible de générer un code disponible. Réessayez." };
}

export async function modifierTechnicien(
  id: string,
  valeurs: Partial<Pick<Technicien, "nom" | "email" | "role" | "actif">>,
) {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).update(valeurs).eq("id", id);
  return error ? { erreur: error.message } : {};
}

/**
 * Vrai si ce technicien est le dernier administrateur actif de la plateforme.
 *
 * Empêche les manipulations qui laisseraient l'application sans aucun admin :
 * rétrograder ou désactiver le dernier — plus personne ne pourrait créer de
 * technicien, régénérer un code, ou administrer l'équipe.
 *
 * Comportement fail-safe : en cas d'erreur SQL, on considère qu'il s'agit du
 * dernier admin et on refuse la modification. Mieux vaut un blocage qu'une
 * plateforme verrouillée.
 */
export async function estDernierAdminActif(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return true;

  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("actif", true)
    .neq("id", id);

  if (error) {
    console.error("[techniciens] estDernierAdminActif", error.message);
    return true;
  }
  return (count ?? 0) === 0;
}

export async function supprimerTechnicien(id: string) {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  // `on delete set null` côté base : les fiches déjà signées sont conservées,
  // avec le nom du technicien figé dans la colonne texte.
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}