"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSessionAdmin } from "@/lib/session";
import {
  creerEquipement,
  modifierEquipement,
  supprimerEquipement,
  lireEquipement,
} from "@/lib/equipements";
import { journaliser, ACTIONS } from "@/lib/journal";

export type EtatEquipement = {
  erreur?: string;
  ok?: boolean;
};

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

/* ---------------------------------------------------------------- création */

export async function creerEquipementAction(
  _etat: EtatEquipement,
  formData: FormData,
): Promise<EtatEquipement> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Client introuvable." };

  const marque = texte(formData, "marque_modele");
  if (!marque) return { erreur: "La marque / le modèle est obligatoire." };

  const resultat = await creerEquipement({
    client_id: clientId,
    marque_modele: marque,
    numero_serie: texte(formData, "numero_serie"),
    adresse_ip: texte(formData, "adresse_ip"),
    localisation: texte(formData, "localisation"),
  });

  if ("erreur" in resultat) return { erreur: resultat.erreur };

  await journaliser(session, ACTIONS.EQUIPEMENT_CREATION, {
    tableCible: "equipements",
    ligneId: resultat.equipement.id,
    details: {
      client_id: clientId,
      marque_modele: resultat.equipement.marque_modele,
      numero_serie: resultat.equipement.numero_serie,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);

  revalidatePath("/admin/equipements");
  revalidatePath("/admin/clients");
  return { ok: true };
}

/* -------------------------------------------------------------- édition */

export async function modifierEquipementAction(
  _etat: EtatEquipement,
  formData: FormData,
): Promise<EtatEquipement> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Équipement introuvable." };

  const avant = await lireEquipement(id);
  if (!avant) return { erreur: "Équipement introuvable." };

  const marque = texte(formData, "marque_modele");
  if (!marque) return { erreur: "La marque / le modèle est obligatoire." };

  const champs = {
    marque_modele: marque,
    numero_serie: texte(formData, "numero_serie"),
    adresse_ip: texte(formData, "adresse_ip"),
    localisation: texte(formData, "localisation"),
  };

  const resultat = await modifierEquipement(id, champs);
  if (resultat.erreur) return { erreur: resultat.erreur };

  const changes: Record<string, { avant: unknown; apres: unknown }> = {};
  for (const [cle, valeur] of Object.entries(champs)) {
    const avantVal = (avant as Record<string, unknown>)[cle];
    if (avantVal !== valeur) changes[cle] = { avant: avantVal, apres: valeur };
  }

  if (Object.keys(changes).length > 0) {
    await journaliser(session, ACTIONS.EQUIPEMENT_MODIFICATION, {
      tableCible: "equipements",
      ligneId: id,
      details: {
        client_id: avant.client_id,
        marque_modele: avant.marque_modele,
        changements: changes,
      },
    });
  }

  revalidatePath(`/admin/clients/${avant.client_id}`);

  revalidatePath("/admin/equipements");
  revalidatePath("/admin/clients");
  return { ok: true };
}

/* ------------------------------------------------------------ suppression */

export async function supprimerEquipementAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/clients");

  const avant = await lireEquipement(id);
  if (!avant) redirect("/admin/clients");

  await supprimerEquipement(id);

  await journaliser(session, ACTIONS.EQUIPEMENT_SUPPRESSION, {
    tableCible: "equipements",
    ligneId: id,
    details: {
      client_id: avant.client_id,
      marque_modele: avant.marque_modele,
      numero_serie: avant.numero_serie,
    },
  });

  revalidatePath(`/admin/clients/${avant.client_id}`);

  revalidatePath("/admin/equipements");
  revalidatePath("/admin/clients");
  // Retour à la page d'origine (liste globale ou page du client). Limité à
  // /admin/ : un paramètre de formulaire ne doit pas pouvoir rediriger ailleurs.
  const retour = String(formData.get("retour") ?? "");
  if (retour.startsWith("/admin/") && !retour.includes("//")) {
    redirect(`${retour}${retour.includes("?") ? "&" : "?"}equipement_supprime=1`);
  }
  redirect(`/admin/clients/${avant.client_id}?equipement_supprime=1`);
}