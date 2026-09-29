import Link from "next/link";
import { LogoComplet } from "@/components/marque";

export const metadata = { title: "Hors ligne · Fiches MASC" };

/**
 * Page de secours servie par le service worker quand le réseau manque.
 *
 * Elle doit rester statique et publique : le service worker la met en cache à
 * l'installation, bien avant qu'une session existe.
 */
export default function HorsLigne() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-16">
      <div className="w-full max-w-md rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-7 py-12 text-center">
          <div className="flex justify-center">
            <LogoComplet largeur={104} priority />
          </div>

          <h1 className="mt-9 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.04em]">
            Pas de réseau
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-[0.9rem] leading-relaxed text-ink-soft">
            Les fiches sont enregistrées sur le serveur : il faut une connexion
            pour les ouvrir et les signer. Réessayez dès que le réseau revient.
          </p>

          {/* `prefetch={false}` : précharger depuis une page servie parce que le
              réseau est tombé n'aurait aucun sens. */}
          <Link
            href="/fiches"
            prefetch={false}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
          >
            Réessayer
          </Link>
        </div>
      </div>
    </main>
  );
}
