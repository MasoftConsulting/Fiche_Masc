import Link from "next/link";
import { Reveler } from "@/components/reveler";
import { listerTechniciensAvecStats } from "@/lib/techniciens";
import { compterParStatut, SANS_TECHNICIEN } from "@/lib/fiches";
import { supabaseConfigure } from "@/lib/supabase";
import { CarteTechnicien } from "./carte-technicien";
import { FormulaireTechnicien } from "./formulaire-technicien";

export const dynamic = "force-dynamic";

export default async function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string }>;
}) {
  const { supprime } = await searchParams;

  if (!supabaseConfigure) {
    return (
      <div className="pt-16">
        <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9">
            <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
              Supabase n&apos;est pas connecté
            </h1>
            <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">
              Les codes des techniciens vivent dans la table{" "}
              <code className="rounded bg-ink/5 px-1.5 py-0.5">techniciens</code>. Renseignez
              d&apos;abord <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code> et
              exécutez <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [techniciens, global] = await Promise.all([
    listerTechniciensAvecStats(),
    compterParStatut(),
  ]);

  const equipe = techniciens.filter((t) => t.actif);
  // Le total du registre, pas la somme des compteurs individuels : les fiches
  // sans auteur rattaché (créées au code administrateur, ou dont le technicien
  // a été supprimé) doivent être comptées elles aussi.
  const rattachees = techniciens.reduce((somme, t) => somme + t.total, 0);
  const nonAttribuees = global.total - rattachees;
  const equipeVide = techniciens.length === 0;

  return (
    <div className="space-y-12">
      <Reveler>
        <section className="pt-8 md:pt-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Administration
              </span>
              <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
                Techniciens
                <br />
                <span className="text-ink-faint">et codes d&apos;accès</span>
              </h1>
            </div>

            <dl className="grid grid-cols-3 gap-6 border-t border-hairline pt-6 md:border-t-0 md:pt-0">
              {[
                [equipe.length, "actifs"],
                [techniciens.length - equipe.length, "désactivés"],
                [global.total, "fiches"],
              ].map(([valeur, libelle]) => (
                <div key={libelle as string}>
                  <dt className="font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em]">
                    {valeur}
                  </dt>
                  <dd className="mt-1.5 text-[0.72rem] text-ink-faint">{libelle}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveler>

      {supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Technicien supprimé. Ses fiches restent au registre, au nom qu&apos;elles portaient.
        </p>
      )}

      <Reveler delai={80}>
        <FormulaireTechnicien />
      </Reveler>

      <section className="space-y-3">
        <Reveler delai={130}>
          <h2 className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            L&apos;équipe
          </h2>
        </Reveler>

        {nonAttribuees > 0 && (
          <Reveler delai={150}>
            <Link
              href={`/fiches?technicien=${SANS_TECHNICIEN}`}
              className="group flex items-center gap-3 rounded-2xl bg-amber/[0.09] px-5 py-3.5 text-[0.83rem] text-amber transition-all duration-500 ease-mass hover:bg-amber/[0.14]"
            >
              <span>
                {nonAttribuees} fiche{nonAttribuees > 1 ? "s" : ""} sans technicien rattaché —
                saisie{nonAttribuees > 1 ? "s" : ""} au code administrateur, ou technicien supprimé
                depuis.
              </span>
              <span className="ml-auto shrink-0 transition-transform duration-500 ease-mass group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveler>
        )}

        {equipeVide ? (
          <Reveler delai={170}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
                <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
                  Aucun technicien enregistré
                </p>
                <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                  Créez le premier code ci-dessus. Tant que la liste est vide, seul le code
                  administrateur de <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>{" "}
                  ouvre la plateforme.
                </p>
              </div>
            </div>
          </Reveler>
        ) : (
          techniciens.map((technicien, index) => (
            <Reveler key={technicien.id} delai={Math.min(index, 8) * 45}>
              <CarteTechnicien technicien={technicien} />
            </Reveler>
          ))
        )}
      </section>

      <Reveler delai={60}>
        <p className="px-1 text-[0.78rem] leading-relaxed text-ink-faint">
          Un technicien ne voit que ses propres fiches. Vous, en administration, voyez celles de
          toute l&apos;équipe depuis le{" "}
          <Link href="/fiches" className="text-ink underline underline-offset-2">
            registre
          </Link>
          .
        </p>
      </Reveler>
    </div>
  );
}
