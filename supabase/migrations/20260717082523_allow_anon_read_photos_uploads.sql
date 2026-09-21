CREATE POLICY "Public read photos_uploads"
  ON photos_uploads FOR SELECT
  TO anon
  USING (true);
