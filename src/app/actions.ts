"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { lireFiche, prochainNumero } from "@/lib/fiches";
import type { Fiche } from "@/lib/types";
import { authentifierParCode } from "@/lib/techniciens";
import {
  estCodeAdmin,
  fermerSession,
  lireSession,
  ouvrirSession,
  sessionConfiguree,
} from "@/lib/session";
import { journaliser, ACTIONS } from "@/lib/journal";
import { TESTS_EFFECTUES, TYPES_INTERVENTION, type Resultat } from "@/lib/types";

const TABLE = "fiches_intervention";

export type EtatFormulaire = { erreur?: string; message?: string };

/* ------------------------------------------------------------------ accès */

export async function connexion(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (!sessionConfiguree()) {
    return {
      erreur: "Accès non configuré : renseignez CODE_ADMIN et SESSION_SECRET dans .env.local.",
    };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { erreur: "Saisissez votre code d'accès." };

  if (estCodeAdmin(code)) {
    const session = {
      id: null,
      technicien: "Administrateur",
      role: "admin" as const,
    };
    await ouvrirSession(session);
    await journaliser(session, ACTIONS.SESSION_CONNEXION, {
      details: { role: "admin", origine: "code_amorcage" },
    });
  } else {
    const technicien = await authentifierParCode(code);
    if (!technicien) return { erreur: "Code d'accès inconnu, désactivé ou expiré." };

    const session = {
      id: technicien.id,
      technicien: technicien.nom,
      role: technicien.role,
    };
    await ouvrirSession(session);
    await journaliser(session, ACTIONS.SESSION_CONNEXION, {
      details: { role: technicien.role },
    });
  }

  const suite = String(formData.get("suite") ?? "/fiches");
  redirect(suite.startsWith("/") && !suite.startsWith("//") ? suite : "/fiches");
}

export async function deconnexion() {
  const session = await lireSession();
  if (session) {
    await journaliser(session, ACTIONS.SESSION_DECONNEXION);
  }
  await fermerSession();
  redirect("/connexion");
}

/* ----------------------------------------------------------------- fiches */

function texte(formData: FormData, cle: string): string | null {
  const valeur = String(formData.get(cle) ?? "").trim();
  return valeur.length > 0 ? valeur : null;
}

function coches(formData: FormData, prefixe: string, cles: readonly string[]): string[] {
  return cles.filter((cle) => formData.get(`${prefixe}_${cle}`) === "on");
}

function signature(formData: FormData, cle: string): string | null {
  const valeur = String(formData.get(cle) ?? "");
  if (!valeur.startsWith("data:image/png;base64,")) return null;
  if (valeur.length > 2_000_000) return null;
  return valeur;
}

function champsModifies(
  avant: Fiche,
  valeurs: Record<string, unknown>,
): string[] {
  const suivis: (keyof Fiche)[] = [
    "societe",
    "adresse",
    "contact",
    "telephone",
    "email",
    "date_intervention",
    "heure_arrivee",
    "heure_depart",
    "facturable",
    "marque_modele",
    "numero_serie",
    "adresse_ip",
    "localisation",
    "compteur_nb",
    "compteur_couleur",
    "detail",
    "resultat",
    "commentaires",
    "recommandations",
    "client_nom",
    "client_fonction",
    "client_id",
    "equipement_id",
  ];

  const modifies: string[] = [];
  for (const cle of suivis) {
    const a = (avant[cle] ?? null) as unknown;
    const b = (valeurs[cle as string] ?? null) as unknown;
    if (a !== b) modifies.push(cle as string);
  }

  if (JSON.stringify(avant.types ?? []) !== JSON.stringify(valeurs.types ?? [])) {
    modifies.push("types");
  }
  if (JSON.stringify(avant.tests ?? []) !== JSON.stringify(valeurs.tests ?? [])) {
    modifies.push("tests");
  }

  return modifies;
}

export async function enregistrerFiche(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const session = await lireSession();
  if (!session) return { erreur: "Session expirée. Reconnectez-vous." };

  const supabase = createAdminClient();
  if (!supabase) {
    return { erreur: "Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }

  const id = texte(formData, "id");
  const societe = texte(formData, "societe");
  if (!societe) return { erreur: "La société est obligatoire." };

  const ficheExistante = id ? await lireFiche(id) : null;

  if (id && !ficheExistante) return { erreur: "Fiche introuvable." };

  if (
    id &&
    ficheExistante &&
    session.role !== "admin" &&
    ficheExistante.technicien_id !== session.id
  ) {
    return { erreur: "Cette fiche appartient à un autre technicien." };
  }

  const resultat = texte(formData, "resultat") as Resultat | null;
  const signatureClient = signature(formData, "signature_client");
  const signatureTechnicien = signature(formData, "signature_technicien");

  const statut = signatureClient ? "signee" : "brouillon";

  const valeurs = {
    // Références vers les référentiels. Nullables : le technicien peut
    // saisir une intervention ponctuelle sans sélectionner de client ou
    // d'équipement.
    client_id: texte(formData, "client_id"),
    equipement_id: texte(formData, "equipement_id"),

    date_intervention: texte(formData, "date_intervention"),
    heure_arrivee: texte(formData, "heure_arrivee"),
    heure_depart: texte(formData, "heure_depart"),
    facturable: texte(formData, "facturable"),

    societe,
    adresse: texte(formData, "adresse"),
    contact: texte(formData, "contact"),
    telephone: texte(formData, "telephone"),
    email: texte(formData, "email"),
    technicien: texte(formData, "technicien") ?? session.technicien,

    types: coches(formData, "type", TYPES_INTERVENTION.map((t) => t.cle)),
    type_autre: texte(formData, "type_autre"),

    marque_modele: texte(formData, "marque_modele"),
    numero_serie: texte(formData, "numero_serie"),
    adresse_ip: texte(formData, "adresse_ip"),
    localisation: texte(formData, "localisation"),

    compteur_nb: texte(formData, "compteur_nb"),
    compteur_nb_valide: formData.get("compteur_nb_valide") === "on",
    compteur_couleur: texte(formData, "compteur_couleur"),
    compteur_couleur_valide: formData.get("compteur_couleur_valide") === "on",

    detail: texte(formData, "detail"),

    resultat,
    commentaires: texte(formData, "commentaires"),

    tests: coches(formData, "test", TESTS_EFFECTUES.map((t) => t.cle)),
    tests_autres: texte(formData, "tests_autres"),

    recommandations: texte(formData, "recommandations"),

    client_nom: texte(formData, "client_nom"),
    client_fonction: texte(formData, "client_fonction"),
    signature_client: signatureClient,
    signature_technicien: signatureTechnicien,

    statut,
  };

  let identifiant = id;

  if (id) {
    const { error } = await supabase.from(TABLE).update(valeurs).eq("id", id);
    if (error) return { erreur: `Enregistrement impossible : ${error.message}` };
  } else {
    const numero = texte(formData, "numero") ?? (await prochainNumero());
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...valeurs, numero, technicien_id: session.id })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { erreur: "Ce numéro de fiche existe déjà. Rechargez la page pour obtenir le suivant." };
      }
      return { erreur: `Création impossible : ${error.message}` };
    }
    identifiant = (data as { id: string }).id;

    await journaliser(session, ACTIONS.FICHE_CREATION, {
      tableCible: TABLE,
      ligneId: identifiant ?? undefined,
      details: { numero, societe: valeurs.societe },
    });

    if (statut === "signee") {
      await journaliser(session, ACTIONS.FICHE_SIGNATURE, {
        tableCible: TABLE,
        ligneId: identifiant ?? undefined,
        details: { numero, client_nom: valeurs.client_nom },
      });
    }
  }

  if (id && ficheExistante) {
    const vientEtreSignee =
      ficheExistante.statut !== "signee" && statut === "signee";

    if (vientEtreSignee) {
      await journaliser(session, ACTIONS.FICHE_SIGNATURE, {
        tableCible: TABLE,
        ligneId: id,
        details: { numero: ficheExistante.numero, client_nom: valeurs.client_nom },
      });
    }

    const modifies = champsModifies(ficheExistante, valeurs);
    if (modifies.length > 0) {
      await journaliser(session, ACTIONS.FICHE_MODIFICATION, {
        tableCible: TABLE,
        ligneId: id,
        details: { numero: ficheExistante.numero, champs: modifies },
      });
    }
  }

  revalidatePath("/fiches");
  revalidatePath("/admin");
  if (identifiant) revalidatePath(`/fiches/${identifiant}`);
  redirect(`/fiches/${identifiant}?enregistre=1`);
}

export async function supprimerFiche(formData: FormData) {
  const session = await lireSession();
  if (!session || session.role !== "admin") redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/fiches");

  const avant = await lireFiche(id);

  const supabase = createAdminClient();
  if (supabase) await supabase.from(TABLE).delete().eq("id", id);

  if (avant) {
    await journaliser(session, ACTIONS.FICHE_SUPPRESSION, {
      tableCible: TABLE,
      ligneId: id,
      details: { numero: avant.numero, societe: avant.societe },
    });
  }

  revalidatePath("/fiches");
  revalidatePath("/admin");
  redirect("/fiches?supprime=1");
}