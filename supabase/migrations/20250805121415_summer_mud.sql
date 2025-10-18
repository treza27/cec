/*
  # Create package_images table

  1. New Tables
    - `package_images`
      - `id` (uuid, primary key)
      - `inventaire_id` (bigint, foreign key to inventaire table)
      - `file_name` (text, original file name)
      - `file_path` (text, path in storage)
      - `file_size` (bigint, file size in bytes)
      - `mime_type` (text, file MIME type)
      - `image_type` (text, type of image: general, msds, chargement, etc.)
      - `uploaded_by` (uuid, user who uploaded)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, update timestamp)

  2. Security
    - Enable RLS on `package_images` table
    - Add policy for authenticated users to manage their images

  3. Storage
    - Create storage bucket for package images
    - Set up storage policies
*/

-- Create the package_images table
CREATE TABLE IF NOT EXISTS package_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaire_id bigint NOT NULL,
  file_name text NOT NULL,
  file_path text UNIQUE NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0),
  mime_type text NOT NULL,
  image_type text NOT NULL DEFAULT 'general' CHECK (image_type IN ('general', 'msds', 'chargement', 'suivi_maritime', 'reception')),
  uploaded_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to inventaire table
ALTER TABLE package_images 
ADD CONSTRAINT fk_package_images_inventaire 
FOREIGN KEY (inventaire_id) REFERENCES inventaire(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_package_images_inventaire_id ON package_images(inventaire_id);
CREATE INDEX IF NOT EXISTS idx_package_images_image_type ON package_images(image_type);
CREATE INDEX IF NOT EXISTS idx_package_images_created_at ON package_images(created_at);

-- Enable Row Level Security
ALTER TABLE package_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view package images"
  ON package_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert package images"
  ON package_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update package images"
  ON package_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete package images"
  ON package_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for package images
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Authenticated users can view package images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'package-images');

CREATE POLICY "Authenticated users can upload package images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'package-images');

CREATE POLICY "Authenticated users can update package images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'package-images');

CREATE POLICY "Authenticated users can delete package images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'package-images');

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_package_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_package_images_updated_at
  BEFORE UPDATE ON package_images
  FOR EACH ROW
  EXECUTE FUNCTION update_package_images_updated_at();