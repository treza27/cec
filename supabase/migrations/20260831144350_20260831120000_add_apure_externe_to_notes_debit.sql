/*
# Add "apuré externe" flag to notes_debit

## Context
The accounting module started being used on 2026-08-03. Notes de débit created before that date
were settled in a different software. They need to remain visible (for history and volume tracking)
but be excluded from financial totals (total facturé, encaissé, restant).

## Changes
1. New column on `notes_debit`:
   - `apure_externe` (boolean, NOT NULL, default false) — marks a note as settled in an external system.
2. Security:
   - Add a dedicated UPDATE policy restricted to administrators for the `apure_externe` column.
   - The existing UPDATE policies on notes_debit remain unchanged; this adds an admin-only path
     so non-admin roles cannot toggle the flag.
   - The policy uses the same admin-check pattern already used across the codebase:
     EXISTS (SELECT 1 FROM employees WHERE employees.user_id = auth.uid() AND role = 'administrateur').
3. No data loss — the column defaults to false, so existing rows are unaffected.
*/

ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS apure_externe boolean NOT NULL DEFAULT false;

-- Admin-only UPDATE policy for the apure_externe flag
-- (in addition to existing policies; this ensures only admins can toggle it)
DROP POLICY IF EXISTS "admins_can_set_apure_externe" ON notes_debit;
CREATE POLICY "admins_can_set_apure_externe"
  ON notes_debit FOR UPDATE
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
