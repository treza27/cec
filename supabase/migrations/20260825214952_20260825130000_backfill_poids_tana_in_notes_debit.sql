/*
# Backfill poidsTana in notes_debit colis_details

1. Data Backfill
- For every existing row in `notes_debit`, iterate over the `colis_details` JSONB
  array. For each colis entry whose `poidsTana` is missing, null, or 0, look up
  the matching row in `inventaire` by id and set `poidsTana` from `poids_tana`
  (falling back to `poids` if the Tana value is null/0/empty).
- This ensures all existing notes de débit display the correct weight in the
  new "Poids (kg)" column without regenerating the notes.

2. Security
- No RLS policy changes. No schema changes. This is a pure data update on
  the `notes_debit` table only.
*/

DO $$
DECLARE
  nd_record RECORD;
  updated_details jsonb;
  colis_item jsonb;
  colis_id int;
  inv_poids numeric;
  new_poids numeric;
  i int;
BEGIN
  FOR nd_record IN SELECT id, colis_details FROM notes_debit LOOP
    updated_details := nd_record.colis_details;
    IF updated_details IS NULL OR jsonb_array_length(updated_details) = 0 THEN
      CONTINUE;
    END IF;

    FOR i IN 0..jsonb_array_length(updated_details) - 1 LOOP
      colis_item := updated_details->i;
      -- Only backfill if poidsTana is missing, null, or 0
      IF (colis_item->'poidsTana') IS NULL
         OR (colis_item->'poidsTana')::numeric IS NULL
         OR (colis_item->'poidsTana')::numeric = 0 THEN

        colis_id := (colis_item->'id')::int;

        -- Look up poids_tana from inventaire first
        SELECT poids_tana INTO inv_poids
        FROM inventaire
        WHERE id = colis_id
        LIMIT 1;

        IF inv_poids IS NULL OR inv_poids = 0 THEN
          -- Fall back to poids (declared weight from China)
          SELECT poids INTO inv_poids
          FROM inventaire
          WHERE id = colis_id
          LIMIT 1;
        END IF;

        new_poids := COALESCE(inv_poids, 0);

        updated_details := jsonb_set(
          updated_details,
          ARRAY[i::text, 'poidsTana'],
          to_jsonb(new_poids),
          true
        );
      END IF;
    END LOOP;

    UPDATE notes_debit
    SET colis_details = updated_details
    WHERE id = nd_record.id;
  END LOOP;
END $$;
