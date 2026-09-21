/*
# Add modification counter to notes_debit

## Summary
Adds a `nombre_modifications` column to the `notes_debit` table to track how
many times each note has been edited. A database trigger automatically
increments this counter on every UPDATE. The counter starts at 0 (never
modified) and increases by 1 each time the note is saved.

## Changes

### Column added
- `notes_debit.nombre_modifications` (integer, NOT NULL, default 0) —
  counts the number of times the note has been modified. 0 = never modified
  (just generated), 1+ = modified N times.

### Trigger added
- `trg_notes_debit_increment_modifications` — a BEFORE UPDATE trigger that
  increments `nombre_modifications` by 1 on every row update. This is
  automatic and cannot be bypassed by the application layer.

## Security
- No RLS policy changes. Existing UPDATE policy (admin-only) remains in force.
- The trigger function is SECURITY DEFINER with a fixed search_path to avoid
  privilege escalation.
*/

ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS nombre_modifications integer NOT NULL DEFAULT 0;

-- Backfill existing rows (already 0 by default, but explicit for clarity)
UPDATE notes_debit SET nombre_modifications = 0 WHERE nombre_modifications IS NULL;

CREATE OR REPLACE FUNCTION increment_note_debit_modifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.nombre_modifications := COALESCE(OLD.nombre_modifications, 0) + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_debit_increment_modifications ON notes_debit;

CREATE TRIGGER trg_notes_debit_increment_modifications
  BEFORE UPDATE ON notes_debit
  FOR EACH ROW
  EXECUTE FUNCTION increment_note_debit_modifications();
