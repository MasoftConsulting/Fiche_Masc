import "server-only";
import { createAdminClient } from "./supabase";

const TABLE = "equipements";

export type Equipement = {
  id: string;
  client_id: string;
  marque_modele: string | null;
  numero_serie: string | null;
  adresse_ip: string | null;
  localisation: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipementAvecClient = Equipement & {
  client_nom: string;
};

export type ChampsEquipement = Pick<
  Equipement,
  "client_id" | "marque_modele" | "numero_serie" | "adresse_ip" | "localisation"
>;

/* ---------------------------------------------------------------- lecture */

export async function listerEquipements(
  clientId?: string,
): Promise<Equipement[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let requete = supabase.from(TABLE).select("*").order("marque_modele");
  if (clientId) requete = requete.eq("client_id", clientId);

  const { data, error } = await requete;
  if (error) {
    console.error("[equipements] listerEquipements", error.message);
    return [];
  }
  return (data ?? []) as Equipement[];
}

/**
 * Équipements avec le nom du client, pour les listes transverses
 * (page /admin/equipements).
 */
export async function listerEquipementsAvecClient(): Promise<EquipementAvecClient[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select("*, clients (nom)")
    .order("marque_modele");

  if (error) {
    console.error("[equipements] listerEquipementsAvecClient", error.message);
    return [];
  }

  type Ligne = Equipement & { clients: { nom: string } | null };
  return ((data ?? []) as Ligne[]).map(({ clients, ...equip }) => ({
    ...equip,
    client_nom: clients?.nom ?? "—",
  }));
}

export async function lireEquipement(id: string): Promise<Equipement | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[equipements] lireEquipement", error.message);
    return null;
  }
  return (data as Equipement) ?? null;
}

/* --------------------------------------------------------------- écriture */

export async function creerEquipement(
  champs: ChampsEquipement,
): Promise<{ equipement: Equipement } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(champs)
    .select("*")
    .single();

  if (error) return { erreur: error.message };
  return { equipement: data as Equipement };
}

export async function modifierEquipement(
  id: string,
  champs: Partial<ChampsEquipement>,
): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).update(champs).eq("id", id);
  return error ? { erreur: error.message } : {};
}

export async function supprimerEquipement(id: string): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}