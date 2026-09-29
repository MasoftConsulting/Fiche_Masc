"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSessionAdmin, estCodeAdmin } from "@/lib/session";
import {
  creerTechnicien,
  modifierTechnicien,
  regenererCode,
  supprimerTechnicien,
} from "@/lib/techniciens";

/**
 * Actions de l'espace administration.
 *
 * Chacune revérifie la session : une Server Action est une route HTTP à part
 * entière, la garde de la page qui affiche le bouton ne la protège pas.
 */

export type EtatAdmin = {
  erreur?: string;
  /** Code en clair, affiché une seule fois après création ou régénération. */
  code?: string;
  nom?: string;
};

export async function creerTechnicienAction(
  _etat: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  if (!(await lireSessionAdmin())) return { erreur: "Réservé à l'administrateur." };

  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { erreur: "Indiquez le nom du technicien." };

  const role = formData.get("role") === "admin" ? "admin" : "technicien";
  const codeImpose = String(formData.get("code") ?? "").trim();

  if (codeImpose && codeImpose.length < 6) {
    return { erreur: "Un code choisi manuellement doit faire au moins 6 caractères." };
  }
  // Deux portes d'entrée ne peuvent pas partager le même code : l'amorçage
  // administrateur gagnerait toujours et le technicien ne pourrait plus entrer.
  if (codeImpose && estCodeAdmin(codeImpose)) {
    return { erreur: "Ce code est déjà celui de l'administrateur." };
  }

  const resultat = await creerTechnicien(nom, role, codeImpose || undefined);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  revalidatePath("/admin");
  return { code: resultat.code, nom: resultat.technicien.nom };
}

export async function regenererCodeAction(
  _etat: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  if (!(await lireSessionAdmin())) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Technicien introuvable." };

  const resultat = await regenererCode(id);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  revalidatePath("/admin");
  return { code: resultat.code, nom: resultat.technicien.nom };
}

export async function basculerActifAction(formData: FormData) {
  if (!(await lireSessionAdmin())) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "1";
  if (id) await modifierTechnicien(id, { actif });

  revalidatePath("/admin");
}

export async function renommerTechnicienAction(formData: FormData) {
  if (!(await lireSessionAdmin())) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  if (id && nom.length >= 2) await modifierTechnicien(id, { nom });

  revalidatePath("/admin");
}

export async function supprimerTechnicienAction(formData: FormData) {
  if (!(await lireSessionAdmin())) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (id) await supprimerTechnicien(id);

  revalidatePath("/admin");
  revalidatePath("/fiches");
  redirect("/admin?supprime=1");
}
