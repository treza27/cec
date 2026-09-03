CREATE POLICY "Public read photos storage"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'photos');
