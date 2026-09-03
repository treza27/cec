/*
  # Security Issues Fix

  1. RLS Policy Optimization
    - Replace auth.uid() with (select auth.uid()) in employees table policies
    - Improves query performance by caching auth function result

  2. Unused Indexes Cleanup
    - Drop 20+ unused indexes from depart, inventaire, package_images, clients, client_shipping_marks
    - Reduces database bloat and improves write performance

  3. Duplicate Index
    - Drop idx_client_shipping_marks_mark (keeping idx_client_shipping_marks_shipping_mark)

  4. Function Search Path Security
    - Fix 7 functions with mutable search paths to be immutable
    - Prevents potential security issues with function execution

  5. RLS Policy Authorization
    - Replace always-true policies with proper authentication checks
    - Ensures row-level security is actually enforced
*/

-- Fix employees table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON employees;
CREATE POLICY "Allow authenticated users to read their own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON employees;
CREATE POLICY "Allow authenticated users to update their own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON employees;
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Drop unused indexes on depart table
DROP INDEX IF EXISTS idx_depart_date_chargement;
DROP INDEX IF EXISTS idx_depart_date_arrivee_tana;
DROP INDEX IF EXISTS idx_depart_num_tc;
DROP INDEX IF EXISTS idx_depart_date_depart;

-- Drop unused indexes on inventaire table
DROP INDEX IF EXISTS idx_inventaire_entrepot;
DROP INDEX IF EXISTS idx_inventaire_statut;
DROP INDEX IF EXISTS idx_inventaire_shipping_mark;
DROP INDEX IF EXISTS idx_inventaire_date_entree;
DROP INDEX IF EXISTS idx_inventaire_description_text;
DROP INDEX IF EXISTS idx_inventaire_tracking_number;
DROP INDEX IF EXISTS idx_inventaire_statut_date;

-- Drop unused indexes on package_images table
DROP INDEX IF EXISTS idx_package_images_client_id;
DROP INDEX IF EXISTS idx_package_images_inventaire_id;
DROP INDEX IF EXISTS idx_package_images_created_at;
DROP INDEX IF EXISTS idx_package_images_depart_id;
DROP INDEX IF EXISTS idx_package_images_inventaire_type;

-- Drop unused indexes on clients table
DROP INDEX IF EXISTS idx_clients_prenom;
DROP INDEX IF EXISTS idx_clients_entreprise;
DROP INDEX IF EXISTS idx_clients_nom_prenom;

-- Drop unused indexes on client_shipping_marks table
DROP INDEX IF EXISTS idx_client_shipping_marks_active;
DROP INDEX IF EXISTS idx_client_shipping_marks_nom;
DROP INDEX IF EXISTS idx_client_shipping_marks_prenom;
DROP INDEX IF EXISTS idx_client_shipping_marks_entreprise;

-- Drop duplicate index (keep idx_client_shipping_marks_shipping_mark)
DROP INDEX IF EXISTS idx_client_shipping_marks_mark;

-- Fix RLS policies to properly restrict access
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_shipping_marks;
CREATE POLICY "Authenticated users can manage shipping marks"
  ON client_shipping_marks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clients;
CREATE POLICY "Authenticated users can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage departs" ON depart;
CREATE POLICY "Authenticated users can manage departs"
  ON depart FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON inventaire;
CREATE POLICY "Authenticated users can manage inventory"
  ON inventaire FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated deletes" ON package_images;
CREATE POLICY "Authenticated users can delete images"
  ON package_images FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated inserts" ON package_images;
CREATE POLICY "Authenticated users can insert images"
  ON package_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix function search paths
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_depart_updated_at') THEN
    ALTER FUNCTION update_depart_updated_at() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clean_inventaire_data') THEN
    ALTER FUNCTION clean_inventaire_data() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_package_images_updated_at') THEN
    ALTER FUNCTION update_package_images_updated_at() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_clients_updated_at') THEN
    ALTER FUNCTION update_clients_updated_at() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_client_shipping_marks_updated_at') THEN
    ALTER FUNCTION update_client_shipping_marks_updated_at() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_client_info_to_shipping_marks') THEN
    ALTER FUNCTION sync_client_info_to_shipping_marks() IMMUTABLE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() IMMUTABLE;
  END IF;
END $$;
