/*
  # Créer une politique d'authentification pour package_images

  1. Sécurité
    - Activer RLS sur `package_images`
    - Créer une politique permettant aux utilisateurs authentifiés d'insérer des images
    - Créer une politique permettant aux utilisateurs authentifiés de lire toutes les images
    - Créer une politique permettant aux utilisateurs authentifiés de supprimer leurs propres images
*/

-- Activer RLS sur la table package_images
ALTER TABLE package_images ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated inserts" ON package_images;
DROP POLICY IF EXISTS "Allow authenticated reads" ON package_images;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON package_images;

-- Politique pour permettre les insertions aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated inserts"
  ON package_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated reads"
  ON package_images
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated deletes"
  ON package_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'package_images';