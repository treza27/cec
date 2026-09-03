/*
  # Approvisionnement bancaire inter-comptes avec taux de change

  ## Résumé
  Ajoute la capacité d'enregistrer des transferts inter-banques avec conversion de devises,
  notamment le cas NEDISMA (MGA) → AGMA (USD) avec un taux de change MGA/USD.

  ## Changements

  ### Table mouvements_bancaires
  - Nouveau type `approvisionnement` dans le CHECK constraint de type_mouvement
  - Nouvelle colonne `taux_change` (numeric, nullable) : taux utilisé lors d'un approvisionnement inter-devises
  - Nouvelle colonne `mouvement_bancaire_lie_id` (bigint, nullable) : FK self-referencing pour lier les deux côtés d'un transfert (sortie NEDISMA ↔ entrée AGMA)

  ## Sécurité
  - La politique RLS existante reste inchangée : seuls les administrateurs et les responsables assignés peuvent insérer des mouvements
*/

-- 1. Ajouter le type approvisionnement au CHECK constraint
ALTER TABLE mouvements_bancaires
  DROP CONSTRAINT IF EXISTS mouvements_bancaires_type_mouvement_check;

ALTER TABLE mouvements_bancaires
  ADD CONSTRAINT mouvements_bancaires_type_mouvement_check
  CHECK (type_mouvement IN (
    'versement_caisse',
    'virement_entrant',
    'virement_sortant',
    'frais_bancaires',
    'interets',
    'autre_entree',
    'autre_sortie',
    'approvisionnement'
  ));

-- 2. Ajouter la colonne taux_change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'taux_change'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN taux_change numeric(18, 6) DEFAULT NULL;
  END IF;
END $$;

-- 3. Ajouter la colonne mouvement_bancaire_lie_id (self-reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_bancaires' AND column_name = 'mouvement_bancaire_lie_id'
  ) THEN
    ALTER TABLE mouvements_bancaires ADD COLUMN mouvement_bancaire_lie_id bigint DEFAULT NULL
      REFERENCES mouvements_bancaires(id) ON DELETE SET NULL;
  END IF;
END $$;
