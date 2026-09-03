/*
  # Création de la table achat_articles

  ## Résumé
  Création d'une table relationnelle pour gérer plusieurs articles par demande d'achat.
  Cette refonte permet d'associer N articles à une même demande, chacun avec sa propre
  photo, prix unitaire, frais de port, quantité, poids et volume.

  ## Nouvelle Table: `achat_articles`

  ### Colonnes
  - `id` : Clé primaire auto-incrémentée
  - `demande_achat_id` : FK vers demandes_achat (obligatoire, CASCADE delete)
  - `nom_article` : Nom de l'article (obligatoire)
  - `description` : Description libre (facultatif)
  - `lien_achat` : Lien d'achat spécifique à cet article (facultatif)
  - `photo_url` : URL de la photo de l'article (facultatif)
  - `prix_unitaire_rmb` : Prix unitaire en RMB (facultatif)
  - `frais_port_locaux_rmb` : Frais de port locaux en RMB (facultatif)
  - `quantite` : Quantité pour cet article, entier positif (défaut 1)
  - `poids_estime` : Poids estimé en kg (facultatif)
  - `volume_cbm` : Volume en CBM (facultatif)
  - `ordre` : Ordre d'affichage dans le tableau (défaut 0)
  - `created_at` / `updated_at` : Timestamps automatiques

  ## Colonnes retirées de demandes_achat
  Les colonnes suivantes sont désormais gérées au niveau de chaque article:
  - prix_unitaire_rmb → achat_articles.prix_unitaire_rmb
  - frais_port_locaux_rmb → achat_articles.frais_port_locaux_rmb
  - poids_estime → achat_articles.poids_estime
  - volume_cbm → achat_articles.volume_cbm

  Les champs globaux conservés sur demandes_achat:
  - lien_achat_final (lien global de la commande)
  - taux_change_achete (taux global)
  - taux_change_vendu (taux global)

  ## Sécurité
  - RLS activé sur achat_articles
  - Lecture: tous les utilisateurs authentifiés
  - Insertion: utilisateurs authentifiés
  - Mise à jour: utilisateurs authentifiés
  - Suppression: utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS achat_articles (
  id BIGSERIAL PRIMARY KEY,
  demande_achat_id BIGINT NOT NULL REFERENCES demandes_achat(id) ON DELETE CASCADE,
  nom_article TEXT NOT NULL DEFAULT '',
  description TEXT,
  lien_achat TEXT,
  photo_url TEXT,
  prix_unitaire_rmb NUMERIC(12, 4),
  frais_port_locaux_rmb NUMERIC(12, 4),
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  poids_estime NUMERIC(10, 3),
  volume_cbm NUMERIC(10, 4),
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE achat_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view achat_articles"
  ON achat_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create achat_articles"
  ON achat_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update achat_articles"
  ON achat_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete achat_articles"
  ON achat_articles FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_achat_articles_demande_id ON achat_articles(demande_achat_id);
CREATE INDEX IF NOT EXISTS idx_achat_articles_ordre ON achat_articles(demande_achat_id, ordre);

CREATE OR REPLACE FUNCTION update_achat_articles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_achat_articles_updated_at ON achat_articles;
CREATE TRIGGER trg_achat_articles_updated_at
  BEFORE UPDATE ON achat_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_achat_articles_updated_at();
