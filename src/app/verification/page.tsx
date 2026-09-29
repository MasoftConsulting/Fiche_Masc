import { redirect } from "next/navigation";
import { lireSessionEnAttente } from "@/lib/session";
import { aUnCodeEnAttente } from "@/lib/mfa";
import { Reveler } from "@/components/reveler";
import { FormulaireVerification } from "./formulaire-verification";

export const dynamic = "force-dynamic";

/**
 * Masque une adresse email en gardant les 2 premiers caractères du local et
 * la première lettre du domaine : "support@masoft.tg" → "su*****@m*****.tg".
 * Assez pour que l'utilisateur reconnaisse la sienne, pas assez pour la
 * divulguer à un tiers qui aurait volé un lien.
 */
function masquerEmail(email: string): string {
  const [local, domaine] = email.split("@");
  if (!local || !domaine) return "•••••";

  const localMasque = local.length > 2 ? `${local.slice(0, 2)}${"•".repeat(5)}` : "•".repeat(5);
  const [domaineNom, ...domaineReste] = domaine.split(".");
  const domaineMasque = `${domaineNom[0]}${"•".repeat(5)}${domaineReste.length ? `.${domaineReste.join(".")}` : ""}`;

  return `${localMasque}@${domaineMasque}`;
}

export default async function PageVerification({
  searchParams,
}: {
  searchParams: Promise<{ renvoye?: string; erreur?: string }>;
}) {
  const enAttente = await lireSessionEnAttente();
  if (!enAttente) redirect("/connexion?expire=1");

  // Si le code a déjà expiré côté base (mais que le cookie court est encore
  // valide), on renvoie vers la page de connexion : l'utilisateur doit
  // refaire l'étape 1 pour recevoir un nouveau code.
  const actif = await aUnCodeEnAttente(enAttente.id);
  if (!actif) redirect("/connexion?expire=1");

  const { renvoye, erreur } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveler>
        <header className="mb-8 text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-faint">
            Étape 2 sur 2
          </p>
          <h1 className="mt-4 font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em]">
            Vérification
          </h1>
          <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
            Un code à 6 chiffres a été envoyé à{" "}
            <strong className="font-medium text-ink">
              {masquerEmail(enAttente.email)}
            </strong>
            .
          </p>
        </header>
      </Reveler>

      {renvoye && (
        <p className="mb-4 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Un nouveau code vous a été envoyé.
        </p>
      )}

      {erreur === "envoi" && (
        <p className="mb-4 rounded-2xl bg-rouille/10 px-5 py-3.5 text-[0.85rem] text-rouille">
          Impossible d&apos;envoyer un nouveau code. Réessayez dans un instant.
        </p>
      )}

      <Reveler delai={80}>
        <FormulaireVerification technicien={enAttente.technicien} />
      </Reveler>
    </main>
  );
}