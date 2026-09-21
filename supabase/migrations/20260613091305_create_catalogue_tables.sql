-- Catalogue categories
CREATE TABLE catalogue_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalogue_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_catalogue_categories" ON catalogue_categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "agents_insert_catalogue_categories" ON catalogue_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "agents_update_catalogue_categories" ON catalogue_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "agents_delete_catalogue_categories" ON catalogue_categories
  FOR DELETE TO authenticated USING (true);

-- Catalogue products
CREATE TABLE catalogue_produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id uuid NOT NULL REFERENCES catalogue_categories(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  prix_ariary numeric(15,0) NOT NULL DEFAULT 0,
  quantite_minimum integer NOT NULL DEFAULT 1,
  actif boolean NOT NULL DEFAULT true,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalogue_produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_catalogue_produits_actifs" ON catalogue_produits
  FOR SELECT TO anon, authenticated USING (actif = true);

CREATE POLICY "agents_select_all_catalogue_produits" ON catalogue_produits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "agents_insert_catalogue_produits" ON catalogue_produits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "agents_update_catalogue_produits" ON catalogue_produits
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "agents_delete_catalogue_produits" ON catalogue_produits
  FOR DELETE TO authenticated USING (true);

-- Catalogue product photos
CREATE TABLE catalogue_produit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid NOT NULL REFERENCES catalogue_produits(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalogue_produit_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_catalogue_photos" ON catalogue_produit_photos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "agents_insert_catalogue_photos" ON catalogue_produit_photos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "agents_update_catalogue_photos" ON catalogue_produit_photos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "agents_delete_catalogue_photos" ON catalogue_produit_photos
  FOR DELETE TO authenticated USING (true);

-- Updated_at trigger for catalogue_produits
CREATE OR REPLACE FUNCTION update_catalogue_produits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_catalogue_produits_updated_at
  BEFORE UPDATE ON catalogue_produits
  FOR EACH ROW EXECUTE FUNCTION update_catalogue_produits_updated_at();

-- Storage bucket for catalogue photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalogue-photos',
  'catalogue-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "public_read_catalogue_storage" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'catalogue-photos');

CREATE POLICY "agents_upload_catalogue_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalogue-photos');

CREATE POLICY "agents_delete_catalogue_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catalogue-photos');
