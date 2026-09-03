/*
  # Rename client_name column to pseudo in inventaire table

  1. Changes
    - Rename `client_name` column to `pseudo` in `inventaire` table
    - Update index name to match new column name
    - Update column comment to reflect new column purpose

  2. Notes
    - This change aligns the database column name with the business terminology
    - PSEUDO is the preferred term for client identification in the system
    - All existing data will be preserved during the rename operation
*/

-- Rename the column from client_name to pseudo
ALTER TABLE inventaire 
RENAME COLUMN client_name TO pseudo;

-- Drop old index
DROP INDEX IF EXISTS idx_inventaire_client_name;

-- Create new index with updated name
CREATE INDEX IF NOT EXISTS idx_inventaire_pseudo ON inventaire(pseudo);

-- Update column comment
COMMENT ON COLUMN inventaire.pseudo IS 'Pseudo (client identifier) of the package owner';