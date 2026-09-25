"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { lireFiche, prochainNumero } from "@/lib/fiches";
import { authentifierParCode } from "@/lib/techniciens";
import {
  estCodeAdmin,
  fermerSession,
  lireSession,
  ouvrirSession,
  sessionConfiguree,
} from "@/lib/session";
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

  // Le code administrateur d'amorçage est vérifié en premier : il doit rester
  // utilisable même quand la table `techniciens` est encore vide.
  if (estCodeAdmin(code)) {
    await ouvrirSession({ id: null, technicien: "Administrateur", role: "admin" });
  } else {
    const technicien = await authentifierParCode(code);
    if (!technicien) return { erreur: "Code d'accès inconnu, désactivé ou expiré." };

    await ouvrirSession({
      id: technicien.id,
      technicien: technicien.nom,
      role: technicien.role,
    });
  }

  const suite = String(formData.get("suite") ?? "/fiches");
  // On n'accepte qu'un chemin interne : une valeur du type "//exemple.com"
  // ferait sortir l'utilisateur du site.
  redirect(suite.startsWith("/") && !suite.startsWith("//") ? suite : "/fiches");
}

export async function deconnexion() {
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

/** Une signature vide (canvas jamais touché) ne doit pas être enregistrée. */
function signature(formData: FormData, cle: string): string | null {
  const valeur = String(formData.get(cle) ?? "");
  if (!valeur.startsWith("data:image/png;base64,")) return null;
  // ~2 Mo de base64 : au-delà, le tracé est anormal et on préfère refuser
  // plutôt que de faire échouer l'insertion côté Postgres.
  if (valeur.length > 2_000_000) return null;
  return valeur;
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

  // Modification : on revérifie côté serveur que la fiche appartient bien à
  // celui qui l'enregistre. Le formulaire seul ne prouve rien.
  if (id && session.role !== "admin") {
    const existante = await lireFiche(id);
    if (!existante) return { erreur: "Fiche introuvable." };
    if (existante.technicien_id !== session.id) {
      return { erreur: "Cette fiche appartient à un autre technicien." };
    }
  }

  const resultat = texte(formData, "resultat") as Resultat | null;
  const signatureClient = signature(formData, "signature_client");
  const signatureTechnicien = signature(formData, "signature_technicien");

  // Une fiche n'est « signée » que lorsque le client a validé : c'est ce que
  // matérialise le « Validation client requise » du document papier.
  const statut = signatureClient ? "signee" : "brouillon";

  const valeurs = {
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
    // `technicien_id` n'est jamais réécrit à la modification : la fiche reste
    // attribuée à celui qui l'a ouverte, même relue par un administrateur.
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
      // Collision sur la numérotation : deux fiches créées en même temps.
      if (error.code === "23505") {
        return { erreur: "Ce numéro de fiche existe déjà. Rechargez la page pour obtenir le suivant." };
      }
      return { erreur: `Création impossible : ${error.message}` };
    }
    identifiant = (data as { id: string }).id;
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

  const supabase = createAdminClient();
  if (supabase) await supabase.from(TABLE).delete().eq("id", id);

  revalidatePath("/fiches");
  revalidatePath("/admin");
  redirect("/fiches?supprime=1");
}
