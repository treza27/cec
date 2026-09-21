/*
  # Fix final pour la table package_images
  
  1. Désactiver complètement RLS
  2. Supprimer toutes les politiques existantes
  3. Accorder toutes les permissions
  4. Modifier la colonne uploaded_by pour accepter NULL
*/

-- Désactiver RLS complètement
ALTER TABLE public.package_images DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'package_images'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Modifier la colonne uploaded_by pour accepter NULL
ALTER TABLE public.package_images ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.package_images ALTER COLUMN uploaded_by DROP DEFAULT;

-- Accorder toutes les permissions sur la table
GRANT ALL ON public.package_images TO anon;
GRANT ALL ON public.package_images TO authenticated;
GRANT ALL ON public.package_images TO service_role;

-- Accorder les permissions sur la séquence si elle existe
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Vérifier que RLS est bien désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ACTIVÉ ❌' 
        ELSE 'RLS DÉSACTIVÉ ✅' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'package_images';