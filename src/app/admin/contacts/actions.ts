"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSessionAdmin } from "@/lib/session";
import {
  creerContact,
  modifierContact,
  supprimerContact,
  lireContact,
} from "@/lib/contacts";
import { normaliserEmail } from "@/lib/techniciens";
import { journaliser, ACTIONS } from "@/lib/journal";

export type EtatContact = {
  erreur?: string;
  ok?: boolean;
};

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

/* ---------------------------------------------------------------- création */

export async function creerContactAction(
  _etat: EtatContact,
  formData: FormData,
): Promise<EtatContact> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Client introuvable." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom du contact est obligatoire." };

  const email = normaliserEmail(String(formData.get("email") ?? ""));
  if (email === false) return { erreur: "Adresse e-mail invalide." };

  const resultat = await creerContact({
    client_id: clientId,
    nom,
    poste: texte(formData, "poste"),
    email,
    telephone: texte(formData, "telephone"),
  });

  if ("erreur" in resultat) return { erreur: resultat.erreur };

  await journaliser(session, ACTIONS.CONTACT_CREATION, {
    tableCible: "contacts",
    ligneId: resultat.contact.id,
    details: {
      client_id: clientId,
      nom: resultat.contact.nom,
      poste: resultat.contact.poste,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

/* -------------------------------------------------------------- édition */

export async function modifierContactAction(
  _etat: EtatContact,
  formData: FormData,
): Promise<EtatContact> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Contact introuvable." };

  const avant = await lireContact(id);
  if (!avant) return { erreur: "Contact introuvable." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom du contact est obligatoire." };

  const email = normaliserEmail(String(formData.get("email") ?? ""));
  if (email === false) return { erreur: "Adresse e-mail invalide." };

  const champs = {
    nom,
    poste: texte(formData, "poste"),
    email,
    telephone: texte(formData, "telephone"),
  };

  const resultat = await modifierContact(id, champs);
  if (resultat.erreur) return { erreur: resultat.erreur };

  const changes: Record<string, { avant: unknown; apres: unknown }> = {};
  for (const [cle, valeur] of Object.entries(champs)) {
    const avantVal = (avant as Record<string, unknown>)[cle];
    if (avantVal !== valeur) changes[cle] = { avant: avantVal, apres: valeur };
  }

  if (Object.keys(changes).length > 0) {
    await journaliser(session, ACTIONS.CONTACT_MODIFICATION, {
      tableCible: "contacts",
      ligneId: id,
      details: {
        client_id: avant.client_id,
        nom: avant.nom,
        changements: changes,
      },
    });
  }

  revalidatePath(`/admin/clients/${avant.client_id}`);
  return { ok: true };
}

/* ------------------------------------------------------------ suppression */

export async function supprimerContactAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/clients");

  const avant = await lireContact(id);
  if (!avant) redirect("/admin/clients");

  await supprimerContact(id);

  await journaliser(session, ACTIONS.CONTACT_SUPPRESSION, {
    tableCible: "contacts",
    ligneId: id,
    details: {
      client_id: avant.client_id,
      nom: avant.nom,
    },
  });

  revalidatePath(`/admin/clients/${avant.client_id}`);
  redirect(`/admin/clients/${avant.client_id}?contact_supprime=1`);
}