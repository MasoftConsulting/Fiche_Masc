import { redirect } from "next/navigation";
import { LogoComplet } from "@/components/marque";
import { lireSession, sessionConfiguree } from "@/lib/session";
import { FormulaireConnexion } from "./formulaire";

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  if (await lireSession()) redirect("/fiches");

  const { suite } = await searchParams;
  const configure = sessionConfiguree();

  return (
    <main className="min-h-[100dvh] px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:min-h-[80vh] md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        {/* Bloc éditorial */}
        <section>
        

          <h1 className="mt-7 font-display text-[2.9rem] leading-[0.94] font-semibold tracking-[-0.045em] text-ink sm:text-[4rem] md:text-[4.9rem]">
            La fiche
            <br />
            d&apos;intervention,
            <br />
            <span className="text-ink-faint">sans papier.</span>
          </h1>

          <p className="mt-8 max-w-md text-[1rem] leading-relaxed text-ink-soft">
            Saisie sur site, compteurs relevés, signature du client au doigt, puis
            impression à l&apos;identique du document officiel MA SOFT CONSULTING.
          </p>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-hairline pt-8">
            {[
              ["9", "sections du document"],
              ["2", "signatures manuscrites"],
              ["A4", "impression conforme"],
            ].map(([valeur, libelle]) => (
              <div key={libelle}>
                <dt className="font-display text-[1.9rem] font-semibold tracking-[-0.03em] text-ink">
                  {valeur}
                </dt>
                <dd className="mt-1 text-[0.72rem] leading-snug text-ink-faint">{libelle}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Carte de connexion — coque + cœur concentriques */}
        <section className="rounded-[2rem] bg-white/45 p-2 ring-1 ring-white/70 shadow-souleve backdrop-blur-xl">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-9">
            <div className="mb-8">
              <LogoComplet largeur={124} priority />
              <p className="mt-5 text-[0.6rem] uppercase tracking-[0.2em] text-ink-faint">
                MA SOFT CONSULTING · Accès technicien
              </p>
            </div>

            {configure ? (
              <FormulaireConnexion suite={suite ?? "/fiches"} />
            ) : (
              <div className="space-y-3 text-[0.85rem] leading-relaxed text-ink-soft">
                <p className="font-medium text-ink">Configuration incomplète</p>
                <p>
                  Créez un fichier <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>{" "}
                  à partir de <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local.example</code>,
                  puis renseignez au minimum :
                </p>
                <ul className="space-y-1.5 pl-4 text-[0.8rem]">
                  <li className="list-disc">CODE_ADMIN</li>
                  <li className="list-disc">SESSION_SECRET (32 caractères minimum)</li>
                  <li className="list-disc">NEXT_PUBLIC_SUPABASE_URL</li>
                  <li className="list-disc">SUPABASE_SERVICE_ROLE_KEY</li>
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
