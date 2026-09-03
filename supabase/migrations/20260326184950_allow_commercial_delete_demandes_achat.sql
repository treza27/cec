/*
  # Allow commercial role to delete demandes_achat

  ## Changes
  - Drop the existing admin-only DELETE policy on demandes_achat
  - Create a new DELETE policy that allows both 'administrateur' and 'commercial' roles

  ## Security
  - Admins and commercials can delete purchase requests
  - All other roles remain restricted
*/

DROP POLICY IF EXISTS "Only admins can delete demandes_achat" ON demandes_achat;

CREATE POLICY "Admins and commercials can delete demandes_achat"
  ON demandes_achat FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role IN ('administrateur', 'commercial', 'Admin')
    )
  );
