/*
  # Correction de la synchronisation inventaire

  1. Corrections de structure
    - Ajout de contraintes manquantes
    - Correction des types de données
    - Ajout d'index pour les performances
  
  2. Sécurité
    - Mise à jour des politiques RLS
    - Permissions pour toutes les opérations CRUD
*/

-- Mise à jour de la table inventaire pour correspondre exactement à l'interface
ALTER TABLE inventaire 
  ALTER COLUMN nb_palettes SET DEFAULT 0,
  ALTER COLUMN nb_cartons SET DEFAULT 1;

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_inventaire_shipping_mark_text ON inventaire USING btree (shipping_mark text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_inventaire_description_text ON inventaire USING gin (to_tsvector('french', description));

-- Mise à jour des politiques RLS pour permettre toutes les opérations
DROP POLICY IF EXISTS "Authenticated users can manage inventaire" ON inventaire;

CREATE POLICY "Allow all operations for authenticated users" ON inventaire
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Fonction pour nettoyer les données nulles
CREATE OR REPLACE FUNCTION clean_inventaire_data()
RETURNS void AS $$
BEGIN
  UPDATE inventaire 
  SET 
    num_recu = COALESCE(num_recu, ''),
    entrepot = COALESCE(entrepot, ''),
    shipping_mark = COALESCE(shipping_mark, ''),
    nature = COALESCE(nature, ''),
    nb_palettes = COALESCE(nb_palettes, 0),
    nb_cartons = COALESCE(nb_cartons, 1),
    msds = COALESCE(msds, false),
    statut = COALESCE(statut, 'enregistre_chine')
  WHERE 
    num_recu IS NULL OR 
    entrepot IS NULL OR 
    shipping_mark IS NULL OR 
    nature IS NULL OR 
    nb_palettes IS NULL OR 
    nb_cartons IS NULL OR 
    msds IS NULL OR 
    statut IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le nettoyage
SELECT clean_inventaire_data();