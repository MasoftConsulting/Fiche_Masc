"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./marque";
import { initiales } from "@/lib/format";

const LIENS = [
  { href: "/fiches", label: "Fiches" },
  { href: "/fiches/nouvelle", label: "Nouvelle fiche" },
];

/** L'administration n'apparaît que pour qui peut y entrer. */
const LIEN_ADMIN = { href: "/admin", label: "Techniciens" };

/**
 * Barre flottante détachée du haut de page. Sur mobile, le menu s'ouvre en
 * plein écran avec révélation décalée des liens.
 */
export function Navigation({
  technicien,
  role,
  deconnexion,
}: {
  technicien: string;
  role: string;
  deconnexion: () => Promise<void>;
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const liens = role === "admin" ? [...LIENS, LIEN_ADMIN] : LIENS;

  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  const actif = (href: string) =>
    href === "/fiches" ? chemin === "/fiches" : chemin.startsWith(href);

  return (
    <>
      <header
        className="sticky top-0 z-30 px-4 pt-5 pb-2 print:hidden"
        // La page peint sous l'encoche : on repousse la barre en dessous.
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center gap-3 rounded-full border border-white/60 bg-white/70 p-2 pl-3 shadow-flottant backdrop-blur-2xl">
          <Link href="/fiches" className="flex items-center gap-2.5 pr-2">
            <Logo taille={34} priority />
            <span className="hidden font-display text-[0.9rem] font-semibold tracking-[-0.02em] sm:block">
              MA SOFT
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {liens.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className={`rounded-full px-4 py-2 text-[0.85rem] font-medium transition-all duration-500 ease-mass ${
                  actif(lien.href)
                    ? "bg-ink text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {lien.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2.5 rounded-full bg-ink/[0.04] py-1.5 pr-4 pl-1.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[0.65rem] font-semibold text-white">
                {initiales(technicien)}
              </span>
              <span className="text-[0.8rem] font-medium text-ink-soft">
                {technicien}
                {role === "admin" && (
                  <span className="ml-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-brand">
                    admin
                  </span>
                )}
              </span>
            </div>

            <form action={deconnexion} className="hidden md:block">
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-[0.8rem] font-medium text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink active:scale-[0.97]"
              >
                Quitter
              </button>
            </form>

            {/* Hamburger : les deux barres pivotent pour former une croix. */}
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={ouvert}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-ink/[0.04] transition-all duration-500 ease-mass hover:bg-ink/[0.08] active:scale-[0.95] md:hidden"
            >
              <span
                className={`absolute h-[1.5px] w-4 rounded-full bg-ink transition-all duration-500 ease-mass ${
                  ouvert ? "rotate-45" : "-translate-y-[3.5px]"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-4 rounded-full bg-ink transition-all duration-500 ease-mass ${
                  ouvert ? "-rotate-45" : "translate-y-[3.5px]"
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Voile plein écran. Toujours monté pour que la fermeture s'anime. */}
      <div
        className={`fixed inset-0 z-20 bg-white/85 backdrop-blur-3xl transition-all duration-700 ease-mass md:hidden print:hidden ${
          ouvert ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col justify-center px-8">
          {liens.map((lien, index) => (
            <Link
              key={lien.href}
              href={lien.href}
              // Le menu se referme au clic : plus fiable que de réagir au
              // changement d'URL, et sans setState dans un effet.
              onClick={() => setOuvert(false)}
              className={`border-b border-hairline py-6 font-display text-[2rem] font-semibold tracking-[-0.03em] transition-all duration-700 ease-mass ${
                ouvert ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
              }`}
              style={{ transitionDelay: `${ouvert ? 90 + index * 60 : 0}ms` }}
            >
              {lien.label}
            </Link>
          ))}

          <form
            action={deconnexion}
            className={`mt-10 transition-all duration-700 ease-mass ${
              ouvert ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
            style={{ transitionDelay: `${ouvert ? 240 : 0}ms` }}
          >
            <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-ink-faint">
              Connecté · {technicien}
            </p>
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-white active:scale-[0.98]"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
