/*
  # Add mode_paiement to mouvements_bancaires

  ## Summary
  Adds an optional `mode_paiement` column to the `mouvements_bancaires` table
  to track the form of payment used for each bank movement.

  ## Changes
  - `mouvements_bancaires`: new nullable column `mode_paiement` (text)
    - Accepted values for entrées: depot_especes, depot_cheque, virement_recu, autre
    - Accepted values for sorties: virement_emis, cheque_emis, prelevement, autre
    - NULL for existing rows (retroactively unknown)

  ## Notes
  - Column is nullable so existing data is unaffected
  - No RLS changes needed (column inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'mode_paiement'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN mode_paiement text DEFAULT NULL;
  END IF;
END $$;
