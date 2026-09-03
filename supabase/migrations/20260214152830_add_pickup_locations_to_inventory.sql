/*
  # Add Pickup Location Management Fields
  
  1. New Columns Added to `inventaire`
    - `point_enlevement` (text) - Current physical location in Antananarivo
      - Options: 'depot_anosizato', 'bureaux_ambodivona', null (not yet in Tana)
    - `point_enlevement_souhaite` (text) - Client's preferred pickup location
      - Options: 'depot_anosizato', 'bureaux_ambodivona', null (not specified)
    - `date_mise_disposition` (timestamptz) - Date when package arrived at pickup location
    
  2. Purpose
    - Track physical location of packages in Antananarivo
    - Manage client preferences for pickup locations
    - Enable transfer between depot and office locations
    - Monitor how long packages stay at each location
    
  3. Security
    - No RLS changes needed (existing policies cover these fields)
*/

-- Add pickup location management fields to inventaire table
DO $$
BEGIN
  -- Add current pickup location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'point_enlevement'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN point_enlevement text CHECK (point_enlevement IN ('depot_anosizato', 'bureaux_ambodivona'));
    COMMENT ON COLUMN inventaire.point_enlevement IS 'Current physical location in Antananarivo: depot_anosizato or bureaux_ambodivona';
  END IF;

  -- Add preferred pickup location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'point_enlevement_souhaite'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN point_enlevement_souhaite text CHECK (point_enlevement_souhaite IN ('depot_anosizato', 'bureaux_ambodivona'));
    COMMENT ON COLUMN inventaire.point_enlevement_souhaite IS 'Client preferred pickup location';
  END IF;

  -- Add date when package was made available at pickup location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire' AND column_name = 'date_mise_disposition'
  ) THEN
    ALTER TABLE inventaire ADD COLUMN date_mise_disposition timestamptz;
    COMMENT ON COLUMN inventaire.date_mise_disposition IS 'Date when package arrived at pickup location';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventaire_point_enlevement ON inventaire(point_enlevement);
CREATE INDEX IF NOT EXISTS idx_inventaire_date_mise_disposition ON inventaire(date_mise_disposition);
