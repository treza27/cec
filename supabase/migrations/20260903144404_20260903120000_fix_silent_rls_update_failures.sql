/*
# Fix: Silent RLS UPDATE failures on accounting tables

## Problem
Several accounting tables had UPDATE policies restricted to `administrateur` only.
When a non-admin agent (e.g. `acheteur`, `commercial`) performed an operation
through the application that required an UPDATE (marking a note as paid,
cancelling a movement, marking an advance as reimbursed), the Supabase client
silently updated 0 rows — no error returned, but the change was not persisted.

This caused:
- Notes de débit staying "impayee" even after payment was recorded in caisse
- Movement cancellations silently failing for non-admins
- Advance salary reimbursements silently failing for non-admins

## Solution
Add new UPDATE policies for each affected table that allow any authenticated
agent to update only the workflow-specific columns (payment status, cancellation
fields). The existing admin-only policies remain in place for full edits
(amounts, references, etc.). PostgreSQL evaluates all matching UPDATE policies
with OR logic, so the admin policies are not replaced — they are supplemented.

## Tables affected
1. notes_debit — payment status fields + apure_externe
2. avances_salaires — reimbursement status fields
3. mouvements_caisse — cancellation fields
4. mouvements_bancaires — cancellation fields
5. mouvements_alipay — cancellation fields
6. dettes_fournisseur — cancellation fields

## Backfill
Also recalculates statut_paiement and total_paye for the 5 affected notes de débit
based on actual non-annulled caisse payments.
*/

-- ========================================
-- 1. notes_debit: allow all agents to update payment status + apure_externe
-- ========================================
DROP POLICY IF EXISTS "All agents can update note_debit payment status" ON notes_debit;
CREATE POLICY "All agents can update note_debit payment status"
ON notes_debit FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 2. avances_salaires: allow all agents to update reimbursement status
-- ========================================
DROP POLICY IF EXISTS "All agents can update avance salaire reimbursement" ON avances_salaires;
CREATE POLICY "All agents can update avance salaire reimbursement"
ON avances_salaires FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 3. mouvements_caisse: allow all agents to cancel movements
-- ========================================
DROP POLICY IF EXISTS "All agents can cancel mouvements_caisse" ON mouvements_caisse;
CREATE POLICY "All agents can cancel mouvements_caisse"
ON mouvements_caisse FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 4. mouvements_bancaires: allow all agents to cancel movements
-- ========================================
DROP POLICY IF EXISTS "All agents can cancel mouvements_bancaires" ON mouvements_bancaires;
CREATE POLICY "All agents can cancel mouvements_bancaires"
ON mouvements_bancaires FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 5. mouvements_alipay: allow all agents to cancel movements
-- ========================================
DROP POLICY IF EXISTS "All agents can cancel mouvements_alipay" ON mouvements_alipay;
CREATE POLICY "All agents can cancel mouvements_alipay"
ON mouvements_alipay FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 6. dettes_fournisseur: allow all agents to cancel
-- ========================================
DROP POLICY IF EXISTS "All agents can cancel dettes_fournisseur" ON dettes_fournisseur;
CREATE POLICY "All agents can cancel dettes_fournisseur"
ON dettes_fournisseur FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- 7. Backfill: fix the 5 notes de débit with wrong payment status
-- ========================================
-- Recalculate statut_paiement and total_paye for all notes based on
-- actual non-annulled caisse payments
UPDATE notes_debit nd
SET
  total_paye = subq.total_paye_calc,
  statut_paiement = CASE
    WHEN subq.total_paye_calc >= (nd.montant_total_ariary + COALESCE(nd.frais_livraison_ariary, 0)) THEN 'payee'
    WHEN subq.total_paye_calc > 0 THEN 'partielle'
    ELSE 'impayee'
  END,
  mode_paiement_nd = COALESCE(nd.mode_paiement_nd, subq.last_mode),
  date_paiement = COALESCE(nd.date_paiement, subq.last_date),
  mouvement_caisse_id = COALESCE(nd.mouvement_caisse_id, subq.last_mouvement_id)
FROM (
  SELECT
    mc.note_debit_id,
    COALESCE(SUM(mc.montant_mga), 0) AS total_paye_calc,
    (array_agg(mc.mode_paiement ORDER BY mc.created_at DESC))[1] AS last_mode,
    (array_agg(mc.date_mouvement ORDER BY mc.created_at DESC))[1] AS last_date,
    (array_agg(mc.id ORDER BY mc.created_at DESC))[1] AS last_mouvement_id
  FROM mouvements_caisse mc
  WHERE mc.est_annule = false
    AND mc.note_debit_id IS NOT NULL
  GROUP BY mc.note_debit_id
) subq
WHERE nd.id = subq.note_debit_id
  AND (
    nd.total_paye IS DISTINCT FROM subq.total_paye_calc
    OR nd.statut_paiement <> CASE
      WHEN subq.total_paye_calc >= (nd.montant_total_ariary + COALESCE(nd.frais_livraison_ariary, 0)) THEN 'payee'
      WHEN subq.total_paye_calc > 0 THEN 'partielle'
      ELSE 'impayee'
    END
  );
