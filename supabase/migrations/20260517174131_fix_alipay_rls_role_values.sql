/*
  # Correction des politiques RLS Alipay

  ## Problème
  Les politiques INSERT et UPDATE sur comptes_alipay et mouvements_alipay
  vérifiaient role IN ('admin', 'superadmin'), alors que le rôle réel dans
  la base est 'administrateur' (cohérent avec toutes les autres tables).

  ## Corrections
  - Suppression et recréation des politiques admin sur comptes_alipay
  - Suppression et recréation de la politique UPDATE sur mouvements_alipay
*/

-- comptes_alipay: corriger INSERT
DROP POLICY IF EXISTS "Admins can insert comptes alipay" ON comptes_alipay;
CREATE POLICY "Admins can insert comptes alipay"
  ON comptes_alipay FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );

-- comptes_alipay: corriger UPDATE
DROP POLICY IF EXISTS "Admins can update comptes alipay" ON comptes_alipay;
CREATE POLICY "Admins can update comptes alipay"
  ON comptes_alipay FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );

-- mouvements_alipay: corriger UPDATE (annulation)
DROP POLICY IF EXISTS "Admins can update mouvements alipay" ON mouvements_alipay;
CREATE POLICY "Admins can update mouvements alipay"
  ON mouvements_alipay FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );
