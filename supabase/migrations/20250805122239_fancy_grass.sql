/*
  # Disable RLS completely for package_images table

  1. Changes
    - Disable Row Level Security on package_images table
    - Remove all existing policies
    - Create storage policies for package-images bucket

  This will allow all authenticated users to perform operations on the package_images table
  without RLS restrictions.
*/

-- Disable RLS on package_images table
ALTER TABLE package_images DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on package_images table
DROP POLICY IF EXISTS "Allow all for authenticated users" ON package_images;
DROP POLICY IF EXISTS "Users can manage package images" ON package_images;
DROP POLICY IF EXISTS "Authenticated users can manage package images" ON package_images;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'package-images');

CREATE POLICY "Allow authenticated users to view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'package-images');

CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'package-images');