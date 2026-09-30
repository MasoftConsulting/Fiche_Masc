import "server-only";
import { createAdminClient } from "./supabase";

const TABLE = "contacts";

export type Contact = {
  id: string;
  client_id: string;
  nom: string;
  poste: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
};

export type ChampsContact = Pick<
  Contact,
  "client_id" | "nom" | "poste" | "email" | "telephone"
>;

/* ---------------------------------------------------------------- lecture */

/** Tous les contacts, éventuellement filtrés sur un client. */
export async function listerContacts(clientId?: string): Promise<Contact[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let requete = supabase.from(TABLE).select("*").order("nom");
  if (clientId) requete = requete.eq("client_id", clientId);

  const { data, error } = await requete;
  if (error) {
    console.error("[contacts] listerContacts", error.message);
    return [];
  }
  return (data ?? []) as Contact[];
}

export async function lireContact(id: string): Promise<Contact | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[contacts] lireContact", error.message);
    return null;
  }
  return (data as Contact) ?? null;
}

/* --------------------------------------------------------------- écriture */

export async function creerContact(
  champs: ChampsContact,
): Promise<{ contact: Contact } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(champs)
    .select("*")
    .single();

  if (error) return { erreur: error.message };
  return { contact: data as Contact };
}

export async function modifierContact(
  id: string,
  champs: Partial<Omit<ChampsContact, "client_id">>,
): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).update(champs).eq("id", id);
  return error ? { erreur: error.message } : {};
}

export async function supprimerContact(id: string): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}