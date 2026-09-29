import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { createAdminClient } from "./supabase";
import { envoyerCourriel } from "./email";
import { DUREE_DEFI_MINUTES, hacherCode, memeCode } from "./session";

/**
 * Code à usage unique envoyé par e-mail, seconde étape de la connexion.
 *
 * Table `codes_mfa` : une seule ligne par utilisateur (`user_key` unique), donc
 * un seul code valide à la fois. Chaque envoi remplace la ligne ET son
 * identifiant : le cookie de défi porte cet identifiant, si bien qu'un code
 * renvoyé rend caduc tout défi précédent.
 *
 * Comme les codes d'accès, le code n'est jamais stocké en clair : seule son
 * empreinte HMAC, liée à l'identifiant de la ligne, est conservée.
 */

const TABLE = "codes_mfa";
const TENTATIVES_MAX = 5;
const DELAI_RENVOI_SECONDES = 60;

export type ResultatEnvoi = { defiId: string } | { erreur: string };
export type ResultatVerification = { ok: true } | { erreur: string };

/** `technicien:<uuid>` ou `admin_amorcage` pour l'administrateur d'amorçage. */
function cleUtilisateur(technicienId: string | null) {
  return technicienId ? `technicien:${technicienId}` : "admin_amorcage";
}

function empreinte(defiId: string, code: string) {
  return hacherCode(`mfa:${defiId}:${code}`);
}

/** Masque une adresse pour l'affichage : j•••@exemple.com. */
export function masquerEmail(email: string) {
  const [local, domaine] = email.split("@");
  if (!domaine) return email;
  return `${local.slice(0, 1)}•••@${domaine}`;
}

export async function emettreCode(
  email: string,
  technicienId: string | null,
  nom: string,
): Promise<ResultatEnvoi> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const userKey = cleUtilisateur(technicienId);

  const { data: precedent, error: erreurLecture } = await supabase
    .from(TABLE)
    .select("created_at")
    .eq("user_key", userKey)
    .maybeSingle();

  if (erreurLecture) {
    console.error("[double-auth] lecture", erreurLecture.message);
    return { erreur: "Vérification indisponible. Réessayez dans un instant." };
  }

  const dernierEnvoi = (precedent as { created_at: string } | null)?.created_at;
  if (dernierEnvoi && Date.now() - new Date(dernierEnvoi).getTime() < DELAI_RENVOI_SECONDES * 1000) {
    return { erreur: "Un code vient d'être envoyé. Patientez une minute avant d'en demander un autre." };
  }

  const defiId = randomUUID();
  const code = String(randomInt(1_000_000)).padStart(6, "0");

  const { error } = await supabase.from(TABLE).upsert(
    {
      id: defiId,
      user_key: userKey,
      email,
      code_hash: empreinte(defiId, code),
      tentatives: 0,
      expire_le: new Date(Date.now() + DUREE_DEFI_MINUTES * 60_000).toISOString(),
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_key" },
  );

  if (error) {
    console.error("[double-auth] enregistrement", error.message);
    return { erreur: "Vérification indisponible. Réessayez dans un instant." };
  }

  const envoi = await envoyerCourriel({
    a: email,
    sujet: `${code} — votre code de connexion`,
    texte: [
      `Bonjour ${nom},`,
      "",
      `Votre code de connexion aux fiches d'intervention : ${code}`,
      "",
      `Il est valable ${DUREE_DEFI_MINUTES} minutes et ne peut servir qu'une fois.`,
      "Si vous n'êtes pas à l'origine de cette demande, prévenez l'administrateur : votre code d'accès est peut-être connu d'un tiers.",
      "",
      "MA SOFT CONSULTING",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1f2b;max-width:480px">
        <p>Bonjour ${echapper(nom)},</p>
        <p>Votre code de connexion aux fiches d'intervention :</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${code}</p>
        <p>Il est valable ${DUREE_DEFI_MINUTES} minutes et ne peut servir qu'une fois.</p>
        <p style="color:#6b7280;font-size:13px">Si vous n'êtes pas à l'origine de cette demande,
        prévenez l'administrateur : votre code d'accès est peut-être connu d'un tiers.</p>
        <p style="color:#6b7280;font-size:13px">MA SOFT CONSULTING</p>
      </div>`,
  });

  if (envoi.erreur) {
    // Code jamais reçu : on l'efface, pour que le délai entre deux envois ne
    // bloque pas une nouvelle tentative immédiate.
    await supabase.from(TABLE).delete().eq("id", defiId);
    return { erreur: envoi.erreur };
  }
  return { defiId };
}

export async function verifierCode(defiId: string, code: string): Promise<ResultatVerification> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data, error } = await supabase
    .from(TABLE)
    .select("code_hash, tentatives, expire_le")
    .eq("id", defiId)
    .maybeSingle();

  if (error) {
    console.error("[double-auth] vérification", error.message);
    return { erreur: "Vérification indisponible. Réessayez dans un instant." };
  }

  const defi = data as { code_hash: string; tentatives: number; expire_le: string } | null;

  // Ligne absente : code déjà utilisé, ou remplacé par un envoi plus récent.
  if (!defi) return { erreur: "Ce code n'est plus valable. Demandez-en un nouveau." };
  if (new Date(defi.expire_le).getTime() < Date.now()) {
    return { erreur: "Ce code a expiré. Demandez-en un nouveau." };
  }
  if (defi.tentatives >= TENTATIVES_MAX) {
    return { erreur: "Trop d'essais. Demandez un nouveau code." };
  }

  if (!memeCode(empreinte(defiId, code), defi.code_hash)) {
    const tentatives = defi.tentatives + 1;
    await supabase.from(TABLE).update({ tentatives }).eq("id", defiId);
    const restantes = TENTATIVES_MAX - tentatives;
    return restantes > 0
      ? { erreur: `Code incorrect. ${restantes} essai${restantes > 1 ? "s" : ""} restant${restantes > 1 ? "s" : ""}.` }
      : { erreur: "Trop d'essais. Demandez un nouveau code." };
  }

  // Usage unique : la ligne est supprimée. Si deux soumissions arrivent en
  // même temps, une seule obtient la ligne supprimée en retour.
  const { data: consomme } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", defiId)
    .select("id");

  if (!consomme || consomme.length === 0) {
    return { erreur: "Ce code n'est plus valable. Demandez-en un nouveau." };
  }
  return { ok: true };
}

function echapper(texte: string) {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
