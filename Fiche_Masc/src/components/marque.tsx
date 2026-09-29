import Image from "next/image";
import symbole from "../../public/masc-symbole.png";
import lockup from "../../public/masc-logo.png";

/**
 * Marque MASC Data Insight.
 *
 * Deux déclinaisons du même fichier : le symbole seul dès que la place manque
 * (le mot-clé « DATA Insight » devient illisible en dessous de ~90 px), le
 * lockup complet quand il y a de quoi le poser.
 *
 * `priority` sur les usages visibles au premier écran : le logo ne doit pas
 * apparaître après coup dans une barre déjà dessinée.
 */
export function Logo({
  taille = 40,
  className = "",
  priority = false,
}: {
  taille?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={symbole}
      alt="MASC Data Insight"
      width={taille}
      height={Math.round((taille * 633) / 794)}
      className={className}
      priority={priority}
    />
  );
}

export function LogoComplet({
  largeur = 150,
  className = "",
  priority = false,
}: {
  largeur?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={lockup}
      alt="MASC Data Insight"
      width={largeur}
      height={Math.round((largeur * 845) / 794)}
      className={className}
      priority={priority}
    />
  );
}

export function Signature({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo taille={compact ? 34 : 44} />
      <div className="leading-none">
        <p
          className={`font-display font-semibold tracking-[-0.02em] text-ink ${
            compact ? "text-[0.95rem]" : "text-[1.1rem]"
          }`}
        >
          MA SOFT CONSULTING
        </p>
        <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ink-faint">
          Fiches d&apos;intervention
        </p>
      </div>
    </div>
  );
}
