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
export function memeCode(a: string, b: string) {
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

  // `mfa` atteste que la double authentification a eu lieu. Le proxy et
  // lireSession() refusent tout jeton qui ne le porte pas : les sessions
  // ouvertes avant la mise en place du code par e-mail sont donc invalidées.
  const jeton = await new SignJWT({ ...session, mfa: true })
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
    if (payload.mfa !== true) return null;
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

/* ------------------------------------------------ double authentification */

/**
 * Entre la saisie du code d'accès et celle du code reçu par e-mail, l'identité
 * en attente tient dans un second cookie, de courte durée.
 *
 * Il est signé avec une clé dérivée, distincte de celle des sessions : recopié
 * dans le cookie de session, il serait rejeté. Sans cela, le simple fait de
 * connaître le code d'accès suffirait à fabriquer une session.
 */

const COOKIE_DEFI = "masc_fiche_defi";
export const DUREE_DEFI_MINUTES = 10;

export type Defi = {
  /** Ligne de `codes_mfa` à laquelle le code saisi sera comparé. */
  defiId: string;
  session: Session;
  email: string;
  suite: string;
};

function cleDefi() {
  const cle = secret();
  return cle ? new TextEncoder().encode(`${cle}:double-authentification`) : null;
}

export async function ouvrirDefi(defi: Defi) {
  const cle = cleDefi();
  if (!cle) throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");

  const jeton = await new SignJWT({ ...defi })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_DEFI_MINUTES}m`)
    .sign(cle);

  (await cookies()).set(COOKIE_DEFI, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_DEFI_MINUTES * 60,
  });
}

export async function lireDefi(): Promise<Defi | null> {
  const cle = cleDefi();
  if (!cle) return null;

  const jeton = (await cookies()).get(COOKIE_DEFI)?.value;
  if (!jeton) return null;

  try {
    const { payload } = await jwtVerify(jeton, cle);
    const session = payload.session as Partial<Session> | undefined;
    if (!payload.defiId || !payload.email || !session) return null;
    return {
      defiId: String(payload.defiId),
      email: String(payload.email),
      suite: String(payload.suite ?? "/fiches"),
      session: {
        id: session.id ? String(session.id) : null,
        technicien: String(session.technicien ?? ""),
        role: session.role === "admin" ? "admin" : "technicien",
      },
    };
  } catch {
    return null;
  }
}

export async function fermerDefi() {
  (await cookies()).delete(COOKIE_DEFI);
}
