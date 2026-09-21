/*
  # Politique RLS : Les admins peuvent lire tous les employés

  1. Changements
    - Ajoute une politique SELECT permettant aux utilisateurs avec le rôle 'Admin' dans la table employees de lire tous les enregistrements
    - Ajoute une politique UPDATE permettant aux admins de modifier n'importe quel employé
*/

CREATE POLICY "Admins can read all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update all employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.role = 'Admin'
    )
  );
