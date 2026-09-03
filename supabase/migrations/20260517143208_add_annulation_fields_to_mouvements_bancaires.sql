/*
  # Add annulation fields to mouvements_bancaires

  ## Summary
  The mouvements_bancaires table was missing the cancellation tracking columns
  that exist on mouvements_caisse. This caused errors when trying to cancel a
  caisse movement that has a linked bank movement, because the service tried to
  write annule_par_id, annule_at, and motif_annulation to the bank table.

  ## Changes
  - `mouvements_bancaires`
    - Add `annule_par_id` (uuid, nullable) — who cancelled the movement
    - Add `annule_at` (timestamptz, nullable) — when it was cancelled
    - Add `motif_annulation` (text, nullable) — reason for cancellation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'annule_par_id'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN annule_par_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'annule_at'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN annule_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'motif_annulation'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN motif_annulation text;
  END IF;
END $$;
