/*
# Fix recalc_dette_fournisseur_remboursement: statut is text, not enum

The statut column on dettes_fournisseur is plain text, not a custom enum type.
The previous version of the function tried to cast to a non-existent
public.statut_dette_fournisseur type. This migration recreates the function
with a plain text cast.
*/

DROP FUNCTION IF EXISTS public.recalc_dette_fournisseur_remboursement(integer);

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
  SELECT COALESCE(SUM(mc.montant_mga), 0)
  INTO v_total_rembourse
  FROM public.mouvements_caisse mc
  WHERE mc.dette_fournisseur_id = dette_id
    AND mc.type_mouvement = 'remboursement_dette_fournisseur'
    AND mc.est_annule = false;

  SELECT df.montant_mga_equivalent
  INTO v_montant_equivalent
  FROM public.dettes_fournisseur df
  WHERE df.id = dette_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dette fournisseur % non trouvée', dette_id;
  END IF;

  IF v_total_rembourse >= v_montant_equivalent THEN
    v_nouveau_statut := 'remboursee';
  ELSIF v_total_rembourse > 0 THEN
    v_nouveau_statut := 'partiellement_remboursee';
  ELSE
    v_nouveau_statut := 'en_attente';
  END IF;

  UPDATE public.dettes_fournisseur
  SET montant_rembourse_mga = v_total_rembourse,
      statut = v_nouveau_statut
  WHERE id = dette_id
  RETURNING * INTO v_updated_row;

  RETURN v_updated_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_dette_fournisseur_remboursement(integer) TO authenticated;
