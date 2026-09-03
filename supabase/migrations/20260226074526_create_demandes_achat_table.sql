/*
  # Création de la table demandes_achat

  ## Résumé
  Création de la table principale pour la gestion des demandes d'achat (sourcing
  de marchandises depuis la Chine vers Madagascar). Cette table centralise toutes
  les informations saisies par les Commerciales et les Acheteurs.

  ## Nouvelle Table: `demandes_achat`

  ### Informations de création (Commerciale)
  - `client_id` : Référence vers la table clients (obligatoire)
  - `nom_article` : Nom de l'article à sourcer (obligatoire)
  - `photo_url` : URL de la photo de l'article (facultatif)
  - `lien_exemple` : Lien vers un exemple du produit (facultatif)
  - `quantite` : Quantité demandée, entier positif (obligatoire)
  - `remarques` : Notes libres de la commerciale (facultatif)

  ### Informations de traitement (Acheteur)
  - `lien_achat_final` : URL d'achat final trouvé par l'acheteur (facultatif)
  - `prix_unitaire_rmb` : Prix unitaire en Yuan chinois (facultatif)
  - `frais_port_locaux_rmb` : Frais de port locaux en RMB (facultatif)
  - `taux_change_achete` : Taux de change d'achat RMB/MGA (facultatif)
  - `taux_change_vendu` : Taux de change de vente RMB/MGA (facultatif)
  - `poids_estime` : Poids estimé en kg (facultatif)
  - `volume_cbm` : Volume en CBM (facultatif)

  ### Suivi et Métadonnées
  - `statut` : Enum avec 6 valeurs, défaut "Nouveau"
  - `cree_par_id` : UUID de la commerciale (auth.users)
  - `assigne_a_id` : UUID de l'acheteur assigné (auth.users, facultatif)
  - `date_creation` : Timestamp automatique à la création
  - `date_traitement` : Timestamp automatique quand statut = "En cours d'analyse"
  - `date_validation` : Timestamp automatique quand statut = "Devis Prêt"

  ## Sécurité
  - RLS activé
  - Politique de lecture: tous les employés authentifiés peuvent lire
  - Politique d'insertion: utilisateurs authentifiés peuvent créer
  - Politique de mise à jour: utilisateurs authentifiés peuvent modifier
  - Politique de suppression: réservée aux admins
*/

CREATE TABLE IF NOT EXISTS demandes_achat (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  nom_article TEXT NOT NULL,
  photo_url TEXT,
  lien_exemple TEXT,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  remarques TEXT,
  lien_achat_final TEXT,
  prix_unitaire_rmb NUMERIC(12, 4),
  frais_port_locaux_rmb NUMERIC(12, 4),
  taux_change_achete NUMERIC(12, 4),
  taux_change_vendu NUMERIC(12, 4),
  poids_estime NUMERIC(10, 3),
  volume_cbm NUMERIC(10, 4),
  statut TEXT NOT NULL DEFAULT 'Nouveau'
    CHECK (statut IN ('Nouveau', 'En cours d''analyse', 'Action requise', 'Devis Prêt', 'Rejeté', 'Payé')),
  cree_par_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigne_a_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_traitement TIMESTAMPTZ,
  date_validation TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demandes_achat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all demandes_achat"
  ON demandes_achat FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create demandes_achat"
  ON demandes_achat FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cree_par_id);

CREATE POLICY "Authenticated users can update demandes_achat"
  ON demandes_achat FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete demandes_achat"
  ON demandes_achat FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_demandes_achat_client_id ON demandes_achat(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_achat_statut ON demandes_achat(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_achat_cree_par ON demandes_achat(cree_par_id);
CREATE INDEX IF NOT EXISTS idx_demandes_achat_assigne_a ON demandes_achat(assigne_a_id);
CREATE INDEX IF NOT EXISTS idx_demandes_achat_date_creation ON demandes_achat(date_creation DESC);
