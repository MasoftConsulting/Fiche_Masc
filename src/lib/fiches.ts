import "server-only";
import { createAdminClient } from "./supabase";
import type { Fiche } from "./types";

const TABLE = "fiches_intervention";

/** Nombre de fiches par page dans le registre. */
export const FICHES_PAR_PAGE = 25;

/** Valeur du filtre visant les fiches sans auteur rattaché. */
export const SANS_TECHNICIEN = "sans";

/** Périodes prédéfinies pour filtrer le registre. */
export type Periode = "7j" | "mois" | "annee";

export type Filtres = {
  recherche?: string;
  statut?: string;
  technicienId?: string;
  limiteA?: string | null;
  /** Filtre temporel : 7 derniers jours, mois courant, année courante. */
  periode?: Periode | null;
  page?: number;
  limite?: number;
};

export type ResultatListe = {
  fiches: Fiche[];
  total: number;
  pages: number;
  page: number;
};

/**
 * Convertit une période nommée en borne inférieure ISO (created_at >= borne).
 *
 * On se base sur `created_at` plutôt que `date_intervention` : c'est la date
 * de saisie, toujours renseignée, y compris pour les brouillons. Elle
 * correspond également à celle utilisée par la tuile « ce mois-ci » de la
 * page /fiches, ce qui évite qu'un filtre et son compteur ne concordent pas.
 */
export function bornePeriode(periode: Periode, maintenant = new Date()): string {
  if (periode === "7j") {
    const il7j = new Date(maintenant);
    il7j.setDate(il7j.getDate() - 7);
    il7j.setHours(0, 0, 0, 0);
    return il7j.toISOString();
  }
  if (periode === "annee") {
    return new Date(maintenant.getFullYear(), 0, 1).toISOString();
  }
  // "mois" : premier jour du mois courant à minuit
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString();
}

/** Vrai si la chaîne fournie est une période reconnue. */
export function estPeriode(valeur: unknown): valeur is Periode {
  return valeur === "7j" || valeur === "mois" || valeur === "annee";
}

/** Liste paginée des fiches, la plus récente en tête. */
export async function listerFiches(
  filtres: Filtres = {},
): Promise<ResultatListe> {
  const supabase = createAdminClient();

  const page = Math.max(1, filtres.page ?? 1);
  const limite = filtres.limite ?? FICHES_PAR_PAGE;

  if (!supabase) {
    return { fiches: [], total: 0, pages: 1, page };
  }

  const debut = (page - 1) * limite;
  const fin = debut + limite - 1;

  let requete = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(debut, fin);

  if (filtres.statut === "brouillon" || filtres.statut === "signee") {
    requete = requete.eq("statut", filtres.statut);
  }
  if (filtres.technicienId === SANS_TECHNICIEN) {
    requete = requete.is("technicien_id", null);
  } else if (filtres.technicienId) {
    requete = requete.eq("technicien_id", filtres.technicienId);
  }
  if (filtres.limiteA) {
    requete = requete.eq("technicien_id", filtres.limiteA);
  }
  if (filtres.periode) {
    requete = requete.gte("created_at", bornePeriode(filtres.periode));
  }
  if (filtres.recherche) {
    const terme = filtres.recherche.replace(/[,()]/g, " ").trim();
    if (terme) {
      requete = requete.or(
        [
          "numero",
          "societe",
          "contact",
          "technicien",
          "marque_modele",
          "numero_serie",
        ]
          .map((c) => `${c}.ilike.%${terme}%`)
          .join(","),
      );
    }
  }

  const { data, count, error } = await requete;
  if (error) {
    console.error("[fiches] listerFiches", error.message);
    return { fiches: [], total: 0, pages: 1, page };
  }

  const total = count ?? 0;
  return {
    fiches: (data ?? []) as Fiche[],
    total,
    pages: Math.max(1, Math.ceil(total / limite)),
    page,
  };
}

export async function lireFiche(id: string): Promise<Fiche | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[fiches] lireFiche", error.message);
    return null;
  }
  return (data as Fiche) ?? null;
}

/**
 * Charge plusieurs fiches en une seule requête.
 *
 * Utilisée par l'impression en lot : `Promise.all(ids.map(lireFiche))` ferait
 * N allers-retours alors qu'un `IN (...)` en fait un seul. Sur un lot de 50
 * fiches, la différence est perceptible.
 *
 * L'ordre n'est pas garanti par la base : on ne s'en sert pas côté impression
 * (chaque fiche est autonome) mais l'appelant peut trier après coup s'il en a
 * besoin.
 */
export async function lireFiches(ids: string[]): Promise<Fiche[]> {
  if (ids.length === 0) return [];

  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLE).select("*").in("id", ids);

  if (error) {
    console.error("[fiches] lireFiches", error.message);
    return [];
  }
  return (data ?? []) as Fiche[];
}

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

export async function compterParStatut(limiteA?: string | null) {
  const supabase = createAdminClient();
  const vide = { total: 0, brouillon: 0, signee: 0, mois: 0 };
  if (!supabase) return vide;

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  const isoDebutMois = debutMois.toISOString();

  const base = () => {
    let q = supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true });
    if (limiteA) q = q.eq("technicien_id", limiteA);
    return q;
  };

  const [total, brouillon, signee, mois] = await Promise.all([
    base(),
    base().eq("statut", "brouillon"),
    base().eq("statut", "signee"),
    base().gte("created_at", isoDebutMois),
  ]);

  return {
    total: total.count ?? 0,
    brouillon: brouillon.count ?? 0,
    signee: signee.count ?? 0,
    mois: mois.count ?? 0,
  };
}

/** Résumé d'une fiche pour les listes d'historique. */
export type FicheResume = {
  id: string;
  numero: string;
  date_intervention: string | null;
  resultat: string | null;
  statut: string;
  client_id: string;
  created_at: string;
};

/**
 * Historique des interventions, groupé par client.
 *
 * Une seule requête pour tous les clients demandés (généralement ceux
 * référencés par le formulaire de fiche), puis on garde les N plus récentes
 * par client en mémoire. À l'échelle d'une PME — quelques clients, quelques
 * centaines de fiches — c'est plus simple qu'une fenêtre SQL et le coût est
 * négligeable.
 *
 * L'ordre est décroissant par `created_at`, comme le registre principal.
 */
export async function historiqueParClient(
  clientIds: string[],
  limiteParClient = 5,
): Promise<Record<string, FicheResume[]>> {
  if (clientIds.length === 0) return {};

  const supabase = createAdminClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, numero, date_intervention, resultat, statut, client_id, created_at")
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fiches] historiqueParClient", error.message);
    return {};
  }

  const parClient: Record<string, FicheResume[]> = {};
  for (const ligne of (data ?? []) as FicheResume[]) {
    const liste = parClient[ligne.client_id] ?? (parClient[ligne.client_id] = []);
    if (liste.length < limiteParClient) liste.push(ligne);
  }
  return parClient;
}