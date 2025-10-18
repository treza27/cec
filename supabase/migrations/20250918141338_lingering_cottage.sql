/*
  # Permettre l'accès anonyme aux images des colis

  1. Nouvelles politiques
    - Politique SELECT pour les utilisateurs anonymes sur `package_images`
    - Accès en lecture seule aux métadonnées des images
    - Pas d'accès aux opérations de modification (INSERT, UPDATE, DELETE)

  2. Sécurité
    - Maintien de la sécurité : seule la lecture est autorisée
    - Les utilisateurs anonymes ne peuvent pas uploader, modifier ou supprimer des images
    - Accès limité aux métadonnées uniquement (pas de données sensibles)

  3. Justification
    - Permet aux clients de voir les images de leurs colis lors du suivi
    - Nécessaire pour l'expérience utilisateur du suivi public
    - Cohérent avec l'accès anonyme déjà accordé aux tables `clients` et `inventaire`
*/

-- Ajouter une politique pour permettre aux utilisateurs anonymes de lire les métadonnées des images
CREATE POLICY "Allow anonymous read access to package images for tracking"
  ON package_images
  FOR SELECT
  TO anon
  USING (true);

-- Note: Cette politique permet la lecture des métadonnées des images (nom, taille, type, etc.)
-- mais pas l'accès direct aux fichiers dans le storage Supabase.
-- L'accès aux fichiers du storage doit être configuré séparément dans les politiques du bucket.