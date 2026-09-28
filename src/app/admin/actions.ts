"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSessionAdmin, estCodeAdmin } from "@/lib/session";
import {
  creerTechnicien,
  modifierTechnicien,
  regenererCode,
  supprimerTechnicien,
  estDernierAdminActif,
  lireTechnicien,
} from "@/lib/techniciens";
import { journaliser, ACTIONS } from "@/lib/journal";

/**
 * Actions de l'espace administration.
 *
 * Chacune revérifie la session : une Server Action est une route HTTP à part
 * entière, la garde de la page qui affiche le bouton ne la protège pas.
 *
 * Chaque écriture réussie est suivie d'un appel à `journaliser()`. Le helper
 * ne jette jamais : si le journal tombe, l'action métier reste valide.
 */

export type EtatAdmin = {
  erreur?: string;
  code?: string;
  nom?: string;
};

/* ================================================================ création */

export async function creerTechnicienAction(
  _etat: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { erreur: "Indiquez le nom du technicien." };

  const role = formData.get("role") === "admin" ? "admin" : "technicien";
  const codeImpose = String(formData.get("code") ?? "").trim();

  if (codeImpose && codeImpose.length < 6) {
    return { erreur: "Un code choisi manuellement doit faire au moins 6 caractères." };
  }
  if (codeImpose && estCodeAdmin(codeImpose)) {
    return { erreur: "Ce code est déjà celui de l'administrateur." };
  }

  const resultat = await creerTechnicien(nom, role, codeImpose || undefined);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  await journaliser(session, ACTIONS.TECHNICIEN_CREATION, {
    tableCible: "techniciens",
    ligneId: resultat.technicien.id,
    details: { nom: resultat.technicien.nom, role: resultat.technicien.role },
  });

  revalidatePath("/admin");
  return { code: resultat.code, nom: resultat.technicien.nom };
}

/* =========================================================== code d'accès */

export async function regenererCodeAction(
  _etat: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Technicien introuvable." };

  const resultat = await regenererCode(id);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  await journaliser(session, ACTIONS.TECHNICIEN_CODE_REGENE, {
    tableCible: "techniciens",
    ligneId: id,
    acteurNom: session.technicien,
    details: { nom: resultat.technicien.nom },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/techniciens/${id}`);
  return { code: resultat.code, nom: resultat.technicien.nom };
}

/* ======================================================== actif / inactif */

export async function basculerActifAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "1";
  if (!id) redirect("/admin");

  const retour = `/admin/techniciens/${id}`;

  if (id === session.id && !actif) {
    redirect(`${retour}?erreur=auto-desactivation`);
  }
  if (!actif && (await estDernierAdminActif(id))) {
    redirect(`${retour}?erreur=dernier-admin`);
  }

  // Lire le nom AVANT modification : on veut le nom tel qu'il était au moment
  // de l'action, pas après.
  const technicien = await lireTechnicien(id);

  await modifierTechnicien(id, { actif });

  if (technicien) {
    await journaliser(
      session,
      actif ? ACTIONS.TECHNICIEN_REACTIVATION : ACTIONS.TECHNICIEN_DESACTIVATION,
      {
        tableCible: "techniciens",
        ligneId: id,
        details: { nom: technicien.nom },
      },
    );
  }

  revalidatePath("/admin");
  revalidatePath(retour);
}

/* ============================================================== renommer */

export async function renommerTechnicienAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  if (!id) redirect("/admin");
  if (nom.length < 2) redirect(`/admin/techniciens/${id}?erreur=nom-invalide`);

  const avant = await lireTechnicien(id);
  if (!avant) redirect("/admin");

  // Rien à faire si le nom n'a pas changé : évite de polluer le journal avec
  // un "modifié" alors qu'aucun champ n'a bougé.
  if (avant.nom === nom) {
    revalidatePath("/admin");
    revalidatePath(`/admin/techniciens/${id}`);
    return;
  }

  await modifierTechnicien(id, { nom });

  await journaliser(session, ACTIONS.TECHNICIEN_MODIFICATION, {
    tableCible: "techniciens",
    ligneId: id,
    details: { avant: avant.nom, apres: nom },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/techniciens/${id}`);
}

/* ========================================================== changer rôle */

export async function changerRoleAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "technicien";
  if (!id) redirect("/admin");

  const retour = `/admin/techniciens/${id}`;

  if (id === session.id && role === "technicien") {
    redirect(`${retour}?erreur=auto-retrogradation`);
  }
  if (role === "technicien" && (await estDernierAdminActif(id))) {
    redirect(`${retour}?erreur=dernier-admin`);
  }

  const avant = await lireTechnicien(id);
  if (!avant) redirect("/admin");
  if (avant.role === role) return;

  await modifierTechnicien(id, { role });

  await journaliser(session, ACTIONS.TECHNICIEN_MODIFICATION, {
    tableCible: "techniciens",
    ligneId: id,
    details: { nom: avant.nom, champ: "role", avant: avant.role, apres: role },
  });

  revalidatePath("/admin");
  revalidatePath(retour);
}

