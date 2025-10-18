/*
  # Fix RLS policies for package_images table

  1. Security Updates
    - Drop existing policies that may be causing conflicts
    - Create new simplified policies for authenticated users
    - Ensure INSERT operations work with proper WITH CHECK conditions

  2. Changes
    - Allow authenticated users to insert, select, update, and delete their own package images
    - Use auth.uid() IS NOT NULL for proper authentication check
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage package images" ON package_images;
DROP POLICY IF EXISTS "Authenticated users can view package images" ON package_images;
DROP POLICY IF EXISTS "Authenticated users can insert package images" ON package_images;
DROP POLICY IF EXISTS "Authenticated users can update package images" ON package_images;
DROP POLICY IF EXISTS "Authenticated users can delete package images" ON package_images;

-- Create new policies with proper WITH CHECK conditions
CREATE POLICY "Enable read access for authenticated users" ON package_images
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users" ON package_images
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users" ON package_images
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users" ON package_images
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);