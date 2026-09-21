/*
# Fix ambiguous column reference in get_client_encaissements function

## Problem
The function's RETURNS TABLE clause declares a column named `id`, which
creates a PL/pgSQL output variable. When the function body does
`SELECT id FROM clients`, PostgreSQL cannot determine whether `id` refers
to the output variable or the `clients.id` column, raising error 42702:
"column reference 'id' is ambiguous".

## Fix
- Alias every table reference (c for clients, nd for notes_debit, da for
  demandes_achat, df for dettes_fournisseur, mc for mouvements_caisse)
- Qualify ALL column references with the table alias
- Re-apply the EXECUTE grants to anon and authenticated

## Security
- Same SECURITY DEFINER pattern, same fixed search_path
- Same pseudo-scoped filtering, same limited column set
- No changes to what data is exposed
*/

CREATE OR REPLACE FUNCTION public.get_client_encaissements(p_pseudo text)
RETURNS TABLE (
  id bigint,
  date_mouvement timestamptz,
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

  -- Get client_id from clients table
  SELECT c.id INTO v_client_id
  FROM clients c
  WHERE LOWER(c.pseudo) = v_pseudo_lower
  LIMIT 1;

  -- Get note_debit IDs for this pseudo
  SELECT COALESCE(array_agg(nd.id), ARRAY[]::bigint[]) INTO v_note_ids
  FROM notes_debit nd
  WHERE LOWER(nd.client_pseudo) = v_pseudo_lower;

  -- Get demande_achat IDs for this client
  IF v_client_id IS NOT NULL THEN
    SELECT COALESCE(array_agg(da.id), ARRAY[]::bigint[]) INTO v_demande_ids
    FROM demandes_achat da
    WHERE da.client_id = v_client_id;

    -- Get dette_fournisseur IDs for this client
    SELECT COALESCE(array_agg(df.id), ARRAY[]::bigint[]) INTO v_dette_ids
    FROM dettes_fournisseur df
    WHERE df.client_id = v_client_id;
  ELSE
    v_demande_ids := ARRAY[]::bigint[];
    v_dette_ids := ARRAY[]::bigint[];
  END IF;

  -- Return matching mouvements_caisse (entree only, non-annule)
  RETURN QUERY
  SELECT
    mc.id,
    mc.date_mouvement,
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

-- Re-grant execute (idempotent — GRANT is safe to repeat)
GRANT EXECUTE ON FUNCTION public.get_client_encaissements(text) TO anon, authenticated;
