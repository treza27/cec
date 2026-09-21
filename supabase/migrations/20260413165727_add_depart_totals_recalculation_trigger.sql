/*
  # Add automatic recalculation of depart totals

  1. New Function
    - `recalculate_depart_totals()` - Trigger function that recalculates 
      nb_palettes_total, nb_cartons_total, poids_total, volume_total 
      from the associated colis in inventaire whenever colis_associes is updated

  2. New Trigger
    - `trigger_recalculate_depart_totals` - Fires BEFORE INSERT or UPDATE on `depart`
      when `colis_associes` column changes, ensuring totals are always in sync

  3. Important Notes
    - This prevents NULL or stale stats when departs are created/modified 
      outside the standard frontend form
    - Uses COALESCE to safely handle NULL values in inventaire columns
    - Only recalculates when colis_associes actually changes (or on INSERT)
*/

CREATE OR REPLACE FUNCTION recalculate_depart_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_palettes integer;
  v_cartons integer;
  v_poids numeric(10,2);
  v_volume numeric(10,2);
BEGIN
  IF NEW.colis_associes IS NOT NULL AND array_length(NEW.colis_associes, 1) > 0 THEN
    SELECT
      COALESCE(SUM(COALESCE(nb_palettes::int, 0)), 0),
      COALESCE(SUM(COALESCE(nb_cartons::int, 0)), 0),
      COALESCE(SUM(COALESCE(poids::numeric, 0)), 0),
      COALESCE(SUM(COALESCE(volume::numeric, 0)), 0)
    INTO v_palettes, v_cartons, v_poids, v_volume
    FROM inventaire
    WHERE id = ANY(NEW.colis_associes);

    NEW.nb_palettes_total := v_palettes;
    NEW.nb_cartons_total := v_cartons;
    NEW.poids_total := v_poids;
    NEW.volume_total := v_volume;
  ELSE
    NEW.nb_palettes_total := 0;
    NEW.nb_cartons_total := 0;
    NEW.poids_total := 0;
    NEW.volume_total := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_depart_totals ON depart;

CREATE TRIGGER trigger_recalculate_depart_totals
  BEFORE INSERT OR UPDATE OF colis_associes ON depart
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_depart_totals();
