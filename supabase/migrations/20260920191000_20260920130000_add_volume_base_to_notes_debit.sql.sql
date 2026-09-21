/*
# Add volume_base column to notes_debit

1. Changes
- Add `volume_base` column to `notes_debit` table.
- Type: text, NOT NULL, default 'contre_mesure'.
- Allowed values: 'theorique' or 'contre_mesure'.
- Backfill existing rows to 'contre_mesure' (the previous behavior always used the contre-mesure volume).
2. Security
- No RLS policy changes. Existing policies remain unchanged.
3. Notes
- This column records which volume (theoretical vs counter-measured) was used
  as the basis for the freight calculation when the note was created.
- Existing notes are backfilled to 'contre_mesure' to preserve backward compatibility.
*/

ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS volume_base text NOT NULL DEFAULT 'contre_mesure';

-- Backfill any NULL or missing values (should not occur with NOT NULL DEFAULT, but safety)
UPDATE notes_debit SET volume_base = 'contre_mesure' WHERE volume_base IS NULL OR volume_base NOT IN ('theorique', 'contre_mesure');

-- Add a check constraint to enforce valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_debit_volume_base_check'
  ) THEN
    ALTER TABLE notes_debit
      ADD CONSTRAINT notes_debit_volume_base_check
      CHECK (volume_base IN ('theorique', 'contre_mesure'));
  END IF;
END $$;
