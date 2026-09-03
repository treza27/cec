/*
  # Add tracking number to inventory table

  1. Changes
    - Add `tracking_number` column to `inventaire` table
      - Type: text
      - Nullable: true (optional field)
      - Unique: true (each tracking number should be unique)
    - Add index on tracking_number for faster lookups

  2. Notes
    - Tracking numbers are optional but when provided must be unique
    - This allows customers to track packages using either:
      - Their pseudo + phone number (existing method)
      - Their tracking number (new method)
*/

-- Add tracking_number column to inventaire table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN tracking_number text UNIQUE;
  END IF;
END $$;

-- Add index for faster tracking number lookups
CREATE INDEX IF NOT EXISTS idx_inventaire_tracking_number ON inventaire(tracking_number);

-- Add comment for documentation
COMMENT ON COLUMN inventaire.tracking_number IS 'Unique tracking number for package tracking';