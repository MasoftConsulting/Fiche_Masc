import Link from "next/link";

export function Pagination({
  page,
  pages,
  construireLien,
}: {
  page: number;
  pages: number;
  construireLien: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const estPremiere = page === 1;
  const estDerniere = page === pages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 pt-6"
    >
      <Link
        href={construireLien(page - 1)}
        aria-disabled={estPremiere}
        tabIndex={estPremiere ? -1 : undefined}
        className={`rounded-full px-4 py-2 text-[0.82rem] transition-all duration-500 ease-mass ${
          estPremiere
            ? "pointer-events-none text-ink-faint/50"
            : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        }`}
      >
        ← Précédent
      </Link>

      <span className="rounded-full bg-ink/[0.05] px-4 py-2 font-mono text-[0.78rem] text-ink-soft">
        {page} / {pages}
      </span>

      <Link
        href={construireLien(page + 1)}
        aria-disabled={estDerniere}
        tabIndex={estDerniere ? -1 : undefined}
        className={`rounded-full px-4 py-2 text-[0.82rem] transition-all duration-500 ease-mass ${
          estDerniere
            ? "pointer-events-none text-ink-faint/50"
            : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        }`}
      >
        Suivant →
      </Link>
    </nav>
  );
}