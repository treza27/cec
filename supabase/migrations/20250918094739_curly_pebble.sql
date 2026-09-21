/*
  # Ajouter la colonne id_depart à la table inventaire

  1. Modifications de la table
    - Ajouter la colonne `id_depart` (bigint, nullable)
    - Créer une clé étrangère vers la table `depart`
    - Ajouter un index pour optimiser les requêtes

  2. Sécurité
    - Aucune modification des politiques RLS nécessaire
    - La colonne est nullable pour permettre les colis non assignés

  3. Notes importantes
    - Cette colonne sera automatiquement remplie lors de l'assignation des colis aux départs
    - Les colis existants auront une valeur NULL jusqu'à leur assignation
*/

-- Ajouter la colonne id_depart à la table inventaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'id_depart'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN id_depart bigint;
  END IF;
END $$;

-- Créer la contrainte de clé étrangère vers la table depart
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_inventaire_depart_id'
  ) THEN
    ALTER TABLE inventaire 
    ADD CONSTRAINT fk_inventaire_depart_id 
    FOREIGN KEY (id_depart) REFERENCES depart(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Créer un index pour optimiser les requêtes sur id_depart
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_inventaire_id_depart'
  ) THEN
    CREATE INDEX idx_inventaire_id_depart ON inventaire(id_depart);
  END IF;
END $$;

-- Mettre à jour les colis existants avec leur id_depart basé sur le BL
UPDATE inventaire 
SET id_depart = depart.id
FROM depart 
WHERE inventaire.bl = depart.num_bl 
  AND inventaire.bl IS NOT NULL 
  AND inventaire.bl != ''
  AND inventaire.id_depart IS NULL;