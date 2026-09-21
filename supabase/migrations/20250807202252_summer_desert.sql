/*
  # Corriger les politiques RLS pour le stockage d'images

  1. Politiques de stockage
    - Permettre aux utilisateurs authentifiés d'uploader des images
    - Permettre aux utilisateurs authentifiés de voir les images
    - Permettre aux utilisateurs authentifiés de supprimer les images

  2. Sécurité
    - Les politiques s'appliquent au bucket 'package-images'
    - Seuls les utilisateurs authentifiés peuvent accéder aux fichiers
*/

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Créer les nouvelles politiques pour le bucket package-images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'package-images');

CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'package-images');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'package-images');

-- S'assurer que le bucket existe et est configuré correctement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'package-images',
  'package-images',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];