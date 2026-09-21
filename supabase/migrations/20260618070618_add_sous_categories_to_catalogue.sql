-- Table des sous-catégories
CREATE TABLE catalogue_sous_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie_id uuid NOT NULL REFERENCES catalogue_categories(id) ON DELETE CASCADE,
  nom text NOT NULL,
  code text,
  ordre integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE catalogue_sous_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_sous_categories" ON catalogue_sous_categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_select_sous_categories" ON catalogue_sous_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_sous_categories" ON catalogue_sous_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_sous_categories" ON catalogue_sous_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_sous_categories" ON catalogue_sous_categories
  FOR DELETE TO authenticated USING (true);

-- Colonne sous_categorie_id dans catalogue_produits
ALTER TABLE catalogue_produits
  ADD COLUMN IF NOT EXISTS sous_categorie_id uuid REFERENCES catalogue_sous_categories(id) ON DELETE SET NULL;
