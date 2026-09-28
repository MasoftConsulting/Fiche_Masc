/** Modèle de la fiche d'intervention MA SOFT CONSULTING (papier → écran). */

export type Statut = "brouillon" | "signee";
export type Resultat = "reussie" | "partielle" | "non_resolue";

export type Fiche = {
  id: string;
  numero: string;
  date_intervention: string | null;
  heure_arrivee: string | null;
  heure_depart: string | null;
  facturable: string | null;

  /**
   * Champs de snapshot : recopiés au moment de l'intervention depuis le
   * référentiel client. Ils ne sont jamais mis à jour quand le client est
   * renommé plus tard — une fiche signée reste la preuve de ce qui a été
   * signé, avec les valeurs de l'époque.
   */
  societe: string | null;
  adresse: string | null;
  contact: string | null;
  telephone: string | null;
  email: string | null;

  /**
   * Référence vers le client du référentiel. Nullable : les fiches créées
   * avant la mise en place des clients n'y sont pas rattachées, et la
   * suppression d'un client fait retomber ce champ à null sans toucher aux
   * colonnes texte ci-dessus.
   */
  client_id: string | null;

  /** Nom figé, tel qu'il s'imprime sur la fiche. */
  technicien: string | null;
  /** Auteur de la fiche, pour le cloisonnement et les statistiques. */
  technicien_id: string | null;

  types: string[];
  type_autre: string | null;

  /**
   * Champs de snapshot : recopiés depuis l'équipement sélectionné au moment
   * de l'intervention. Même logique que pour le client.
   */
  marque_modele: string | null;
  numero_serie: string | null;
  adresse_ip: string | null;
  localisation: string | null;

  /**
   * Référence vers l'équipement concerné. Nullable pour les mêmes raisons que
   * `client_id`.
   */
  equipement_id: string | null;

  compteur_nb: string | null;
  compteur_nb_valide: boolean;
  compteur_couleur: string | null;
  compteur_couleur_valide: boolean;

  detail: string | null;

  resultat: Resultat | null;
  commentaires: string | null;

  tests: string[];
  tests_autres: string | null;

  recommandations: string | null;

  client_nom: string | null;
  client_fonction: string | null;
  signature_client: string | null;
  signature_technicien: string | null;

  statut: Statut;
  created_at: string;
  updated_at: string;
};

/** Section 2 du formulaire papier, dans l'ordre exact des deux colonnes. */
export const TYPES_INTERVENTION = [
  { cle: "installation_materiel", label: "Installation matériel (impr./MFP)" },
  { cle: "configuration_reseau", label: "Configuration réseau" },
  { cle: "installation_pilotes", label: "Installation pilotes" },
  { cle: "parametrage_scan", label: "Paramétrage scan / email" },
  { cle: "installation_logiciel", label: "Installation logiciel accounting" },
  { cle: "maintenance", label: "Maintenance / dépannage" },
  { cle: "formation", label: "Formation utilisateur" },
  { cle: "autre", label: "Autre" },
] as const;

/** Section 7 du formulaire papier. */
export const TESTS_EFFECTUES = [
  { cle: "impression", label: "Impression OK" },
  { cle: "scan", label: "Scan OK" },
  { cle: "reseau", label: "Accès réseau OK" },
  { cle: "logiciel", label: "Logiciel opérationnel" },
] as const;

/** Section 6 du formulaire papier. */
export const RESULTATS: { cle: Resultat; label: string }[] = [
  { cle: "reussie", label: "Intervention réussie" },
  { cle: "partielle", label: "Partiellement réussie" },
  { cle: "non_resolue", label: "Non résolue" },
];

export function labelType(cle: string) {
  return TYPES_INTERVENTION.find((t) => t.cle === cle)?.label ?? cle;
}

export function labelResultat(cle: string | null) {
  return RESULTATS.find((r) => r.cle === cle)?.label ?? "—";
}