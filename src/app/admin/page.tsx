import Link from "next/link";
import { Reveler } from "@/components/reveler";
import { listerTechniciensAvecStats } from "@/lib/techniciens";
import { compterParStatut, SANS_TECHNICIEN } from "@/lib/fiches";
import { supabaseConfigure } from "@/lib/supabase";
import { CarteTechnicien } from "./carte-technicien";
import { FormulaireTechnicien } from "./formulaire-technicien";

export const dynamic = "force-dynamic";

type Filtre = "actifs" | "inactifs";

export default async function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string; filtre?: string }>;
}) {
  const { supprime, filtre } = await searchParams;

  if (!supabaseConfigure) {
    return (
      <div className="pt-16">
        <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
          <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9">
            <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
              Supabase n&apos;est pas connecté
            </h1>
            <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">
              Les codes des techniciens vivent dans la table{" "}
              <code className="rounded bg-ink/5 px-1.5 py-0.5">techniciens</code>. Renseignez
              d&apos;abord <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code> et
              exécutez <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [techniciens, global] = await Promise.all([
    listerTechniciensAvecStats(),
    compterParStatut(),
  ]);

  const equipe = techniciens.filter((t) => t.actif);
  const inactifs = techniciens.filter((t) => !t.actif);
  const rattachees = techniciens.reduce((somme, t) => somme + t.total, 0);
  const nonAttribuees = global.total - rattachees;

  // Onglet sélectionné : "actifs" par défaut, "inactifs" si l'URL le demande.
  // Un technicien désactivé n'a pas sa place dans la vue « actifs » ; c'est
  // exactement le sens du filtre.
  const onglet: Filtre = filtre === "inactifs" ? "inactifs" : "actifs";
  const affiches = onglet === "actifs" ? equipe : inactifs;

  const listeGlobaleVide = techniciens.length === 0;

  return (
    <div className="space-y-12">
      <Reveler>
        <section className="pt-8 md:pt-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Administration
              </span>
              <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
                Techniciens
                <br />
                <span className="text-ink-faint">et codes d&apos;accès</span>
              </h1>
            </div>

            {/* Tuiles statistiques cliquables. Chacune mène à la vue
                correspondante : les deux premières basculent l'onglet de la
                liste, la troisième ouvre le registre filtré sur toutes les
                fiches de la plateforme. */}
            <div className="grid grid-cols-3 gap-6 border-t border-hairline pt-6 md:border-t-0 md:pt-0">
              <StatLien
                href="/admin?filtre=actifs"
                actif={onglet === "actifs"}
                valeur={equipe.length}
                libelle="actifs"
              />
              <StatLien
                href="/admin?filtre=inactifs"
                actif={onglet === "inactifs"}
                valeur={inactifs.length}
                libelle="désactivés"
              />
              <StatLien
                href="/fiches"
                valeur={global.total}
                libelle="fiches"
              />
            </div>
          </div>
        </section>
      </Reveler>

      {supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Technicien supprimé. Ses fiches restent au registre, au nom qu&apos;elles portaient.
        </p>
      )}

      <Reveler delai={80}>
        <FormulaireTechnicien />
      </Reveler>

      <section className="space-y-3">
        <Reveler delai={130}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              L&apos;équipe
            </h2>

            {/* Onglets : actifs / désactivés. Un seul endroit où basculer,
                plutôt qu'un chip de filtre comme sur /fiches — ici le choix
                est binaire et permanent. */}
            {!listeGlobaleVide && (
              <OngletsEquipe
                actif={onglet}
                nbActifs={equipe.length}
                nbInactifs={inactifs.length}
              />
            )}
          </div>
        </Reveler>

        {nonAttribuees > 0 && (
          <Reveler delai={150}>
            <Link
              href={`/fiches?technicien=${SANS_TECHNICIEN}`}
              className="group flex items-center gap-3 rounded-2xl bg-amber/[0.09] px-5 py-3.5 text-[0.83rem] text-amber transition-all duration-500 ease-mass hover:bg-amber/[0.14]"
            >
              <span>
                {nonAttribuees} fiche{nonAttribuees > 1 ? "s" : ""} sans technicien rattaché —
                saisie{nonAttribuees > 1 ? "s" : ""} au code administrateur, ou technicien supprimé
                depuis.
              </span>
              <span className="ml-auto shrink-0 transition-transform duration-500 ease-mass group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveler>
        )}

        {listeGlobaleVide ? (
          <Reveler delai={170}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
                <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
                  Aucun technicien enregistré
                </p>
                <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                  Créez le premier code ci-dessus. Tant que la liste est vide, seul le code
                  administrateur de <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>{" "}
                  ouvre la plateforme.
                </p>
              </div>
            </div>
          </Reveler>
        ) : affiches.length === 0 ? (
          <Reveler delai={170}>
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
                <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
                  {onglet === "inactifs"
                    ? "Aucun compte désactivé"
                    : "Aucun technicien actif"}
                </p>
                <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                  {onglet === "inactifs"
                    ? "Tous les comptes de l'équipe sont actuellement en service."
                    : "Créez un compte ci-dessus, ou réactivez quelqu'un depuis l'onglet Désactivés."}
                </p>
                <Link
                  href={`/admin?filtre=${onglet === "inactifs" ? "actifs" : "inactifs"}`}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink/5 px-5 py-2.5 text-[0.83rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/10"
                >
                  {onglet === "inactifs"
                    ? "Voir les techniciens actifs"
                    : "Voir les comptes désactivés"}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Reveler>
        ) : (
          affiches.map((technicien, index) => (
            <Reveler key={technicien.id} delai={Math.min(index, 8) * 45}>
              <CarteTechnicien technicien={technicien} />
            </Reveler>
          ))
        )}
      </section>

      <Reveler delai={60}>
        <p className="px-1 text-[0.78rem] leading-relaxed text-ink-faint">
          Un technicien ne voit que ses propres fiches. Vous, en administration, voyez celles de
          toute l&apos;équipe depuis le{" "}
          <Link href="/fiches" className="text-ink underline underline-offset-2">
            registre
          </Link>
          .
        </p>
      </Reveler>

      <Reveler delai={60}>
        <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
          <div className="flex flex-col gap-5 rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                Sauvegarde de la base
              </h2>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink-soft">
                Télécharge un fichier JSON contenant toutes les données : techniciens, clients,
                équipements, fiches avec leurs signatures, et journal. Conservez-le hors de la
                plateforme (disque, cloud de l&apos;entreprise) et renouvelez-le chaque semaine.
                Il contient des données clients : ne le partagez pas.
              </p>
            </div>
            {/* Lien simple plutôt que Link : c'est un téléchargement, pas une
                navigation dans l'application. */}
            <a
              href="/admin/sauvegarde"
              download
              className="shrink-0 rounded-full bg-ink px-6 py-3 text-center text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
            >
              Télécharger la sauvegarde
            </a>
          </div>
        </section>
      </Reveler>
    </div>
  );
}

/* --------------------------------------------------------- sous-composants */

/**
 * Tuile statistique cliquable du header.
 *
 * La mise en évidence suit la même règle que sur /fiches : la valeur passe en
 * couleur `brand` quand la tuile correspond au filtre actif, et prend cette
 * couleur au survol sinon — sans jamais crier, puisque ces tuiles restent
 * secondaires par rapport au titre.
 */
function StatLien({
  href,
  actif = false,
  valeur,
  libelle,
}: {
  href: string;
  actif?: boolean;
  valeur: number;
  libelle: string;
}) {
  return (
    <Link href={href} className="group block">
      <p
        className={`font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em] transition-colors duration-500 ease-mass ${
          actif
            ? "text-brand"
            : "text-ink group-hover:text-brand"
        }`}
      >
        {valeur}
      </p>
      <p
        className={`mt-1.5 text-[0.72rem] transition-colors duration-500 ease-mass ${
          actif ? "text-brand/80" : "text-ink-faint group-hover:text-ink"
        }`}
      >
        {libelle}
        {actif && (
          <span aria-hidden="true" className="ml-1.5">
            ●
          </span>
        )}
      </p>
    </Link>
  );
}

/**
 * Onglets Actifs / Désactivés.
 *
 * Pattern « segmented control » classique : un fond commun, un indicateur
 * blanc qui glisse sur l'onglet courant. Le compteur entre parenthèses évite
 * de devoir revenir sur la page pour savoir combien il y en a de chaque côté.
 */
function OngletsEquipe({
  actif,
  nbActifs,
  nbInactifs,
}: {
  actif: Filtre;
  nbActifs: number;
  nbInactifs: number;
}) {
  const onglets: { cle: Filtre; label: string; compte: number }[] = [
    { cle: "actifs", label: "Actifs", compte: nbActifs },
    { cle: "inactifs", label: "Désactivés", compte: nbInactifs },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filtrer l'équipe"
      className="inline-flex items-center gap-1 rounded-full bg-ink/[0.04] p-1"
    >
      {onglets.map((o) => {
        const estActif = actif === o.cle;
        return (
          <Link
            key={o.cle}
            href={`/admin?filtre=${o.cle}`}
            role="tab"
            aria-selected={estActif}
            className={`rounded-full px-4 py-2 text-[0.78rem] font-medium transition-all duration-500 ease-mass ${
              estActif
                ? "bg-surface text-ink shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
            <span
              className={`ml-1.5 font-mono text-[0.72rem] ${
                estActif ? "text-ink-soft" : "text-ink-faint"
              }`}
            >
              {o.compte}
            </span>
          </Link>
        );
      })}
    </div>
  );
}