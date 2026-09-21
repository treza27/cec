/*
# Fix date_mouvement return type in get_client_encaissements

## Problem
The RETURNS TABLE declares `date_mouvement` as `timestamptz`, but the
actual `mouvements_caisse.date_mouvement` column is `date`. PostgreSQL
raises error 42804. Cannot change return type of existing function, so
we must DROP and recreate.

## Fix
- DROP the existing function
- Recreate with `date_mouvement` return type as `date`
- Re-grant EXECUTE to anon and authenticated
*/

DROP FUNCTION IF EXISTS public.get_client_encaissements(text);

CREATE OR REPLACE FUNCTION public.get_client_encaissements(p_pseudo text)
RETURNS TABLE (
  id bigint,
  date_mouvement date,
  description text,
  mode_paiement text,
  montant_mga numeric,
  note_debit_id bigint,
  reference text,
  type_mouvement text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_id int;
  v_note_ids bigint[];
  v_demande_ids bigint[];
  v_dette_ids bigint[];
  v_pseudo_lower text;
BEGIN
  v_pseudo_lower := LOWER(TRIM(p_pseudo));

  SELECT c.id INTO v_client_id
  FROM clients c
  WHERE LOWER(c.pseudo) = v_pseudo_lower
  LIMIT 1;

  SELECT COALESCE(array_agg(nd.id), ARRAY[]::bigint[]) INTO v_note_ids
  FROM notes_debit nd
  WHERE LOWER(nd.client_pseudo) = v_pseudo_lower;

  IF v_client_id IS NOT NULL THEN
    SELECT COALESCE(array_agg(da.id), ARRAY[]::bigint[]) INTO v_demande_ids
    FROM demandes_achat da
    WHERE da.client_id = v_client_id;

    SELECT COALESCE(array_agg(df.id), ARRAY[]::bigint[]) INTO v_dette_ids
    FROM dettes_fournisseur df
    WHERE df.client_id = v_client_id;
  ELSE
    v_demande_ids := ARRAY[]::bigint[];
    v_dette_ids := ARRAY[]::bigint[];
  END IF;

  RETURN QUERY
  SELECT
    mc.id,
    mc.date_mouvement::date,
    mc.description,
    mc.mode_paiement::text,
    mc.montant_mga,
    mc.note_debit_id,
    nd.reference,
    mc.type_mouvement::text
  FROM mouvements_caisse mc
  LEFT JOIN notes_debit nd ON nd.id = mc.note_debit_id
  WHERE mc.est_annule = false
    AND mc.sens = 'entree'
    AND (
      (mc.note_debit_id IS NOT NULL AND mc.note_debit_id = ANY(v_note_ids))
      OR (mc.demande_achat_id IS NOT NULL AND mc.demande_achat_id = ANY(v_demande_ids))
      OR (mc.dette_fournisseur_id IS NOT NULL AND mc.dette_fournisseur_id = ANY(v_dette_ids))
      OR (mc.tiers_nom IS NOT NULL AND LOWER(TRIM(mc.tiers_nom)) = v_pseudo_lower)
    )
  ORDER BY mc.date_mouvement DESC, mc.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_encaissements(text) TO anon, authenticated;
