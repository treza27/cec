/*
  # Add Preferred Pickup Location to Clients
  
  1. New Column Added to `clients`
    - `point_enlevement_prefere` (text) - Client's default preferred pickup location
      - Options: 'depot_anosizato', 'bureaux_ambodivona', 'variable' (specify per package)
      - Default: 'variable' (client will specify for each package)
    
  2. Purpose
    - Store default pickup location preference for each client
    - Auto-suggest pickup location when packages arrive in Tana
    - Streamline logistics by knowing client preferences in advance
    
  3. Security
    - No RLS changes needed (existing policies cover this field)
*/

-- Add preferred pickup location field to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'point_enlevement_prefere'
  ) THEN
    ALTER TABLE clients ADD COLUMN point_enlevement_prefere text 
      CHECK (point_enlevement_prefere IN ('depot_anosizato', 'bureaux_ambodivona', 'variable'))
      DEFAULT 'variable';
    COMMENT ON COLUMN clients.point_enlevement_prefere IS 'Client preferred default pickup location';
  END IF;
END $$;
