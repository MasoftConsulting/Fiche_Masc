import Link from "next/link";
import { formaterDate } from "@/lib/format";
import type { ClientAvecStats } from "@/lib/clients";

export function CarteClient({ client }: { client: ClientAvecStats }) {
  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className="group block rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-700 ease-mass hover:bg-white/80 hover:shadow-souleve"
    >
      <article className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[1.25rem] font-semibold tracking-[-0.03em]">
              {client.nom}
            </h3>
            <p className="mt-1 truncate text-[0.82rem] text-ink-soft">
              {[client.adresse, client.contact].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-ink-faint">
              {client.telephone && <span>☎ {client.telephone}</span>}
              {client.email && <span>{client.email}</span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5 text-center">
            <Compte valeur={client.nb_equipements} libelle="équipements" />
            <Compte valeur={client.nb_fiches} libelle="fiches" />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/[0.05] text-ink-soft transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:bg-ink group-hover:text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10" />
              </svg>
            </span>
          </div>
        </div>

        {client.derniere_fiche && (
          <p className="mt-4 border-t border-hairline pt-3 text-[0.72rem] text-ink-faint">
            Dernière intervention · {formaterDate(client.derniere_fiche)}
          </p>
        )}
      </article>
    </Link>
  );
}

function Compte({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div>
      <p className="font-display text-[1.35rem] leading-none font-semibold tracking-[-0.04em]">
        {valeur}
      </p>
      <p className="mt-1 text-[0.62rem] text-ink-faint">{libelle}</p>
    </div>
  );
}