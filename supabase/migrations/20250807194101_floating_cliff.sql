/*
  # Désactiver complètement RLS pour package_images

  1. Désactiver RLS sur la table package_images
  2. Supprimer toutes les politiques existantes
  3. Accorder les permissions nécessaires
  4. Vérifier la configuration
*/

-- Désactiver RLS sur la table package_images
ALTER TABLE public.package_images DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur package_images
DROP POLICY IF EXISTS "Allow authenticated uploads" ON public.package_images;
DROP POLICY IF EXISTS "Allow public read access" ON public.package_images;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON public.package_images;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.package_images;
DROP POLICY IF EXISTS "Users can manage their own images" ON public.package_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.package_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.package_images;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.package_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.package_images;

-- Accorder toutes les permissions sur la table aux rôles anon et authenticated
GRANT ALL ON public.package_images TO anon;
GRANT ALL ON public.package_images TO authenticated;
GRANT ALL ON public.package_images TO service_role;

-- Accorder les permissions sur la séquence si elle existe
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Vérifier que RLS est bien désactivé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'package_images' AND schemaname = 'public';