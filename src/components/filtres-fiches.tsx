"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";

type Valeurs = {
  q: string;
  statut: string;
  technicien: string;
  periode: string;
};

export function FiltresFiches({
  admin,
  techniciens,
  SANS_TECHNICIEN,
  valeursInitiales,
}: {
  admin: boolean;
  techniciens: { id: string; nom: string; actif: boolean }[];
  SANS_TECHNICIEN: string;
  valeursInitiales: Valeurs;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, demarrer] = useTransition();

  const [q, setQ] = useState(valeursInitiales.q);
  const [statut, setStatut] = useState(valeursInitiales.statut);
  const [technicien, setTechnicien] = useState(valeursInitiales.technicien);

  const premierRendu = useRef(true);
  useEffect(() => {
    premierRendu.current = false;
  }, []);

  /**
   * Reconstruit l'URL avec les filtres actuels.
   *
   * `periode` est un état venu de l'extérieur (les tuiles cliquables) : on le
   * préserve tel quel dans la reconstruction. Sans cela, cliquer sur la tuile
   * « ce mois-ci » puis taper dans la recherche ferait disparaître la période.
   */
  const pousser = (v: { q: string; statut: string; technicien: string }) => {
    const p = new URLSearchParams();
    if (v.q) p.set("q", v.q);
    if (v.statut) p.set("statut", v.statut);
    if (admin && v.technicien) p.set("technicien", v.technicien);
    if (valeursInitiales.periode) p.set("periode", valeursInitiales.periode);
    const qs = p.toString();
    demarrer(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  };

  useEffect(() => {
    if (premierRendu.current) return;
    const t = setTimeout(() => pousser({ q, statut, technicien }), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (premierRendu.current) return;
    pousser({ q, statut, technicien });
  }, [statut, technicien]);

  const effacer = () => {
    setQ("");
    setStatut("");
    setTechnicien("");
    demarrer(() => router.push(pathname, { scroll: false }));
  };

  const aDesFiltres = Boolean(
    q || statut || (admin && technicien) || valeursInitiales.periode,
  );

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="rounded-[1.75rem] bg-white/50 p-1.5 ring-1 ring-white/70 shadow-flottant backdrop-blur-xl"
    >
      <div
        className={`grid gap-3 rounded-[calc(1.75rem-0.375rem)] bg-surface p-4 sm:items-end ${
          admin
            ? "sm:grid-cols-[1.6fr_0.8fr_0.8fr_auto]"
            : "sm:grid-cols-[2fr_0.8fr_auto]"
        }`}
      >
        <div>
          <label className="etiquette" htmlFor="q">
            Rechercher
          </label>
          <input
            id="q"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="champ"
            placeholder="Société, n° de fiche, série, technicien…"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="etiquette" htmlFor="statut">
            Statut
          </label>
          <select
            id="statut"
            name="statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="champ"
          >
            <option value="">Tous</option>
            <option value="signee">Signées</option>
            <option value="brouillon">Brouillons</option>
          </select>
        </div>

        {admin && (
          <div>
            <label className="etiquette" htmlFor="technicien">
              Technicien
            </label>
            <select
              id="technicien"
              name="technicien"
              value={technicien}
              onChange={(e) => setTechnicien(e.target.value)}
              className="champ"
            >
              <option value="">Tous les techniciens</option>
              {techniciens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                  {t.actif ? "" : " (inactif)"}
                </option>
              ))}
              <option value={SANS_TECHNICIEN}>Non attribuées</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          {pending && (
            <span
              aria-live="polite"
              className="flex items-center gap-2 rounded-full bg-ink/5 px-4 py-3 text-[0.82rem] text-ink-soft"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Filtrage…
            </span>
          )}
          {!pending && aDesFiltres && (
            <button
              type="button"
              onClick={effacer}
              className="rounded-full px-4 py-3 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
            >
              Effacer
            </button>
          )}
        </div>
      </div>
    </form>
  );
}