/*
  # Restriction de la suppression de l'inventaire aux administrateurs uniquement

  1. Changements de sécurité
    - Sépare la politique globale en politiques spécifiques par opération
    - Suppression (DELETE) : réservée uniquement aux utilisateurs avec le rôle 'Admin'
    - Lecture (SELECT) : tous les utilisateurs authentifiés
    - Insertion (INSERT) : tous les utilisateurs authentifiés
    - Mise à jour (UPDATE) : tous les utilisateurs authentifiés

  2. Sécurité
    - La suppression de colis nécessite le rôle 'Admin' dans la table employees
    - Les autres opérations restent disponibles pour tous les employés authentifiés
*/

-- Supprimer l'ancienne politique globale
DROP POLICY IF EXISTS "Authenticated users can manage inventory" ON inventaire;

-- Créer des politiques spécifiques par opération

-- SELECT : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can read inventory"
  ON inventaire FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : tous les utilisateurs authentifiés peuvent insérer
CREATE POLICY "Authenticated users can insert inventory"
  ON inventaire FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE : tous les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update inventory"
  ON inventaire FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE : seuls les admins peuvent supprimer
CREATE POLICY "Only admins can delete inventory"
  ON inventaire FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'Admin'
    )
  );