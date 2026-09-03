/*
  # Photos Uploads - Table de suivi et bucket Supabase Storage

  ## Résumé
  Mise en place de l'infrastructure de stockage pour les photos uploadées
  via la page d'upload, en remplacement de Google Drive.

  ## Nouvelles tables

  ### `photos_uploads`
  - `id` (uuid, PK) : identifiant unique
  - `storage_path` (text) : chemin complet dans le bucket (ex: 2026-05-27/143022_photo.jpg)
  - `original_name` (text) : nom de fichier original avant sanitisation
  - `file_size` (bigint) : taille en octets
  - `mime_type` (text) : type MIME du fichier
  - `folder_date` (text) : date du dossier YYYY-MM-DD pour faciliter les requêtes
  - `uploaded_at` (timestamptz) : horodatage de l'upload

  ## Bucket Storage

  - Bucket `photos` créé en mode privé (pas d'accès public)
  - RLS activé sur le bucket, accessible uniquement aux utilisateurs authentifiés

  ## Sécurité

  - RLS activé sur la table `photos_uploads`
  - Politique INSERT : seuls les utilisateurs authentifiés peuvent insérer
  - Politique SELECT : seuls les utilisateurs authentifiés peuvent lire
  - Pas d'accès public à aucune donnée
*/

-- Create the photos_uploads tracking table
CREATE TABLE IF NOT EXISTS photos_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  original_name text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  folder_date text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE photos_uploads ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert uploads
CREATE POLICY "Authenticated users can insert uploads"
  ON photos_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read uploads
CREATE POLICY "Authenticated users can read uploads"
  ON photos_uploads
  FOR SELECT
  TO authenticated
  USING (true);

-- Create the private photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage: authenticated users can upload
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- RLS for storage: authenticated users can read their uploads
CREATE POLICY "Authenticated users can read photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');
