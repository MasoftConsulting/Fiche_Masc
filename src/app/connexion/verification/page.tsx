import { redirect } from "next/navigation";
import { LogoComplet } from "@/components/marque";
import { masquerEmail } from "@/lib/double-authentification";
import { lireDefi, lireSession } from "@/lib/session";
import { FormulaireVerification } from "./formulaire";

export default async function PageVerification() {
  if (await lireSession()) redirect("/fiches");

  // Sans identité en attente (cookie absent ou expiré), retour à la première
  // étape.
  const defi = await lireDefi();
  if (!defi) redirect("/connexion?expire=1");

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10 md:px-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white/45 p-2 ring-1 ring-white/70 shadow-souleve backdrop-blur-xl">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-9">
          <div className="mb-8">
            <LogoComplet largeur={124} priority />
            <p className="mt-5 text-[0.6rem] uppercase tracking-[0.2em] text-ink-faint">
              MA SOFT CONSULTING · Vérification
            </p>
          </div>

          <h1 className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink">
            Code envoyé par e-mail
          </h1>
          <p className="mt-2 mb-7 text-[0.85rem] leading-relaxed text-ink-soft">
            Bonjour {defi.session.technicien}. Saisissez le code à 6 chiffres
            envoyé à <span className="font-medium text-ink">{masquerEmail(defi.email)}</span>.
            Il est valable 10 minutes.
          </p>

          <FormulaireVerification />
        </div>
      </section>
    </main>
  );
}
