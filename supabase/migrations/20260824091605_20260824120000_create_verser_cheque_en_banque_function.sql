/*
# Create verser_cheque_en_banque: atomic SECURITY DEFINER function

## Purpose
When a cheque is deposited at the bank (via a transfert_interne caisse movement),
two things must happen atomically:
1. A mouvements_bancaires entry (entree) is created on the target bank account
2. The cheques row is updated: statut='verse', date_versement, mouvement_bancaire_id, compte_bancaire_id

Both operations require privileges that non-admin roles (acheteur, commercial)
do not have. Previously this was done as two separate client-side calls, and both
silently failed for non-admin users — the caisse was debited but the bank was
never credited and the cheque stayed "en_attente".

## Changes
1. New function verser_cheque_en_banque(p_cheque_id, p_compte_bancaire_id,
   p_date_versement, p_mouvement_caisse_id, p_description)
   - SECURITY DEFINER: runs as table owner, bypassing RLS on both
     mouvements_bancaires and cheques
   - Validates: cheque exists, not already versé, compte bancaire exists
   - Inserts mouvements_bancaires row (versement_caisse / entree / depot_cheque)
   - Updates cheques row to statut='verse' with all links
   - Returns the updated cheques row with joined note_debit + compte_bancaire
2. Grant EXECUTE to authenticated
*/

CREATE OR REPLACE FUNCTION public.verser_cheque_en_banque(
  p_cheque_id integer,
  p_compte_bancaire_id integer,
  p_date_versement date DEFAULT CURRENT_DATE,
  p_mouvement_caisse_id bigint DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS public.cheques
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cheque public.cheques;
  v_mouv_bancaire_id bigint;
  v_description text;
BEGIN
  -- Fetch the cheque
  SELECT * INTO v_cheque
  FROM public.cheques
  WHERE id = p_cheque_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chèque % introuvable', p_cheque_id;
  END IF;

  IF v_cheque.mouvement_bancaire_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ce chèque est déjà versé';
  END IF;

  -- Build description
  v_description := COALESCE(p_description, format('Dépôt chèque n°%s — %s', v_cheque.numero_cheque, v_cheque.payeur));

  -- Create the bank movement (entree)
  INSERT INTO public.mouvements_bancaires (
    compte_bancaire_id,
    type_mouvement,
    sens,
    montant,
    description,
    mode_paiement,
    mouvement_caisse_id,
    saisie_par_id,
    date_mouvement
  )
  VALUES (
    p_compte_bancaire_id,
    'versement_caisse',
    'entree',
    v_cheque.montant_mga,
    v_description,
    'depot_cheque',
    p_mouvement_caisse_id,
    auth.uid(),
    p_date_versement
  )
  RETURNING id INTO v_mouv_bancaire_id;

  -- Update the cheque
  UPDATE public.cheques
  SET
    statut = 'verse',
    mouvement_bancaire_id = v_mouv_bancaire_id,
    compte_bancaire_id = p_compte_bancaire_id,
    date_versement = p_date_versement,
    motif_annulation = NULL
  WHERE id = p_cheque_id
  RETURNING * INTO v_cheque;

  RETURN v_cheque;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verser_cheque_en_banque(integer, integer, date, bigint, text) TO authenticated;
