"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Éléments communs aux pages globales du référentiel (équipements, contacts) :
 * l'en-tête et le filtre par client.
 */

export function EnTeteReferentiel({
  titre,
  sousTitre,
  total,
  libelle,
}: {
  titre: string;
  sousTitre: string;
  total: number;
  libelle: string;
}) {
  return (
    <header className="pt-8 md:pt-14">
      <Link
        href="/admin/clients"
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
        Clients
      </Link>

      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Référentiel
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            {titre}
            <br />
            <span className="text-ink-faint">{sousTitre}</span>
          </h1>
        </div>

        <div className="border-t border-hairline pt-6 md:border-t-0 md:pt-0">
          <p className="font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em]">
            {total}
          </p>
          <p className="mt-1.5 text-[0.72rem] text-ink-faint">{libelle}</p>
        </div>
      </div>
    </header>
  );
}

/** Filtre par client, porté par l'URL (?client=) pour rester partageable. */
export function FiltreClient({
  clients,
  valeur,
}: {
  clients: { id: string; nom: string }[];
  valeur?: string;
}) {
  const router = useRouter();
  const chemin = usePathname();

  return (
    <label className="block max-w-sm">
      <span className="etiquette">Filtrer par client</span>
      <select
        className="champ"
        value={valeur ?? ""}
        onChange={(e) =>
          router.push(e.target.value ? `${chemin}?client=${e.target.value}` : chemin)
        }
      >
        <option value="">Tous les clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>
    </label>
  );
}
