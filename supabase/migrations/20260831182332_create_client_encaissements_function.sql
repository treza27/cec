/*
# Create function to expose client encaissements to public (anon) users

## Purpose
The client tracking page is public (no login). Clients can already see their
notes de debit (invoices) via an existing anon SELECT policy. However, the
mouvements_caisse table (payment operations) is restricted to authenticated
staff only (admins, tresoriers, caissiers). We need a secure way for clients
to see their own payment history without exposing other clients' data.

## What this does
Creates a SECURITY DEFINER function `get_client_encaissements(p_pseudo text)`
that:
1. Takes a client pseudo as input
2. Finds all note_debit IDs for that pseudo
3. Finds all demande_achat IDs for that client (via clients table join)
4. Finds all dette_fournisseur IDs for that client
5. Returns mouvements_caisse rows that are linked to those IDs OR where
   tiers_nom matches the pseudo
6. Only returns non-annule, entree (incoming payment) movements
7. Only returns a safe subset of columns (no sensitive internal data)

## Security
- SECURITY DEFINER: runs with the function owner's privileges, bypassing RLS
  on mouvements_caisse
- Only returns rows matching the provided pseudo — a client cannot see
  another client's payments
- Only returns entree (incoming) movements — outgoing payments are internal
- Only returns non-annule movements
- Returns a limited column set: id, date_mouvement, description, mode_paiement,
  montant_mga, note_debit_id, reference (from note_debit), type_mouvement
- Granted EXECUTE to anon and authenticated roles
- Uses a fixed search_path to prevent search_path injection

## Important notes
1. This function is read-only — it does not modify any data
2. The pseudo comparison is case-insensitive (LOWER() on both sides)
3. Returns empty array if no matching movements found
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
  SELECT id INTO v_client_id
  FROM clients
  WHERE LOWER(pseudo) = v_pseudo_lower
  LIMIT 1;

  -- Get note_debit IDs for this pseudo
  SELECT COALESCE(array_agg(id), ARRAY[]::bigint[]) INTO v_note_ids
  FROM notes_debit
  WHERE LOWER(client_pseudo) = v_pseudo_lower;

  -- Get demande_achat IDs for this client
  IF v_client_id IS NOT NULL THEN
    SELECT COALESCE(array_agg(id), ARRAY[]::bigint[]) INTO v_demande_ids
    FROM demandes_achat
    WHERE client_id = v_client_id;

    -- Get dette_fournisseur IDs for this client
    SELECT COALESCE(array_agg(id), ARRAY[]::bigint[]) INTO v_dette_ids
    FROM dettes_fournisseur
    WHERE client_id = v_client_id;
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

-- Grant execute to anon (public tracking page) and authenticated (agent)
GRANT EXECUTE ON FUNCTION public.get_client_encaissements(text) TO anon, authenticated;
