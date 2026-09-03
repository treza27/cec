/*
# Add client phone and backfill nb_cartons in notes_debit colis_details

1. Modified Tables
- `notes_debit`
  - New column `client_phone` (text, nullable) — stores the client's phone number
    captured at the time the note de débit is generated. Displayed on the printed
    document below the client name.

2. Data Backfill
- For every existing row in `notes_debit`, iterate over the `colis_details` JSONB
  array. For each colis entry whose `nbCartons` is missing, null, or 0, look up
  the matching row in `inventaire` by id and set `nbCartons` from
  `nb_cartons_tana` (falling back to `nb_cartons` if the Tana value is null/0).
- This ensures all existing notes de débit display the correct carton count in
  the new "Cartons" column without regenerating the notes.

3. Security
- No RLS policy changes. The existing policies on `notes_debit` already cover
  SELECT / INSERT / UPDATE / DELETE for authenticated users. The new column
  inherits the same row-level access as the rest of the table.
*/

-- 1. Add client_phone column (idempotent)
ALTER TABLE notes_debit
  ADD COLUMN IF NOT EXISTS client_phone text;

-- 2. Backfill nbCartons in colis_details for all existing notes
DO $$
DECLARE
  nd_record RECORD;
  updated_details jsonb;
  colis_item jsonb;
  colis_id int;
  inv_cartons int;
  new_cartons int;
  i int;
BEGIN
  FOR nd_record IN SELECT id, colis_details FROM notes_debit LOOP
    updated_details := nd_record.colis_details;
    IF updated_details IS NULL OR jsonb_array_length(updated_details) = 0 THEN
      CONTINUE;
    END IF;

    FOR i IN 0..jsonb_array_length(updated_details) - 1 LOOP
      colis_item := updated_details->i;
      -- Only backfill if nbCartons is missing, null, or 0
      IF (colis_item->'nbCartons') IS NULL
         OR (colis_item->'nbCartons')::int IS NULL
         OR (colis_item->'nbCartons')::int = 0 THEN

        colis_id := (colis_item->'id')::int;

        -- Look up cartons from inventaire
        SELECT COALESCE(nb_cartons_tana, 0) INTO inv_cartons
        FROM inventaire
        WHERE id = colis_id
        LIMIT 1;

        IF inv_cartons IS NULL OR inv_cartons = 0 THEN
          SELECT COALESCE(nb_cartons, 0) INTO inv_cartons
          FROM inventaire
          WHERE id = colis_id
          LIMIT 1;
        END IF;

        new_cartons := COALESCE(inv_cartons, 0);

        updated_details := jsonb_set(
          updated_details,
          ARRAY[i::text, 'nbCartons'],
          to_jsonb(new_cartons),
          true
        );
      END IF;
    END LOOP;

    UPDATE notes_debit
    SET colis_details = updated_details
    WHERE id = nd_record.id;
  END LOOP;
END $$;
