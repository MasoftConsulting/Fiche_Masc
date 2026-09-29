import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "./supabase";
import { hacherCodeMfa } from "./session";
import { envoyerEmail } from "./email";

const TABLE = "codes_mfa";

/** Durée de validité d'un code MFA. */
const DUREE_MINUTES = 10;

/** Nombre de tentatives infructueuses avant blocage. */
const TENTATIVES_MAX = 5;

/**
 * Identifiant interne d'un porteur de code MFA.
 *
 * Deux types de porteurs :
 *  - Un technicien en base : `technicien:<uuid>`
 *  - L'admin d'amorçage :    `admin_amorcage`
 *
 * Ce `user_key` est la clé unique de la table : il n'y a jamais plus d'un
 * code actif par utilisateur.
 */
export function cleMfa(acteurId: string | null): string {
  return acteurId ? `technicien:${acteurId}` : "admin_amorcage";
}

/**
 * Génère un code à 6 chiffres, l'enregistre hashé, et l'envoie par email.
 *
 * Écrase systématiquement tout code précédent pour cet utilisateur : un seul
 * code actif à la fois. Renvoie `{ ok: true }` si l'email est parti, une
 * erreur lisible sinon.
 */
export async function envoyerCodeMfa(
  acteurId: string | null,
  email: string,
): Promise<{ ok: true } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  // Code à 6 chiffres, zéro-padded (000000 à 999999).
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expireLe = new Date(Date.now() + DUREE_MINUTES * 60_000).toISOString();
  const userKey = cleMfa(acteurId);

  // Purge silencieuse des codes expirés depuis plus d'une heure. On ne le
  // fait pas systématiquement — juste quand on écrit, ça suffit largement.
  await supabase
    .from(TABLE)
    .delete()
    .lt("expire_le", new Date(Date.now() - 60 * 60_000).toISOString())
    .then(
      () => undefined,
      () => undefined,
    );

  // On remplace le code précédent : upsert sur user_key.
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_key: userKey,
      code_hash: hacherCodeMfa(code),
      email,
      tentatives: 0,
      expire_le: expireLe,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_key" },
  );

  if (error) {
    console.error("[mfa] upsert code", error.message);
    return { erreur: "Impossible d'enregistrer le code." };
  }

  const sujet = `Votre code de connexion : ${code}`;
  const texte = [
    `Votre code de vérification est : ${code}`,
    ``,
    `Il est valable ${DUREE_MINUTES} minutes et ne peut être utilisé qu'une seule fois.`,
    ``,
    `Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.`,
    ``,
    `MA SOFT CONSULTING`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:32px;">
      <p style="font-size:14px;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 24px;">
        MA SOFT CONSULTING
      </p>
      <h1 style="font-size:22px;margin:0 0 16px;">Votre code de connexion</h1>
      <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 24px;">
        Entrez ce code pour terminer votre connexion :
      </p>
      <div style="font-family:monospace;font-size:32px;letter-spacing:0.15em;background:#f4f4f4;padding:20px;text-align:center;border-radius:8px;margin:24px 0;">
        <strong>${code}</strong>
      </div>
      <p style="font-size:13px;color:#666;line-height:1.5;">
        Valable ${DUREE_MINUTES} minutes, usage unique.<br>
        Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
      </p>
    </div>
  `;

  const envoi = await envoyerEmail({ destinataire: email, sujet, texte, html });
  if ("erreur" in envoi) return { erreur: envoi.erreur };

  return { ok: true };
}

/**
 * Vérifie un code MFA.
 *
 * Trois issues possibles :
 *  - Code correct et valide → renvoie { ok: true }, et supprime la ligne
 *    (usage unique).
 *  - Code expiré ou inconnu → { erreur: "Code invalide ou expiré." }
 *  - Trop de tentatives → { erreur: "Trop de tentatives, demandez un nouveau code." }
 *
 * La suppression en cas de succès garantit qu'un code intercepté ne peut
 * jamais servir deux fois.
 */
export async function verifierCodeMfa(
  acteurId: string | null,
  code: string,
): Promise<{ ok: true } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const codePropre = String(code).trim();
  if (!/^\d{6}$/.test(codePropre)) {
    return { erreur: "Le code doit contenir 6 chiffres." };
  }

  const userKey = cleMfa(acteurId);

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, code_hash, tentatives, expire_le")
    .eq("user_key", userKey)
    .maybeSingle();

  if (error) {
    console.error("[mfa] lecture code", error.message);
    return { erreur: "Impossible de vérifier le code." };
  }

  if (!data) {
    return { erreur: "Aucun code en attente. Reconnectez-vous." };
  }

  if (new Date(data.expire_le) < new Date()) {
    await supabase.from(TABLE).delete().eq("id", data.id);
    return { erreur: "Code expiré. Reconnectez-vous pour en recevoir un nouveau." };
  }

  if (data.tentatives >= TENTATIVES_MAX) {
    return { erreur: "Trop de tentatives. Reconnectez-vous pour recommencer." };
  }

  const hashSoumis = hacherCodeMfa(codePropre);
  if (hashSoumis !== data.code_hash) {
    await supabase
      .from(TABLE)
      .update({ tentatives: data.tentatives + 1 })
      .eq("id", data.id);
    return { erreur: "Code incorrect." };
  }

  // Succès : on supprime la ligne (usage unique).
  await supabase.from(TABLE).delete().eq("id", data.id);
  return { ok: true };
}

/**
 * Indique s'il existe un code MFA en attente pour cet utilisateur.
 *
 * Utilisé par la page de saisie du code : si aucun code n'est en attente
 * (expiré, déjà utilisé), on renvoie l'utilisateur vers la page de connexion
 * plutôt que de lui faire saisir un code dans le vide.
 */
export async function aUnCodeEnAttente(acteurId: string | null): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { count } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_key", cleMfa(acteurId))
    .gt("expire_le", new Date().toISOString());

  return (count ?? 0) > 0;
}