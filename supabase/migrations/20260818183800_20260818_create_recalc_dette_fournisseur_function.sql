/*
# Create SECURITY DEFINER function to recalculate supplier debt repayment

## Purpose
When a caisse movement of type "remboursement_dette_fournisseur" is created,
the dettes_fournisseur row's montant_rembourse_mga and statut must be updated.
Previously this was done via a direct client-side UPDATE, which silently failed
for non-admin users (acheteur, commercial) because the RLS UPDATE policy on
dettes_fournisseur only allows administrateur and tresorier roles.

## Changes
1. New function: `recalc_dette_fournisseur_remboursement(dette_id integer)`
   - SECURITY DEFINER, runs with elevated privileges regardless of caller role
   - Recalculates montant_rembourse_mga by summing all non-cancelled
     mouvements_caisse rows linked to this dette with type
     'remboursement_dette_fournisseur'
   - Recomputes statut: 'remboursee' if fully repaid, 'partiellement_remboursee'
     if partially repaid, 'en_attente' if nothing repaid
   - Returns the updated row
2. Grant EXECUTE to authenticated role so all logged-in agents can call it

## Security
- SECURITY DEFINER: the function runs as the table owner, bypassing RLS on
  dettes_fournisseur. This is safe because the function only reads
  mouvements_caisse (which the caller already has SELECT access to) and updates
  the dette row deterministically — the caller cannot inject arbitrary values.
- search_path set to 'public' to prevent search_path injection.
*/

CREATE OR REPLACE FUNCTION public.recalc_dette_fournisseur_remboursement(dette_id integer)
RETURNS public.dettes_fournisseur
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_rembourse numeric;
  v_montant_equivalent numeric;
  v_nouveau_statut text;
  v_updated_row public.dettes_fournisseur;
BEGIN
  -- Sum all non-cancelled repayment movements for this debt
  SELECT COALESCE(SUM(mc.montant_mga), 0)
  INTO v_total_rembourse
  FROM public.mouvements_caisse mc
  WHERE mc.dette_fournisseur_id = dette_id
    AND mc.type_mouvement = 'remboursement_dette_fournisseur'
    AND mc.est_annule = false;

  -- Get the equivalent MGA amount
  SELECT df.montant_mga_equivalent
  INTO v_montant_equivalent
  FROM public.dettes_fournisseur df
  WHERE df.id = dette_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dette fournisseur % non trouvée', dette_id;
  END IF;

  -- Determine new status
  IF v_total_rembourse >= v_montant_equivalent THEN
    v_nouveau_statut := 'remboursee';
  ELSIF v_total_rembourse > 0 THEN
    v_nouveau_statut := 'partiellement_remboursee';
  ELSE
    v_nouveau_statut := 'en_attente';
  END IF;

  -- Update the debt row
  UPDATE public.dettes_fournisseur
  SET montant_rembourse_mga = v_total_rembourse,
      statut = v_nouveau_statut::public.statut_dette_fournisseur
  WHERE id = dette_id
  RETURNING * INTO v_updated_row;

  RETURN v_updated_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_dette_fournisseur_remboursement(integer) TO authenticated;
