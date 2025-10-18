/*
  # Autoriser la lecture anonyme de la table clients pour le suivi des colis

  1. Nouvelle politique RLS
    - Permet aux utilisateurs anonymes (non connectés) de lire la table `clients`
    - Nécessaire pour que le formulaire de suivi des colis puisse rechercher les clients par pseudo
    - Maintient la sécurité en autorisant uniquement la lecture (SELECT)

  2. Sécurité
    - Seule la lecture est autorisée pour les utilisateurs anonymes
    - Les opérations de création, modification et suppression restent réservées aux utilisateurs authentifiés
    - Cette politique complète la politique existante sans la remplacer
*/

-- Créer une nouvelle politique pour permettre la lecture anonyme de la table clients
CREATE POLICY "Allow anonymous read access for package tracking"
  ON clients
  FOR SELECT
  TO anon
  USING (true);

-- Optionnel : Créer une politique similaire pour la table client_shipping_marks
-- car elle est nécessaire pour récupérer les shipping marks des clients
CREATE POLICY "Allow anonymous read access to shipping marks for tracking"
  ON client_shipping_marks
  FOR SELECT
  TO anon
  USING (true);