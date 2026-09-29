import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Accès à la plateforme.
 *
 * Deux portes d'entrée, un seul champ à l'écran : le code d'accès.
 *  - le code administrateur, fixé dans l'environnement (CODE_ADMIN), sert
 *    d'amorçage : c'est lui qui permet de créer les premiers techniciens ;
 *  - les codes des techniciens vivent dans la table `techniciens`, un par
 *    personne, et identifient donc directement leur porteur.
 *
 * La session tient dans un cookie httpOnly signé (HS256) : illisible en
 * JavaScript, non falsifiable côté client.
 */

const COOKIE = "masc_fiche";
const DUREE_JOURS = 30;

export type Session = {
  /** null pour l'administrateur d'amorçage, qui n'a pas de ligne en base. */
  id: string | null;
  technicien: string;
  role: "technicien" | "admin";
};

function secret() {
  const valeur = process.env.SESSION_SECRET;
  // Sans secret configuré on refuse de signer, plutôt que de retomber sur une
  // valeur par défaut qui rendrait toutes les sessions falsifiables.
  if (!valeur || valeur.length < 32) return null;
  return valeur;
}

export function sessionConfiguree() {
  return Boolean(secret() && codeAdmin());
}

function codeAdmin() {
  // ACCES_CODE_ADMIN est l'ancien nom, conservé pour ne pas casser un .env
  // déjà en place.
  return process.env.CODE_ADMIN || process.env.ACCES_CODE_ADMIN || "";
}

/**
 * Empreinte d'un code d'accès.
 *
 * HMAC-SHA256 avec SESSION_SECRET plutôt que bcrypt : l'empreinte est
 * déterministe, donc la connexion se résout en une seule requête indexée au
 * lieu de comparer le code à chaque ligne de la table. Le secret n'étant pas
 * dans la base, une fuite du contenu SQL ne révèle aucun code.
 */
export function hacherCode(code: string) {
  const cle = secret();
  if (!cle) throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  return createHmac("sha256", cle).update(code.trim()).digest("hex");
}

/** Comparaison en temps constant (évite l'attaque par chronométrage). */
function memeCode(a: string, b: string) {
  const ta = Buffer.from(a);
  const tb = Buffer.from(b);
  if (ta.length !== tb.length) return false;
  return timingSafeEqual(ta, tb);
}

/** Le code saisi est-il celui de l'administrateur d'amorçage ? */
export function estCodeAdmin(code: string) {
  const attendu = codeAdmin();
  return attendu.length > 0 && memeCode(code.trim(), attendu);
}

export async function ouvrirSession(session: Session) {
  const cle = secret();
  if (!cle) throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");

  const jeton = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_JOURS}d`)
    .sign(new TextEncoder().encode(cle));

  const store = await cookies();
  store.set(COOKIE, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_JOURS * 24 * 60 * 60,
  });
}

export async function lireSession(): Promise<Session | null> {
  const cle = secret();
  if (!cle) return null;

  const jeton = (await cookies()).get(COOKIE)?.value;
  if (!jeton) return null;

  try {
    const { payload } = await jwtVerify(jeton, new TextEncoder().encode(cle));
    return {
      id: payload.id ? String(payload.id) : null,
      technicien: String(payload.technicien ?? ""),
      role: payload.role === "admin" ? "admin" : "technicien",
    };
  } catch {
    // Jeton expiré ou signature invalide : traité comme non connecté.
    return null;
  }
}

/** Session administrateur, ou null. Sert de garde dans les pages protégées. */
export async function lireSessionAdmin(): Promise<Session | null> {
  const session = await lireSession();
  return session?.role === "admin" ? session : null;
}

export async function fermerSession() {
  (await cookies()).delete(COOKIE);
}
