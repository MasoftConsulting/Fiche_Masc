import type { Resultat, Statut } from "@/lib/types";

export function PuceStatut({ statut }: { statut: Statut }) {
  const signee = statut === "signee";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.04em] ${
        signee ? "bg-jade/10 text-jade" : "bg-amber/10 text-amber"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${signee ? "bg-jade" : "bg-amber"}`} />
      {signee ? "Signée" : "Brouillon"}
    </span>
  );
}

export function PuceResultat({ resultat }: { resultat: Resultat | null }) {
  if (!resultat) return null;

  const styles: Record<Resultat, [string, string]> = {
    reussie: ["bg-jade/10 text-jade", "Réussie"],
    partielle: ["bg-amber/10 text-amber", "Partielle"],
    non_resolue: ["bg-rouille/10 text-rouille", "Non résolue"],
  };
  const [classe, label] = styles[resultat];

  return (
    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${classe}`}>{label}</span>
  );
}
