/*
  # Permettre la lecture anonyme des clients pour le suivi des colis

  1. Sécurité
    - Ajouter une politique pour permettre aux utilisateurs anonymes de lire la table `clients`
    - Ajouter une politique pour permettre aux utilisateurs anonymes de lire la table `client_shipping_marks`
    - Ces politiques sont nécessaires pour que le formulaire de suivi des colis fonctionne

  2. Vérifications
    - Vérifier l'existence des politiques avant de les créer pour éviter les erreurs de doublons
*/

-- Vérifier et créer la politique pour la table clients si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND policyname = 'Allow anonymous read access for package tracking'
  ) THEN
    CREATE POLICY "Allow anonymous read access for package tracking"
      ON clients
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Vérifier et créer la politique pour la table client_shipping_marks si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'client_shipping_marks' 
    AND policyname = 'Allow anonymous read access to shipping marks for tracking'
  ) THEN
    CREATE POLICY "Allow anonymous read access to shipping marks for tracking"
      ON client_shipping_marks
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;