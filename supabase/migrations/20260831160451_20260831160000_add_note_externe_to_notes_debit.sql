/*
# Add note_externe column to notes_debit

1. Modified Tables
- `notes_debit`: add `note_externe` (text, nullable) — free-form external comments
  visible on the printed note de débit. Stored alongside the existing financial
  fields and readable/writable by authenticated users via the existing policies.
2. Security
- No policy changes needed: the existing SELECT/INSERT/UPDATE policies on
  notes_debit already cover all columns (grants are column-agnostic "all").
*/

ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS note_externe text;
