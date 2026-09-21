-- Allow acheteur role to view active bank accounts (needed for virement/transfert dropdowns)
CREATE POLICY "Acheteurs can view active comptes_bancaires"
  ON comptes_bancaires FOR SELECT
  TO authenticated
  USING (
    est_actif = true
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'acheteur'
    )
  );
