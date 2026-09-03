ALTER TABLE catalogue_categories
  ADD COLUMN IF NOT EXISTS photo_couverture TEXT DEFAULT NULL;
