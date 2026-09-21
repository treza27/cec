/*
  # Créer la table clients

  1. Nouvelle table
    - `clients`
      - `id` (bigint, primary key, auto-increment)
      - `nom` (text, nom de famille du client)
      - `prenom` (text, prénom du client)
      - `entreprise` (text, nom de l'entreprise)
      - `quartier_ville` (text, quartier et ville)
      - `shipping_mark` (text, unique, identifiant unique du client)
      - `telephone` (text, numéro de téléphone)
      - `created_at` (timestamp, date de création)
      - `updated_at` (timestamp, date de mise à jour)

  2. Sécurité
    - Activer RLS sur la table `clients`
    - Politique pour permettre toutes les opérations aux utilisateurs authentifiés

  3. Index
    - Index sur `shipping_mark` pour les recherches rapides
    - Index sur `nom` et `prenom` pour les recherches par nom

  4. Trigger
    - Trigger pour mettre à jour automatiquement `updated_at`
*/

-- Créer la table clients
CREATE TABLE IF NOT EXISTS clients (
  id bigserial PRIMARY KEY,
  nom text NOT NULL,
  prenom text NOT NULL,
  entreprise text,
  quartier_ville text,
  shipping_mark text UNIQUE NOT NULL,
  telephone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "Allow all operations for authenticated users"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_clients_shipping_mark ON clients (shipping_mark);
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients (nom);
CREATE INDEX IF NOT EXISTS idx_clients_prenom ON clients (prenom);
CREATE INDEX IF NOT EXISTS idx_clients_entreprise ON clients (entreprise);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Insérer quelques données d'exemple
INSERT INTO clients (nom, prenom, entreprise, quartier_ville, shipping_mark, telephone) VALUES
  ('Rakoto', 'Jean', 'Import Export SARL', 'Analakely, Antananarivo', 'JR2024001', '+261 34 12 345 67'),
  ('Andriamampianina', 'Paul', 'Tech Solutions Madagascar', 'Ivandry, Antananarivo', 'PA2024002', '+261 33 98 765 43'),
  ('Rasoamalala', 'Marie', 'Commerce International', 'Behoririka, Antananarivo', 'MR2024003', '+261 32 11 223 44'),
  ('Rakotomalala', 'Sophie', 'Boutique Tendance', 'Ankorondrano, Antananarivo', 'SR2024004', '+261 34 55 667 78')
ON CONFLICT (shipping_mark) DO NOTHING;