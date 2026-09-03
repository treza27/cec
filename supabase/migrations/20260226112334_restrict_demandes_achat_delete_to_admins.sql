/*
  # Restrict DELETE on demandes_achat to Admin role only

  ## Changes
  - Drop the existing open DELETE policy that allows any authenticated user to delete
  - Create a new DELETE policy restricted to employees with role 'Admin'

  ## Security
  - Only users whose employee profile has role = 'Admin' can delete purchase requests
  - Consistent with the pattern used for inventory table deletion
*/

DROP POLICY IF EXISTS "Authenticated users can delete demandes_achat" ON demandes_achat;

CREATE POLICY "Only admins can delete demandes_achat"
  ON demandes_achat FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'Admin'
    )
  );