/* =================================================== enregistrement groupé */

export async function enregistrerTechnicienAction(
  _etat: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  const session = await lireSessionAdmin();
  if (!session) return { erreur: "Réservé à l'administrateur." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Technicien introuvable." };

  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { erreur: "Le nom doit contenir au moins 2 caractères." };

  const roleDemande = formData.get("role") === "admin" ? "admin" : "technicien";
  const actifDemande = formData.get("actif") === "1";

  if (id === session.id) {
    if (roleDemande !== "admin") {
      return { erreur: "Vous ne pouvez pas retirer votre propre rôle d'administrateur." };
    }
    if (!actifDemande) {
      return { erreur: "Vous ne pouvez pas désactiver votre propre compte." };
    }
  }

  if (roleDemande !== "admin" || !actifDemande) {
    if (await estDernierAdminActif(id)) {
      return {
        erreur:
          "Impossible : ce technicien est le dernier administrateur actif. Promouvez d'abord quelqu'un d'autre.",
      };
    }
  }

  const avant = await lireTechnicien(id);
  if (!avant) return { erreur: "Technicien introuvable." };

  const resultat = await modifierTechnicien(id, {
    nom,
    role: roleDemande,
    actif: actifDemande,
  });
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  // On ne journalise que si quelque chose a réellement changé. Un
  // enregistrement sans modification (double-clic, retour puis re-soumission)
  // ne doit pas apparaître dans l'historique.
  const changements: Record<string, { avant: unknown; apres: unknown }> = {};
  if (avant.nom !== nom) changements.nom = { avant: avant.nom, apres: nom };
  if (avant.role !== roleDemande) {
    changements.role = { avant: avant.role, apres: roleDemande };
  }
  if (avant.actif !== actifDemande) {
    changements.actif = { avant: avant.actif, apres: actifDemande };
  }

  if (Object.keys(changements).length > 0) {
    await journaliser(session, ACTIONS.TECHNICIEN_MODIFICATION, {
      tableCible: "techniciens",
      ligneId: id,
      details: { nom: avant.nom, changements },
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/techniciens/${id}`);
  return { nom };
}

/* ============================================================ suppression */

export async function supprimerTechnicienAction(formData: FormData) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin");

  if (id === session.id) {
    redirect(`/admin/techniciens/${id}?erreur=auto-suppression`);
  }
  if (await estDernierAdminActif(id)) {
    redirect(`/admin/techniciens/${id}?erreur=dernier-admin`);
  }

  // On figera le nom dans le journal : après suppression, cette valeur sera
  // la seule trace du compte.
  const avant = await lireTechnicien(id);

  await supprimerTechnicien(id);

  if (avant) {
    await journaliser(session, ACTIONS.TECHNICIEN_SUPPRESSION, {
      tableCible: "techniciens",
      ligneId: id,
      details: { nom: avant.nom, role: avant.role },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/fiches");
  redirect("/admin?supprime=1");
}