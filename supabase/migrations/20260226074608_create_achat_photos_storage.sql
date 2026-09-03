/*
  # Création du bucket de stockage pour les photos d'articles

  ## Résumé
  Création du bucket Supabase Storage pour stocker les photos des articles
  des demandes d'achat.

  ## Bucket: achat-photos
  - Accès public pour permettre l'affichage des images dans l'interface
  - Taille maximale: 5MB par fichier
  - Types MIME autorisés: images uniquement

  ## Politiques Storage
  - Lecture publique pour affichage des images
  - Upload réservé aux utilisateurs authentifiés
  - Suppression réservée aux utilisateurs authentifiés
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'achat-photos',
  'achat-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view achat photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'achat-photos');

CREATE POLICY "Authenticated users can upload achat photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'achat-photos');

CREATE POLICY "Authenticated users can update achat photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'achat-photos');

CREATE POLICY "Authenticated users can delete achat photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'achat-photos');
