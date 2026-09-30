import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi d'e-mails transactionnels par SMTP.
 *
 * SMTP plutôt que l'API d'un fournisseur précis : les mêmes variables
 * fonctionnent avec Office 365, Gmail / Google Workspace, Brevo, Resend ou le
 * serveur de l'hébergeur. Changer de fournisseur ne demande aucune
 * modification de code.
 *
 * Contrairement à une simple notification, l'e-mail porte ici le code de
 * connexion : un envoi raté doit donc être signalé à l'utilisateur.
 */

type ConfigSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

function lireConfig(): ConfigSmtp | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) return null;

  // 465 est le port TLS implicite ; 587 et 25 passent par STARTTLS.
  const port = Number(process.env.SMTP_PORT || 587);

  return {
    host,
    port,
    secure: port === 465,
    user,
    password,
    from: process.env.SMTP_FROM || user,
  };
}

// Le transport est réutilisé entre les invocations d'une même instance
// serverless : rouvrir une connexion SMTP à chaque envoi coûte cher.
let transportEnCache: Transporter | null = null;

function transport(config: ConfigSmtp): Transporter {
  transportEnCache ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return transportEnCache;
}

export type Courriel = {
  a: string;
  sujet: string;
  texte: string;
  html: string;
};

export async function envoyerCourriel(courriel: Courriel): Promise<{ erreur?: string }> {
  const config = lireConfig();

  if (!config) {
    // En développement sans SMTP, on affiche le message dans la console pour
    // pouvoir tester le parcours. En production, on refuse.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] (non envoyé, SMTP non configuré) à ${courriel.a}\n${courriel.texte}`);
      return {};
    }
    return { erreur: "Envoi d'e-mail non configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)." };
  }

  try {
    await transport(config).sendMail({
      from: config.from,
      to: courriel.a,
      subject: courriel.sujet,
      text: courriel.texte,
      html: courriel.html,
    });
    return {};
  } catch (e) {
    console.error("[email] SMTP", e instanceof Error ? e.message : e);
    return { erreur: "L'e-mail n'a pas pu être envoyé. Réessayez dans un instant." };
  }
}
