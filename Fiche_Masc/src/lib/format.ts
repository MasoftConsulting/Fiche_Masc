/** Formats d'affichage — français, fuseau local. */

export function formaterDate(valeur: string | null | undefined) {
  if (!valeur) return "—";
  // Les colonnes `date` arrivent en "AAAA-MM-JJ" : on découpe plutôt que de
  // passer par Date(), qui interpréterait la chaîne en UTC et décalerait d'un
  // jour à l'ouest de Greenwich.
  const [a, m, j] = valeur.slice(0, 10).split("-");
  if (!a || !m || !j) return valeur;
  return `${j}/${m}/${a}`;
}

export function formaterDateHeure(valeur: string | null | undefined) {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "08:30" + "11:45" → "3 h 15". Retourne null si l'une des heures manque. */
export function dureeIntervention(arrivee: string | null, depart: string | null) {
  if (!arrivee || !depart) return null;
  const [ha, ma] = arrivee.split(":").map(Number);
  const [hd, md] = depart.split(":").map(Number);
  if ([ha, ma, hd, md].some((n) => Number.isNaN(n))) return null;

  let minutes = hd * 60 + md - (ha * 60 + ma);
  // Intervention à cheval sur minuit : on ajoute une journée plutôt que
  // d'afficher une durée négative.
  if (minutes < 0) minutes += 24 * 60;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function initiales(nom: string | null | undefined) {
  if (!nom) return "??";
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
}
