-- Add code column to catalogue_categories
ALTER TABLE catalogue_categories ADD COLUMN IF NOT EXISTS code text;

-- Populate code from category name for existing categories
UPDATE catalogue_categories
SET code = UPPER(SUBSTRING(nom FROM 1 FOR 3))
WHERE code IS NULL OR TRIM(code) = '';

-- Rename quantite_minimum to moq in catalogue_produits
ALTER TABLE catalogue_produits RENAME COLUMN quantite_minimum TO moq;

-- Add numero as auto-increment identity
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS numero integer GENERATED ALWAYS AS IDENTITY;

-- Add reference_produit
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS reference_produit text;

-- Add new supplier/logistics fields
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS code_fournisseur text;
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS prix_exw_rmb numeric(15,4);
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS prix_exw_usd numeric(15,4);
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS unite text;
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS quantite_par_unite numeric(15,4);
ALTER TABLE catalogue_produits ADD COLUMN IF NOT EXISTS volume_par_unite numeric(15,4);

-- Trigger function: auto-generate reference_produit on insert
CREATE OR REPLACE FUNCTION generate_catalogue_produit_reference()
RETURNS TRIGGER AS $$
DECLARE
  cat_code text;
  next_num integer;
BEGIN
  SELECT COALESCE(NULLIF(TRIM(code), ''), UPPER(SUBSTRING(nom FROM 1 FOR 3)))
  INTO cat_code
  FROM catalogue_categories
  WHERE id = NEW.categorie_id;

  SELECT COUNT(*) + 1 INTO next_num
  FROM catalogue_produits
  WHERE categorie_id = NEW.categorie_id;

  NEW.reference_produit := cat_code || '-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

DROP TRIGGER IF EXISTS trg_catalogue_produit_reference ON catalogue_produits;
CREATE TRIGGER trg_catalogue_produit_reference
BEFORE INSERT ON catalogue_produits
FOR EACH ROW
EXECUTE FUNCTION generate_catalogue_produit_reference();

-- Populate reference_produit for existing products
DO $$
DECLARE
  r RECORD;
  cat_code text;
BEGIN
  FOR r IN (
    SELECT cp.id, cp.categorie_id,
           ROW_NUMBER() OVER (PARTITION BY cp.categorie_id ORDER BY cp.created_at, cp.id) AS rn
    FROM catalogue_produits cp
    WHERE cp.reference_produit IS NULL
  ) LOOP
    SELECT COALESCE(NULLIF(TRIM(code), ''), UPPER(SUBSTRING(nom FROM 1 FOR 3)))
    INTO cat_code
    FROM catalogue_categories
    WHERE id = r.categorie_id;

    UPDATE catalogue_produits
    SET reference_produit = cat_code || '-' || LPAD(r.rn::text, 3, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;
