/*
  # Remove num_recu column from inventaire table

  1. Changes
    - Drop the `num_recu` column from the `inventaire` table
    - This column is no longer used as tracking_number is now the sole identifier
  
  2. Rationale
    - The num_recu (receipt number) field is redundant
    - The tracking_number field is sufficient for package tracking
    - Simplifies the data model and removes unused fields
  
  3. Data Safety
    - The column is nullable and not referenced by any foreign keys
    - No data dependencies or critical information loss
*/

-- Drop the num_recu column from inventaire table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'num_recu'
  ) THEN
    ALTER TABLE inventaire DROP COLUMN num_recu;
  END IF;
END $$;
