-- Table des fournisseurs du catalogue
CREATE TABLE catalogue_fournisseurs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text,
  code_fournisseur text,
  categorie_id uuid REFERENCES catalogue_categories(id) ON DELETE SET NULL,
  nom_usine text NOT NULL,
  contact text,
  telephone_wechat text,
  ville text,
  adresse text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE catalogue_fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_fournisseurs" ON catalogue_fournisseurs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_fournisseurs" ON catalogue_fournisseurs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_fournisseurs" ON catalogue_fournisseurs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_fournisseurs" ON catalogue_fournisseurs
  FOR DELETE TO authenticated USING (true);

-- Trigger: auto-generate numero (F01, F02...) and code_fournisseur (SAN-F01...)
CREATE OR REPLACE FUNCTION generate_fournisseur_codes()
RETURNS TRIGGER AS $$
DECLARE
  global_num integer;
  cat_code text;
  cat_num integer;
BEGIN
  -- Global sequential numero: F01, F02...
  SELECT COUNT(*) + 1 INTO global_num FROM catalogue_fournisseurs;
  NEW.numero := 'F' || LPAD(global_num::text, 2, '0');

  -- code_fournisseur = cat_code + '-F' + sequential within category
  IF NEW.categorie_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(code), ''), UPPER(SUBSTRING(nom FROM 1 FOR 3)))
    INTO cat_code
    FROM catalogue_categories
    WHERE id = NEW.categorie_id;

    SELECT COUNT(*) + 1 INTO cat_num
    FROM catalogue_fournisseurs
    WHERE categorie_id = NEW.categorie_id;
  ELSE
    cat_code := 'GEN';
    SELECT COUNT(*) + 1 INTO cat_num
    FROM catalogue_fournisseurs
    WHERE categorie_id IS NULL;
  END IF;

  NEW.code_fournisseur := cat_code || '-F' || LPAD(cat_num::text, 2, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE TRIGGER trg_fournisseur_codes
BEFORE INSERT ON catalogue_fournisseurs
FOR EACH ROW
EXECUTE FUNCTION generate_fournisseur_codes();

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_fournisseur_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fournisseur_updated_at
BEFORE UPDATE ON catalogue_fournisseurs
FOR EACH ROW
EXECUTE FUNCTION update_fournisseur_updated_at();
