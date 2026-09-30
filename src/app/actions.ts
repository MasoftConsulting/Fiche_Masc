"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { lireFiche, prochainNumero } from "@/lib/fiches";
import type { Fiche } from "@/lib/types";
import { authentifierParCode, lireTechnicien } from "@/lib/techniciens";
import { emettreCode, verifierCode } from "@/lib/double-authentification";
import {
  estCodeAdmin,
  fermerDefi,
  fermerSession,
  lireDefi,
  lireSession,
  ouvrirDefi,
  ouvrirSession,
  sessionConfiguree,
  type Session,
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

  // Première étape : le code d'accès désigne la personne. La session n'est
  // pas encore ouverte, elle attend le code envoyé par e-mail.
  let session: Session;
  let email: string | null;

  if (estCodeAdmin(code)) {
    session = { id: null, technicien: "Administrateur", role: "admin" };
    email = process.env.ADMIN_EMAIL?.trim() || null;
    if (!email) {
      return { erreur: "Adresse de l'administrateur non configurée (ADMIN_EMAIL)." };
    }
  } else {
    const technicien = await authentifierParCode(code);
    if (!technicien) return { erreur: "Code d'accès inconnu, désactivé ou expiré." };

    session = { id: technicien.id, technicien: technicien.nom, role: technicien.role };
    email = technicien.email;
    if (!email) {
      return {
        erreur:
          "Aucune adresse e-mail n'est associée à votre compte. Demandez à l'administrateur de la renseigner.",
      };
    }
  }

  const envoi = await emettreCode(email, session.id, session.technicien);
  if ("erreur" in envoi) return { erreur: envoi.erreur };

  const suite = String(formData.get("suite") ?? "/fiches");
  await ouvrirDefi({
    defiId: envoi.defiId,
    session,
    email,
    suite: suite.startsWith("/") && !suite.startsWith("//") ? suite : "/fiches",
  });
  redirect("/connexion/verification");
}

export async function verifierConnexion(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const defi = await lireDefi();
  if (!defi) redirect("/connexion?expire=1");

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { erreur: "Saisissez les 6 chiffres reçus par e-mail." };

  const resultat = await verifierCode(defi.defiId, code);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  // Le compte a pu être désactivé pendant les quelques minutes d'attente.
  if (defi.session.id) {
    const technicien = await lireTechnicien(defi.session.id);
    if (!technicien?.actif) {
      await fermerDefi();
      return { erreur: "Ce compte a été désactivé." };
    }
  }

  await fermerDefi();
  await ouvrirSession(defi.session);
  await journaliser(defi.session, ACTIONS.SESSION_CONNEXION, {
    details: {
      role: defi.session.role,
      double_authentification: true,
      ...(defi.session.id ? {} : { origine: "code_amorcage" }),
    },
  });

  redirect(defi.suite);
}

export async function renvoyerCode(): Promise<EtatFormulaire> {
  const defi = await lireDefi();
  if (!defi) redirect("/connexion?expire=1");

  const envoi = await emettreCode(defi.email, defi.session.id, defi.session.technicien);
  if ("erreur" in envoi) return { erreur: envoi.erreur };

  await ouvrirDefi({ ...defi, defiId: envoi.defiId });
  return { message: "Un nouveau code vient d'être envoyé." };
}

export async function annulerConnexion() {
  await fermerDefi();
  redirect("/connexion");
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

  // Une fiche signée par le client fait foi : seul un administrateur peut
  // encore la modifier. Revérifié ici car la page ne fait que masquer le
  // bouton, et une Server Action reste appelable directement.
  if (ficheExistante?.statut === "signee" && session.role !== "admin") {
    return { erreur: "Cette fiche est signée : seul un administrateur peut la modifier." };
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