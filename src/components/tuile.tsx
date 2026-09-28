import Link from "next/link";
import type { ReactNode } from "react";

type Ton = "jade" | "amber" | "rouille";

export function Tuile({
  valeur,
  libelle,
  note,
  ton,
  large = false,
  className = "",
  href,
  actif = false,
  icone,
}: {
  valeur: number | string;
  libelle: string;
  note?: string;
  ton?: Ton;
  large?: boolean;
  className?: string;
  /** Si fourni, la tuile devient un lien cliquable. */
  href?: string;
  /** Met en évidence la tuile correspondant au filtre actif. */
  actif?: boolean;
  /** Petit pictogramme optionnel en haut à droite. */
  icone?: ReactNode;
}) {
  const couleur =
    ton === "jade"
      ? "text-jade"
      : ton === "amber"
        ? "text-amber"
        : ton === "rouille"
          ? "text-rouille"
          : "text-ink";

  const contenu = (
    <div
      className={`flex h-full flex-col justify-between rounded-[calc(1.6rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ${
        large ? "px-7 py-8" : "px-5 py-6"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`font-display font-semibold tracking-[-0.045em] ${couleur} ${
            large ? "text-[3.4rem] leading-none" : "text-[2.1rem] leading-none"
          }`}
        >
          {valeur}
        </p>
        {icone && <span className="text-ink-faint">{icone}</span>}
      </div>
      <div className="mt-5">
        <p className="text-[0.8rem] font-medium text-ink">{libelle}</p>
        {note && <p className="mt-1 text-[0.72rem] text-ink-faint">{note}</p>}
      </div>
    </div>
  );

  // Tuile non cliquable : même rendu qu'avant, aucun changement.
  if (!href) {
    return (
      <div className={`rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 ${className}`}>
        {contenu}
      </div>
    );
  }

  // Tuile cliquable : anneau coloré si c'est le filtre actif, hover sinon.
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`group block rounded-[1.6rem] p-1.5 ring-1 transition-all duration-500 ease-mass active:scale-[0.98] ${
        actif
          ? "bg-white/70 ring-brand/40 shadow-souleve"
          : "bg-white/45 ring-white/60 hover:bg-white/80 hover:ring-white/90 hover:shadow-souleve"
      } ${className}`}
    >
      <div className="relative h-full">
        {contenu}
        {/* Petite flèche en bas à droite qui apparaît au survol — signale
            sans ambiguïté que la tuile est cliquable. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-4 bottom-4 grid h-7 w-7 place-items-center rounded-full bg-ink/[0.06] text-ink-soft transition-all duration-500 ease-mass group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:bg-ink group-hover:text-white ${
            actif ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10" />
          </svg>
        </span>
      </div>
    </Link>
  );
}