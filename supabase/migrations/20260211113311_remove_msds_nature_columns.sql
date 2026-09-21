/*
  # Remove MSDS and Nature columns from inventaire table

  1. Changes
    - Remove `nature` column from `inventaire` table
    - Remove `msds` column from `inventaire` table
  
  2. Security
    - No RLS changes needed as we're only removing columns
  
  3. Notes
    - These columns are no longer used in the application
    - Data in these columns will be permanently deleted
    - Ensure backup is available if data recovery is needed
*/

-- Remove nature column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'nature'
  ) THEN
    ALTER TABLE inventaire DROP COLUMN nature;
  END IF;
END $$;

-- Remove msds column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'msds'
  ) THEN
    ALTER TABLE inventaire DROP COLUMN msds;
  END IF;
END $$;