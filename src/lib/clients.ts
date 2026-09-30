import "server-only";
import { createAdminClient } from "./supabase";

const TABLE = "clients";

export type Client = {
  id: string;
  nom: string;
  adresse: string | null;
  contact: string | null;
  telephone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientAvecStats = Client & {
  nb_equipements: number;
  nb_fiches: number;
  derniere_fiche: string | null;
};

export type ChampsClient = Pick<
  Client,
  "nom" | "adresse" | "contact" | "telephone" | "email"
>;

/* ---------------------------------------------------------------- lecture */

export async function listerClients(): Promise<Client[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLE).select("*").order("nom");
  if (error) {
    console.error("[clients] listerClients", error.message);
    return [];
  }
  return (data ?? []) as Client[];
}

/**
 * Liste des clients avec le décompte de leurs équipements et fiches.
 *
 * Trois requêtes en parallèle puis agrégation en mémoire. À l'échelle d'une
 * PME (quelques dizaines de clients), c'est plus simple à maintenir qu'une vue
 * SQL, et le coût est négligeable.
 */
export async function listerClientsAvecStats(): Promise<ClientAvecStats[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const [clients, equipements, fiches] = await Promise.all([
    listerClients(),
    supabase.from("equipements").select("client_id").limit(10_000),
    supabase
      .from("fiches_intervention")
      .select("client_id, date_intervention, created_at")
      .not("client_id", "is", null)
      .limit(10_000),
  ]);

  const equipsParClient = new Map<string, number>();
  for (const e of (equipements.data ?? []) as { client_id: string }[]) {
    equipsParClient.set(e.client_id, (equipsParClient.get(e.client_id) ?? 0) + 1);
  }

  const fichesParClient = new Map<string, { total: number; derniere: string | null }>();
  for (const f of (fiches.data ?? []) as {
    client_id: string;
    date_intervention: string | null;
    created_at: string;
  }[]) {
    const existant = fichesParClient.get(f.client_id) ?? { total: 0, derniere: null };
    const date = f.date_intervention ?? f.created_at.slice(0, 10);
    existant.total += 1;
    if (!existant.derniere || date > existant.derniere) {
      existant.derniere = date;
    }
    fichesParClient.set(f.client_id, existant);
  }

  return clients.map((c) => {
    const stats = fichesParClient.get(c.id);
    return {
      ...c,
      nb_equipements: equipsParClient.get(c.id) ?? 0,
      nb_fiches: stats?.total ?? 0,
      derniere_fiche: stats?.derniere ?? null,
    };
  });
}

export async function lireClient(id: string): Promise<Client | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[clients] lireClient", error.message);
    return null;
  }
  return (data as Client) ?? null;
}

/* --------------------------------------------------------------- écriture */

export async function creerClient(
  champs: ChampsClient,
): Promise<{ client: Client } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(champs)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { erreur: "Un client porte déjà ce nom." };
    }
    return { erreur: error.message };
  }
  return { client: data as Client };
}

export async function modifierClient(
  id: string,
  champs: Partial<ChampsClient>,
): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).update(champs).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { erreur: "Un autre client porte déjà ce nom." };
    }
    return { erreur: error.message };
  }
  return {};
}

export async function supprimerClient(id: string): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  // `on delete cascade` sur equipements et contacts : ils partent avec.
  // `on delete set null` sur fiches_intervention : les fiches restent, leur
  // client_id devient null, et leur colonne texte `societe` continue
  // d'afficher le nom tel qu'il a été signé.
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}