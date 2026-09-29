/* eslint-disable @next/next/no-img-element */
import { Logo } from "./marque";
import { formaterDate } from "@/lib/format";
import { RESULTATS, TESTS_EFFECTUES, TYPES_INTERVENTION, type Fiche } from "@/lib/types";

/**
 * Rendu A4 de la fiche, calqué sur le document imprimé de MA SOFT CONSULTING :
 * même en-tête, mêmes numéros de section, mêmes intitulés. Un client qui a déjà
 * signé la version papier doit reconnaître la feuille au premier coup d'œil.
 *
 * Les images de signature sont des dataURL déjà en mémoire : `next/image`
 * n'apporterait rien ici et gênerait le rendu à l'impression.
 */
export function FichePapier({ fiche }: { fiche: Fiche }) {
  const texte = (valeur: string | null | undefined) => valeur ?? "";

  return (
    <div className="feuille">
      {/* ------------------------------------------------------ en-tête */}
      <div className="bandeau">
        <div className="bandeau-logo">
          <Logo taille={180} priority />
        </div>

        <div className="bandeau-centre">
          <div className="bandeau-titre">MA SOFT CONSULTING</div>
          <div className="bandeau-sous">
            Solutions d&apos;impression · Maintenance · Installation · Configuration
          </div>
        </div>

        <div className="bandeau-droite">
          <strong>Fiche d&apos;intervention</strong>
          <div className="mention-validation">Validation client requise</div>
        </div>
      </div>

      <div className="bandeau-champs">
        <ChampPapier label="N° intervention" valeur={fiche.numero} />
        <ChampPapier
          label="Date d'intervention"
          valeur={fiche.date_intervention ? formaterDate(fiche.date_intervention) : ""}
        />
        <ChampPapier label="Arrivée" valeur={texte(fiche.heure_arrivee)} />
        <ChampPapier label="Départ" valeur={texte(fiche.heure_depart)} />
        <ChampPapier
          label="Facturable"
          valeur={fiche.facturable ? (fiche.facturable === "oui" ? "Oui" : "Non") : ""}
        />
      </div>

      {/* -------------------------------------------------------- corps */}
      <div className="corps">
        {/* 1 */}
        <SectionPapier titre="1. Informations générales">
          <div className="grille-2">
            <ChampPapier label="Société" valeur={texte(fiche.societe)} />
            <ChampPapier label="Adresse" valeur={texte(fiche.adresse)} />
            <ChampPapier label="Contact" valeur={texte(fiche.contact)} />
            <ChampPapier label="Tél." valeur={texte(fiche.telephone)} />
            <ChampPapier label="Email" valeur={texte(fiche.email)} />
            <ChampPapier label="Technicien" valeur={texte(fiche.technicien)} />
          </div>
        </SectionPapier>

        {/* 2 */}
        <SectionPapier titre="2. Type d'intervention">
          <div className="grille-2">
            {TYPES_INTERVENTION.map((type) => (
              <CasePapier
                key={type.cle}
                cochee={fiche.types.includes(type.cle)}
                label={
                  type.cle === "autre" && fiche.type_autre
                    ? `Autre : ${fiche.type_autre}`
                    : type.label
                }
              />
            ))}
          </div>
        </SectionPapier>

        {/* 3 */}
        <SectionPapier titre="3. Matériel concerné">
          <div className="grille-2">
            <ChampPapier label="Marque / Modèle" valeur={texte(fiche.marque_modele)} />
            <ChampPapier label="N° de série" valeur={texte(fiche.numero_serie)} />
            <ChampPapier label="Adresse IP" valeur={texte(fiche.adresse_ip)} />
            <ChampPapier label="Localisation" valeur={texte(fiche.localisation)} />
          </div>
        </SectionPapier>

        {/* 4 */}
        <SectionPapier titre="4. Compteur machine – relevé client">
          <table className="table-compteur">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Noir &amp; blanc</th>
                <th style={{ width: "24%" }}>Compteur actuel</th>
                <th style={{ width: "8%" }}>Validé</th>
                <th style={{ width: "18%" }}>Couleur</th>
                <th style={{ width: "24%" }}>Compteur actuel</th>
                <th style={{ width: "8%" }}>Validé</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td />
                <td>{texte(fiche.compteur_nb)}</td>
                <td className="centre">
                  <span className={`case-boite ${fiche.compteur_nb_valide ? "cochee" : ""}`} />
                </td>
                <td />
                <td>{texte(fiche.compteur_couleur)}</td>
                <td className="centre">
                  <span className={`case-boite ${fiche.compteur_couleur_valide ? "cochee" : ""}`} />
                </td>
              </tr>
            </tbody>
          </table>
        </SectionPapier>

        {/* 5 */}
        <SectionPapier titre="5. Détail de l'intervention" extensible>
          <div className="valeur grande">{texte(fiche.detail)}</div>
        </SectionPapier>

        {/* 6 */}
        <SectionPapier titre="6. Résultat de l'intervention">
          <div className="grille-3">
            {RESULTATS.map((resultat) => (
              <CasePapier
                key={resultat.cle}
                cochee={fiche.resultat === resultat.cle}
                label={resultat.label}
              />
            ))}
          </div>
          <div style={{ marginTop: "2mm" }}>
            <ChampPapier label="Commentaires" valeur={texte(fiche.commentaires)} />
          </div>
        </SectionPapier>

        {/* 7 */}
        <SectionPapier titre="7. Tests effectués">
          <div className="grille-4">
            {TESTS_EFFECTUES.map((test) => (
              <CasePapier key={test.cle} cochee={fiche.tests.includes(test.cle)} label={test.label} />
            ))}
          </div>
          <div style={{ marginTop: "2mm" }}>
            <ChampPapier label="Autres" valeur={texte(fiche.tests_autres)} />
          </div>
        </SectionPapier>

        {/* 8 */}
        <SectionPapier titre="8. Recommandations / actions à prévoir" extensible>
          <div className="valeur moyenne">{texte(fiche.recommandations)}</div>
        </SectionPapier>

        {/* 9 */}
        <SectionPapier titre="9. Validation client">
          <div className="grille-2">
            <ChampPapier label="Nom du client" valeur={texte(fiche.client_nom)} />
            <ChampPapier label="Fonction" valeur={texte(fiche.client_fonction)} />
          </div>

          <div className="grille-signature" style={{ marginTop: "2.5mm" }}>
            <div className="boite-signature">
              <div className="boite-signature-titre">Signature client + tampon</div>
              <div className="zone-signature">
                {fiche.signature_client && (
                  <img src={fiche.signature_client} alt="Signature du client" />
                )}
              </div>
            </div>
            <div className="boite-signature">
              <div className="boite-signature-titre">Signature technicien</div>
              <div className="zone-signature">
                {fiche.signature_technicien && (
                  <img src={fiche.signature_technicien} alt="Signature du technicien" />
                )}
              </div>
            </div>
          </div>
        </SectionPapier>
      </div>

      {/* --------------------------------------------------------- pied */}
      <div className="pied">
        <span>MA SOFT CONSULTING · Document d&apos;intervention officiel</span>
        <span>{fiche.numero}</span>
      </div>
    </div>
  );
}

function SectionPapier({
  titre,
  extensible = false,
  children,
}: {
  titre: string;
  extensible?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={extensible ? "section-extensible" : undefined}>
      <div className="section-titre">{titre}</div>
      <div className="section-corps">{children}</div>
    </section>
  );
}

function ChampPapier({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <span className="etiquette-papier">{label}</span>
      <div className="valeur">{valeur || " "}</div>
    </div>
  );
}

function CasePapier({ cochee, label }: { cochee: boolean; label: string }) {
  return (
    <div className="case-papier">
      <span className={`case-boite ${cochee ? "cochee" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
