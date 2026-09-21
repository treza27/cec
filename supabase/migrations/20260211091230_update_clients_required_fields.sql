/*
  # Update clients table - Modify required fields
  
  1. Changes
    - Make `nom` column nullable (was NOT NULL)
    - Make `pseudo` column NOT NULL (was nullable)
    - Make `telephone` column NOT NULL (was nullable)
    - Add CHECK constraint on `pseudo` to ensure minimum 3 characters
    - Add CHECK constraint on `telephone` to ensure not empty
  
  2. Rationale
    - Only Prénom, Pseudo, and Téléphone are required fields
    - Nom becomes optional
    - Pseudo must be manually entered (not auto-generated)
    - Shipping marks become optional (handled at application level)
  
  3. Notes
    - Safe migration with IF EXISTS/IF NOT EXISTS checks
    - Constraints ensure data quality
    - Backwards compatible with existing data
*/

-- Make nom nullable (if it's NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'nom' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE clients ALTER COLUMN nom DROP NOT NULL;
  END IF;
END $$;

-- Make pseudo NOT NULL (if it's nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'pseudo' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any existing NULL values with a temporary value
    UPDATE clients SET pseudo = prenom WHERE pseudo IS NULL OR pseudo = '';
    
    -- Then make it NOT NULL
    ALTER TABLE clients ALTER COLUMN pseudo SET NOT NULL;
  END IF;
END $$;

-- Make telephone NOT NULL (if it's nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'telephone' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any existing NULL values with a temporary value
    UPDATE clients SET telephone = '+261000000000' WHERE telephone IS NULL OR telephone = '';
    
    -- Then make it NOT NULL
    ALTER TABLE clients ALTER COLUMN telephone SET NOT NULL;
  END IF;
END $$;

-- Add CHECK constraint on pseudo to ensure minimum 3 characters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_pseudo_min_length'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_pseudo_min_length 
    CHECK (length(trim(pseudo)) >= 3);
  END IF;
END $$;

-- Add CHECK constraint on telephone to ensure not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_telephone_not_empty'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_telephone_not_empty 
    CHECK (length(trim(telephone)) > 0);
  END IF;
END $$;