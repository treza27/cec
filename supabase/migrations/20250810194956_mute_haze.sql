/*
  # Update inventory constraints to allow optional fields

  1. Changes
    - Remove NOT NULL constraints on poids and volume
    - Update check constraints to allow NULL values
    - Keep positive number validation only when values are provided

  2. Security
    - Maintain data integrity for provided values
    - Allow NULL values for optional fields
*/

-- Remove NOT NULL constraints and update check constraints
ALTER TABLE inventaire 
  ALTER COLUMN poids DROP NOT NULL,
  ALTER COLUMN volume DROP NOT NULL;

-- Drop existing check constraints
ALTER TABLE inventaire DROP CONSTRAINT IF EXISTS inventaire_poids_check;
ALTER TABLE inventaire DROP CONSTRAINT IF EXISTS inventaire_volume_check;
ALTER TABLE inventaire DROP CONSTRAINT IF EXISTS inventaire_poids_tana_check;
ALTER TABLE inventaire DROP CONSTRAINT IF EXISTS inventaire_volume_tana_check;

-- Add new check constraints that allow NULL values
ALTER TABLE inventaire ADD CONSTRAINT inventaire_poids_check 
  CHECK (poids IS NULL OR poids > 0);

ALTER TABLE inventaire ADD CONSTRAINT inventaire_volume_check 
  CHECK (volume IS NULL OR volume > 0);

ALTER TABLE inventaire ADD CONSTRAINT inventaire_poids_tana_check 
  CHECK (poids_tana IS NULL OR poids_tana > 0);

ALTER TABLE inventaire ADD CONSTRAINT inventaire_volume_tana_check 
  CHECK (volume_tana IS NULL OR volume_tana > 0);