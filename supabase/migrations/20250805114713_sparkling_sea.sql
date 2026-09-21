/*
  # Création de la table Inventaire

  1. Nouvelle Table
    - `inventaire`
      - `id` (bigint, primary key, auto-increment)
      - `bl` (text) - Numéro de Bill of Lading
      - `date_entree` (date) - Date d'entrée en entrepôt
      - `num_recu` (text) - Numéro de reçu/tracking
      - `entrepot` (text) - Entrepôt d'origine (Guangzhou, Yiwu)
      - `shipping_mark` (text) - Marque d'expédition du client
      - `description` (text) - Description des marchandises
      - `nb_palettes` (integer) - Nombre de palettes
      - `nb_cartons` (integer) - Nombre de cartons
      - `poids` (decimal) - Poids en kg
      - `volume` (decimal) - Volume en m³
      - `nature` (text) - Nature des marchandises (GG, SG, DG)
      - `msds` (boolean) - Présence de fiche de sécurité
      - `statut` (text) - Statut du colis
      - `nb_palettes_tana` (integer) - Nombre de palettes mesuré à Tana
      - `nb_cartons_tana` (integer) - Nombre de cartons mesuré à Tana
      - `poids_tana` (decimal) - Poids mesuré à Tana
      - `volume_tana` (decimal) - Volume mesuré à Tana
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Sécurité
    - Enable RLS sur la table `inventaire`
    - Politique pour les utilisateurs authentifiés

  3. Index
    - Index sur `bl` pour les recherches rapides
    - Index sur `statut` pour les filtres
    - Index sur `shipping_mark` pour les recherches client
*/

-- Création de la table inventaire
CREATE TABLE IF NOT EXISTS inventaire (
  id bigserial PRIMARY KEY,
  bl text NOT NULL,
  date_entree date NOT NULL DEFAULT CURRENT_DATE,
  num_recu text,
  entrepot text CHECK (entrepot IN ('Guangzhou', 'Yiwu')),
  shipping_mark text,
  description text NOT NULL,
  nb_palettes integer DEFAULT 0 CHECK (nb_palettes >= 0),
  nb_cartons integer DEFAULT 1 CHECK (nb_cartons >= 0),
  poids decimal(10,2) NOT NULL CHECK (poids > 0),
  volume decimal(10,2) NOT NULL CHECK (volume > 0),
  nature text CHECK (nature IN ('GG', 'SG', 'DG')),
  msds boolean DEFAULT false,
  statut text DEFAULT 'enregistre_chine' CHECK (statut IN (
    'enregistre_chine',
    'charge_expedition', 
    'en_route_madagascar',
    'arrive_toamasina',
    'dedouanement_cours',
    'arrive_antananarivo',
    'pret_livraison_enlevement',
    'en_cours_livraison',
    'livre'
  )),
  -- Valeurs mesurées au dépôt de Tana pour contre-mesure
  nb_palettes_tana integer CHECK (nb_palettes_tana >= 0),
  nb_cartons_tana integer CHECK (nb_cartons_tana >= 0),
  poids_tana decimal(10,2) CHECK (poids_tana > 0),
  volume_tana decimal(10,2) CHECK (volume_tana > 0),
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE inventaire ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can manage inventaire"
  ON inventaire
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_inventaire_bl ON inventaire(bl);
CREATE INDEX IF NOT EXISTS idx_inventaire_statut ON inventaire(statut);
CREATE INDEX IF NOT EXISTS idx_inventaire_shipping_mark ON inventaire(shipping_mark);
CREATE INDEX IF NOT EXISTS idx_inventaire_entrepot ON inventaire(entrepot);
CREATE INDEX IF NOT EXISTS idx_inventaire_date_entree ON inventaire(date_entree);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_inventaire_updated_at
  BEFORE UPDATE ON inventaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques données d'exemple
INSERT INTO inventaire (
  bl, date_entree, num_recu, entrepot, shipping_mark, description, 
  nb_palettes, nb_cartons, poids, volume, nature, msds, statut
) VALUES 
(
  'BL2024001', '2024-01-15', 'REC001', 'Guangzhou', 'JR2024001', 
  'Électronique et accessoires', 2, 15, 25.5, 2.3, 'GG', true, 'en_route_madagascar'
),
(
  'BL2024002', '2024-01-18', 'REC002', 'Yiwu', 'PA2024002', 
  'Textile et vêtements', 0, 45, 180.2, 8.5, 'GG', false, 'en_route_madagascar'
),
(
  'BL2024003', '2024-01-20', 'REC003', 'Guangzhou', 'JR2024003', 
  'Matériel informatique', 1, 8, 45.8, 1.2, 'GG', false, 'enregistre_chine'
);