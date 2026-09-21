/*
  # Création de la table client_shipping_marks pour gérer plusieurs shipping marks par client

  1. Nouvelles Tables
    - `client_shipping_marks`
      - `id` (bigint, primary key, auto-increment)
      - `client_id` (bigint, foreign key vers clients.id)
      - `shipping_mark` (text, unique)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Migration des données existantes
    - Copie des shipping_marks existants de la table clients vers client_shipping_marks
    - Suppression de la colonne shipping_mark de la table clients

  3. Sécurité
    - Enable RLS sur la nouvelle table
    - Politique pour les utilisateurs authentifiés

  4. Index et contraintes
    - Index sur client_id pour les performances
    - Contrainte d'unicité sur shipping_mark
    - Contrainte de clé étrangère vers clients
*/

-- Créer la nouvelle table client_shipping_marks
CREATE TABLE IF NOT EXISTS client_shipping_marks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id bigint NOT NULL,
  shipping_mark text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrer les données existantes de clients vers client_shipping_marks
DO $$
BEGIN
  -- Insérer les shipping_marks existants dans la nouvelle table
  INSERT INTO client_shipping_marks (client_id, shipping_mark)
  SELECT id, shipping_mark 
  FROM clients 
  WHERE shipping_mark IS NOT NULL AND shipping_mark != '';
END $$;

-- Supprimer la contrainte d'unicité sur shipping_mark dans clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'clients_shipping_mark_key' 
    AND table_name = 'clients'
  ) THEN
    ALTER TABLE clients DROP CONSTRAINT clients_shipping_mark_key;
  END IF;
END $$;

-- Supprimer l'index sur shipping_mark dans clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_clients_shipping_mark'
  ) THEN
    DROP INDEX idx_clients_shipping_mark;
  END IF;
END $$;

-- Supprimer la colonne shipping_mark de la table clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'shipping_mark'
  ) THEN
    ALTER TABLE clients DROP COLUMN shipping_mark;
  END IF;
END $$;

-- Ajouter les contraintes et index pour la nouvelle table
ALTER TABLE client_shipping_marks 
ADD CONSTRAINT fk_client_shipping_marks_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Contrainte d'unicité sur shipping_mark
ALTER TABLE client_shipping_marks 
ADD CONSTRAINT client_shipping_marks_shipping_mark_unique 
UNIQUE (shipping_mark);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_client_id 
ON client_shipping_marks(client_id);

CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_shipping_mark 
ON client_shipping_marks(shipping_mark);

CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_active 
ON client_shipping_marks(is_active);

-- Activer RLS
ALTER TABLE client_shipping_marks ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les utilisateurs authentifiés
CREATE POLICY "Allow all operations for authenticated users"
  ON client_shipping_marks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fonction de trigger pour updated_at
CREATE OR REPLACE FUNCTION update_client_shipping_marks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_client_shipping_marks_updated_at
  BEFORE UPDATE ON client_shipping_marks
  FOR EACH ROW
  EXECUTE FUNCTION update_client_shipping_marks_updated_at();