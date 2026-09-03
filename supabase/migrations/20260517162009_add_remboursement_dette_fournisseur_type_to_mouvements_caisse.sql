/*
  # Fix CHECK constraint on mouvements_caisse.type_mouvement

  ## Description
  Adds 'remboursement_dette_fournisseur' to the allowed values of the
  type_mouvement CHECK constraint on mouvements_caisse. The TypeScript type
  was already updated but the database constraint was not, causing inserts
  to fail with a constraint violation error.

  ## Changes
  - mouvements_caisse: drop old type_mouvement CHECK constraint, recreate it
    with the new value included (12 types total).
*/

ALTER TABLE mouvements_caisse
  DROP CONSTRAINT IF EXISTS mouvements_caisse_type_mouvement_check;

ALTER TABLE mouvements_caisse
  ADD CONSTRAINT mouvements_caisse_type_mouvement_check
  CHECK (type_mouvement IN (
    'entree_client',
    'achat_rmb',
    'paiement_note_debit',
    'frais_annexe',
    'loyer',
    'achat_materiel',
    'salaire',
    'avance_salaire',
    'transfert_interne',
    'remboursement_dette_fournisseur',
    'autre_entree',
    'autre_sortie'
  ));
