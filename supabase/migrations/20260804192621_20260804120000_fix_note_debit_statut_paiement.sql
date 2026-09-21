/*
# Fix note de debit statut paiement and add total_paye column

## Context
The `marquerPayee` function in the frontend was writing `'paye'` instead of `'payee'`
to `notes_debit.statut_paiement`. The database CHECK constraint only allows
`'impayee'`, `'payee'`, `'partielle'`, so every update was silently rejected.
As a result, notes that were actually paid remained stuck at `'impayee'`.

## Changes

### 1. New column
- `notes_debit.total_paye` (numeric, default 0) — caches the sum of all
  non-annulated `mouvements_caisse` rows linked to the note via `note_debit_id`.
  This lets the frontend display the remaining amount for partial payments
  without an extra query.

### 2. Data repair
- For every `notes_debit` row that has at least one non-annulated
  `mouvements_caisse` linked to it, recompute `total_paye` and set
  `statut_paiement` to `'payee'` (if total_paye >= montant_total + frais) or
  `'partielle'` (if 0 < total_paye < montant_total + frais).
- Notes with no linked payments keep their current statut (expected: impayee).

### 3. Idempotency
- Uses `IF NOT EXISTS` for the column addition.
- The UPDATE is safe to re-run: it always recomputes from current data.

## Security
- No RLS or policy changes.
*/

-- 1. Add total_paye column
ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS total_paye numeric NOT NULL DEFAULT 0;

-- 2. Recompute total_paye and statut_paiement from actual mouvements_caisse
UPDATE notes_debit nd
SET
  total_paye = sub.total_paye,
  statut_paiement = CASE
    WHEN sub.total_paye >= (nd.montant_total_ariary + COALESCE(nd.frais_livraison_ariary, 0)) THEN 'payee'
    WHEN sub.total_paye > 0 THEN 'partielle'
    ELSE 'impayee'
  END
FROM (
  SELECT
    mc.note_debit_id,
    COALESCE(SUM(mc.montant_mga), 0) AS total_paye
  FROM mouvements_caisse mc
  WHERE mc.note_debit_id IS NOT NULL
    AND mc.est_annule = false
  GROUP BY mc.note_debit_id
) sub
WHERE sub.note_debit_id = nd.id;
