/*
  # Création de la table depart

  1. Nouvelle Table
    - `depart`
      - `id` (bigint, primary key, auto-increment)
      - `num_bl` (text, numéro de Bill of Lading)
      - `num_tc` (text, numéro de Transport Container)
      - `nb_palettes_total` (integer, nombre total de palettes)
      - `nb_cartons_total` (integer, nombre total de cartons)
      - `poids_total` (numeric, poids total en kg)
      - `volume_total` (numeric, volume total en m³)
      - `statut` (text, statut du départ avec contrainte)
      - `date_chargement` (date, date de chargement)
      - `date_depart_chine` (date, date de départ de Chine)
      - `date_arrivee_tamatave` (date, date d'arrivée à Tamatave)
      - `date_arrivee_tana` (date, date d'arrivée à Antananarivo)
      - `date_reception_colis` (date, date de réception des colis)
      - `colis_associes` (integer[], tableau des IDs des colis associés)
      - `created_at` (timestamptz, date de création)
      - `updated_at` (timestamptz, date de mise à jour)

  2. Sécurité
    - Enable RLS sur la table `depart`
    - Politique permettant aux utilisateurs authentifiés de gérer les départs

  3. Contraintes
    - Contrainte sur le statut pour valider les valeurs autorisées
    - Contraintes de validation sur les nombres (positifs)
    - Index sur les colonnes fréquemment utilisées

  4. Triggers
    - Trigger pour mettre à jour automatiquement `updated_at`
*/

-- Créer la table depart
CREATE TABLE IF NOT EXISTS depart (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  num_bl text NOT NULL,
  num_tc text,
  nb_palettes_total integer DEFAULT 0,
  nb_cartons_total integer DEFAULT 0,
  poids_total numeric(10,2) DEFAULT 0,
  volume_total numeric(10,2) DEFAULT 0,
  statut text DEFAULT 'preparation_depart',
  date_chargement date,
  date_depart_chine date,
  date_arrivee_tamatave date,
  date_arrivee_tana date,
  date_reception_colis date,
  colis_associes integer[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ajouter les contraintes de validation
ALTER TABLE depart ADD CONSTRAINT depart_statut_check 
CHECK (statut = ANY (ARRAY[
  'preparation_depart'::text,
  'conteneur_charge'::text,
  'depart_chine'::text,
  'arrivee_toamasina'::text,
  'dedouanement_en_cours'::text,
  'arrivee_antananarivo'::text,
  'decharge_trie'::text
]));

ALTER TABLE depart ADD CONSTRAINT depart_nb_palettes_check 
CHECK (nb_palettes_total >= 0);

ALTER TABLE depart ADD CONSTRAINT depart_nb_cartons_check 
CHECK (nb_cartons_total >= 0);

ALTER TABLE depart ADD CONSTRAINT depart_poids_check 
CHECK (poids_total >= 0);

ALTER TABLE depart ADD CONSTRAINT depart_volume_check 
CHECK (volume_total >= 0);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_depart_num_bl ON depart (num_bl);
CREATE INDEX IF NOT EXISTS idx_depart_statut ON depart (statut);
CREATE INDEX IF NOT EXISTS idx_depart_date_chargement ON depart (date_chargement);
CREATE INDEX IF NOT EXISTS idx_depart_date_arrivee_tana ON depart (date_arrivee_tana);
CREATE INDEX IF NOT EXISTS idx_depart_created_at ON depart (created_at);

-- Activer RLS
ALTER TABLE depart ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Authenticated users can manage departs"
  ON depart
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Créer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_depart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour updated_at
CREATE TRIGGER update_depart_updated_at
  BEFORE UPDATE ON depart
  FOR EACH ROW
  EXECUTE FUNCTION update_depart_updated_at();