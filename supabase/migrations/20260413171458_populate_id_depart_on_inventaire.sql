/*
  # Populate id_depart on inventaire from depart.colis_associes

  1. Data Fix
    - Sets `id_depart` on all `inventaire` rows that appear in a `depart`'s `colis_associes` array
    - This backfills data that was never written when colis were associated to departures

  2. New Trigger
    - Creates a trigger function `sync_id_depart_on_depart_change` that runs AFTER INSERT or UPDATE
      on the `depart` table
    - Whenever `colis_associes` is changed on a depart, the trigger automatically sets `id_depart`
      on the corresponding inventaire rows and clears it on rows that were removed

  3. Important Notes
    - Only updates inventaire rows where id_depart is currently NULL or differs
    - The trigger ensures future consistency without requiring application-level logic
*/

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, colis_associes FROM depart WHERE colis_associes IS NOT NULL AND array_length(colis_associes, 1) > 0
  LOOP
    UPDATE inventaire
    SET id_depart = r.id
    WHERE id = ANY(r.colis_associes)
      AND (id_depart IS NULL OR id_depart != r.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION sync_id_depart_on_depart_change()
RETURNS TRIGGER AS $$
DECLARE
  removed_ids integer[];
  added_ids integer[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.colis_associes IS NOT NULL AND array_length(NEW.colis_associes, 1) > 0 THEN
      UPDATE inventaire
      SET id_depart = NEW.id
      WHERE id = ANY(NEW.colis_associes);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    removed_ids := ARRAY(
      SELECT unnest(COALESCE(OLD.colis_associes, '{}'))
      EXCEPT
      SELECT unnest(COALESCE(NEW.colis_associes, '{}'))
    );

    added_ids := COALESCE(NEW.colis_associes, '{}');

    IF array_length(removed_ids, 1) > 0 THEN
      UPDATE inventaire
      SET id_depart = NULL
      WHERE id = ANY(removed_ids)
        AND id_depart = OLD.id;
    END IF;

    IF array_length(added_ids, 1) > 0 THEN
      UPDATE inventaire
      SET id_depart = NEW.id
      WHERE id = ANY(added_ids)
        AND (id_depart IS NULL OR id_depart != NEW.id);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_id_depart_on_depart_change'
  ) THEN
    CREATE TRIGGER trg_sync_id_depart_on_depart_change
      AFTER INSERT OR UPDATE OF colis_associes ON depart
      FOR EACH ROW
      EXECUTE FUNCTION sync_id_depart_on_depart_change();
  END IF;
END $$;
