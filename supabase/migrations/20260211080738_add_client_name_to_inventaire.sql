/*
  # Add client_name column to inventaire table

  1. Changes
    - Add `client_name` column to `inventaire` table
      - Type: text
      - Nullable: true (optional field as not all packages may have client names yet)
      - Position: After `entrepot` column
    - Add index on client_name for faster client searches

  2. Notes
    - Client name is optional but will help identify package owners
    - This field will be displayed in the inventory table in the agent dashboard
    - Index added for performance when searching by client name
*/

-- Add client_name column to inventaire table after entrepot column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN client_name text;
  END IF;
END $$;

-- Add index for faster client name lookups
CREATE INDEX IF NOT EXISTS idx_inventaire_client_name ON inventaire(client_name);

-- Add comment for documentation
COMMENT ON COLUMN inventaire.client_name IS 'Name of the client who owns this package';