"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSessionAdmin } from "@/lib/session";
import {
  creerClient,
  modifierClient,
  supprimerClient,
  lireClient,
} from "@/lib/clients";
import { journaliser, ACTIONS } from "@/lib/journal";

export type EtatClient = {
  erreur?: string;
  ok?: boolean;
};

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

/* ---------------------------------------------------------------- création */

export async function creerClientAction(
  _etat: EtatClient,
  formData: FormData,
): Promise<EtatClient> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom de la société est obligatoire." };

  const resultat = await creerClient({
    nom,
    adresse: texte(formData, "adresse"),
    contact: texte(formData, "contact"),
    telephone: texte(formData, "telephone"),
    email: texte(formData, "email"),
  });

  if ("erreur" in resultat) return { erreur: resultat.erreur };

  await journaliser(session, ACTIONS.CLIENT_CREATION, {
    tableCible: "clients",
    ligneId: resultat.client.id,
    details: { nom: resultat.client.nom },
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}

/* -------------------------------------------------------------- édition */

export async function modifierClientAction(
  _etat: EtatClient,
  formData: FormData,
): Promise<EtatClient> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Client introuvable." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom de la société est obligatoire." };

  const avant = await lireClient(id);
  if (!avant) return { erreur: "Client introuvable." };

  const champs = {
    nom,
    adresse: texte(formData, "adresse"),
    contact: texte(formData, "contact"),
    telephone: texte(formData, "telephone"),
    email: texte(formData, "email"),
  };

  const resultat = await modifierClient(id, champs);
  if (resultat.erreur) return { erreur: resultat.erreur };

  // On ne journalise que si quelque chose a réellement changé.
  const changes: Record<string, { avant: unknown; apres: unknown }> = {};
  for (const [cle, valeur] of Object.entries(champs)) {
    const avantVal = (avant as Record<string, unknown>)[cle];
    if (avantVal !== valeur) changes[cle] = { avant: avantVal, apres: valeur };
  }

  if (Object.keys(changes).length > 0) {
    await journaliser(session, ACTIONS.CLIENT_MODIFICATION, {
      tableCible: "clients",
      ligneId: id,
      details: { nom: avant.nom, changements: changes },
    });
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

/* ------------------------------------------------------------ suppression */

export async function supprimerClientAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/clients");

  const avant = await lireClient(id);
  if (!avant) redirect("/admin/clients");

  await supprimerClient(id);

  await journaliser(session, ACTIONS.CLIENT_SUPPRESSION, {
    tableCible: "clients",
    ligneId: id,
    details: { nom: avant.nom },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  redirect("/admin/clients?supprime=1");
}