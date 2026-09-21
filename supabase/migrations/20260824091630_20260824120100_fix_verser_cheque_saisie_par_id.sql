/*
# Fix verser_cheque_en_banque: accept saisie_par_id parameter

auth.uid() returns NULL when the function is called outside an authenticated
session context (e.g. via execute_sql for data repair). Pass saisie_par_id
explicitly so the function works both from the app (authenticated) and from
admin repair queries.
*/

DROP FUNCTION IF EXISTS public.verser_cheque_en_banque(integer, integer, date, bigint, text);

CREATE OR REPLACE FUNCTION public.verser_cheque_en_banque(
  p_cheque_id integer,
  p_compte_bancaire_id integer,
  p_date_versement date DEFAULT CURRENT_DATE,
  p_mouvement_caisse_id bigint DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_saisie_par_id uuid DEFAULT NULL
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
  v_saisie_par_id uuid;
BEGIN
  v_saisie_par_id := COALESCE(p_saisie_par_id, auth.uid());

  IF v_saisie_par_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur authentifié — p_saisie_par_id requis';
  END IF;

  SELECT * INTO v_cheque
  FROM public.cheques
  WHERE id = p_cheque_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chèque % introuvable', p_cheque_id;
  END IF;

  IF v_cheque.mouvement_bancaire_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ce chèque est déjà versé';
  END IF;

  v_description := COALESCE(p_description, format('Dépôt chèque n°%s — %s', v_cheque.numero_cheque, v_cheque.payeur));

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
    v_saisie_par_id,
    p_date_versement
  )
  RETURNING id INTO v_mouv_bancaire_id;

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

GRANT EXECUTE ON FUNCTION public.verser_cheque_en_banque(integer, integer, date, bigint, text, uuid) TO authenticated;
