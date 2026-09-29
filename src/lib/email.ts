import "server-only";

/**
 * Envoi d'emails transactionnels via Resend.
 *
 * Volontairement minimal : une seule fonction, un seul fournisseur. Si un
 * jour on change (Postmark, Brevo…), tout passe par ce fichier.
 *
 * Ne jette jamais : l'appelant reçoit { ok: true } ou { erreur }. C'est la
 * logique métier (MFA, notifications…) qui décide comment réagir.
 */

const API_RESEND = "https://api.resend.com/emails";

/**
 * Adresse d'expédition.
 *
 * Tant que le domaine n'est pas vérifié sur Resend, on utilise l'adresse
 * par défaut `onboarding@resend.dev`. Une fois le domaine mascos.tg vérifié,
 * il suffira de changer cette constante.
 */
const EXPEDITEUR = "MA SOFT <onboarding@resend.dev>";

export type ResultatEmail = { ok: true } | { erreur: string };

export async function envoyerEmail({
  destinataire,
  sujet,
  texte,
  html,
}: {
  destinataire: string;
  sujet: string;
  texte: string;
  html?: string;
}): Promise<ResultatEmail> {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    console.error("[email] RESEND_API_KEY manquant");
    return { erreur: "Envoi d'email non configuré." };
  }

  try {
    const reponse = await fetch(API_RESEND, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cle}`,
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: destinataire,
        subject: sujet,
        text: texte,
        html: html ?? undefined,
      }),
    });

    if (!reponse.ok) {
      const corps = await reponse.text().catch(() => "(illisible)");
      console.error("[email] Resend a renvoyé", reponse.status, corps);
      return { erreur: `Envoi refusé par Resend (${reponse.status}).` };
    }

    return { ok: true };
  } catch (e) {
    console.error("[email] exception réseau", e);
    return { erreur: "Impossible de joindre le service d'email." };
  }
}