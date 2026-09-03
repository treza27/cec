/*
  # Add photo tag to photos_uploads table

  ## Summary
  Adds a categorization tag to uploaded photos so users can classify their uploads
  and agents can filter the photo gallery by category.

  ## Changes

  ### New Type
  - `photo_tag` enum with three values:
    - `reception_marchandise`: Photos taken when goods are received at the warehouse
    - `constat_anomalie`: Photos documenting damage, anomalies, or disputes
    - `chargement_conteneur`: Photos of merchandise being loaded into a container before departure

  ### Modified Tables
  - `photos_uploads`: Added nullable `tag` column of type `photo_tag`
    - Nullable to preserve compatibility with photos uploaded before this migration
    - No default value: new uploads must explicitly choose a tag

  ## Notes
  - Existing photos (before this migration) will have tag = NULL, displayed as "Sans tag" in the UI
  - The edge function will receive the tag from FormData and validate it server-side
*/

CREATE TYPE photo_tag AS ENUM (
  'reception_marchandise',
  'constat_anomalie',
  'chargement_conteneur'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos_uploads' AND column_name = 'tag'
  ) THEN
    ALTER TABLE photos_uploads ADD COLUMN tag photo_tag NULL;
  END IF;
END $$;
