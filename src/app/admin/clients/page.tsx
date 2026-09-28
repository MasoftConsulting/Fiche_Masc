import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireSessionAdmin } from "@/lib/session";
import { listerClientsAvecStats } from "@/lib/clients";
import { supabaseConfigure } from "@/lib/supabase";
import { CarteClient } from "./carte-client";
import { FormulaireClient } from "./formulaire-client";

export const dynamic = "force-dynamic";

export default async function PageClients({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string }>;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const { supprime } = await searchParams;

  if (!supabaseConfigure) {
    return (
      <div className="pt-16 text-[0.9rem] text-ink-soft">
        Supabase n&apos;est pas configuré.
      </div>
    );
  }

  const clients = await listerClientsAvecStats();
  const totalEquipements = clients.reduce((s, c) => s + c.nb_equipements, 0);

  return (
    <div className="space-y-12">
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 3.5 5 8l4.5 4.5" />
            </svg>
            Administration
          </Link>

          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Référentiel
              </span>
              <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
                Clients
                <br />
                <span className="text-ink-faint">& équipements</span>
              </h1>
            </div>

            <dl className="grid grid-cols-2 gap-6 border-t border-hairline pt-6 md:border-t-0 md:pt-0">
              <div>
                <dt className="font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em]">
                  {clients.length}
                </dt>
                <dd className="mt-1.5 text-[0.72rem] text-ink-faint">clients</dd>
              </div>
              <div>
                <dt className="font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em]">
                  {totalEquipements}
                </dt>
                <dd className="mt-1.5 text-[0.72rem] text-ink-faint">équipements</dd>
              </div>
            </dl>
          </div>
        </header>
      </Reveler>

      {supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Client supprimé. Ses équipements ont été retirés, ses fiches restent au registre.
        </p>
      )}

      <Reveler delai={80}>
        <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
          <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
            <header className="mb-7 flex items-baseline gap-4 border-b border-hairline pb-5">
              <span className="font-mono text-[0.7rem] text-brand">+</span>
              <div>
                <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                  Ajouter un client
                </h2>
                <p className="mt-1 text-[0.76rem] text-ink-faint">
                  Le nom doit être unique. Il apparaîtra dans la liste déroulante des fiches.
                </p>
              </div>
            </header>
            <FormulaireClient />
          </div>
        </section>
      </Reveler>

      <section className="space-y-3">
        <Reveler delai={140}>
          <h2 className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </h2>
        </Reveler>

        {clients.length === 0 ? (
          <Reveler delai={160}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
                <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
                  Aucun client enregistré
                </p>
                <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                  Créez votre premier client ci-dessus. Les techniciens le trouveront
                  ensuite dans la liste déroulante des fiches.
                </p>
              </div>
            </div>
          </Reveler>
        ) : (
          clients.map((client, index) => (
            <Reveler key={client.id} delai={Math.min(index, 8) * 45}>
              <CarteClient client={client} />
            </Reveler>
          ))
        )}
      </section>
    </div>
  );
}