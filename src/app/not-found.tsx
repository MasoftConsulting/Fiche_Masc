import Link from "next/link";

export default function Introuvable() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4">
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-10 py-14 text-center">
          <p className="font-mono text-[0.72rem] tracking-[0.14em] text-brand">404</p>
          <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.04em]">
            Fiche introuvable
          </h1>
          <p className="mt-3 text-[0.9rem] text-ink-soft">
            Elle a peut-être été supprimée, ou le lien est incomplet.
          </p>
          <Link
            href="/fiches"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
          >
            Retour au registre
          </Link>
        </div>
      </div>
    </main>
  );
}
