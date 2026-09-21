/*
  # MVola / Orange Money dans Caisses + Transfert interne caisse-à-caisse

  ## Changements

  ### 1. Table `caisses`
  - Nouvelle colonne `type_caisse` (text, NOT NULL, DEFAULT 'especes')
    Valeurs : 'especes', 'mvola', 'orange_money'

  ### 2. Table `mouvements_caisse`
  - Nouvelle colonne `caisse_destination_id` (bigint, nullable, FK vers caisses)
    Stocke la caisse de destination lors d'un transfert interne caisse-à-caisse
  - Ajout de 'transfert_interne' dans le CHECK constraint sur `type_mouvement`
    Ce type remplace `versement_banque` pour les transferts entre caisses

  ### 3. Migration des comptes MVola / Orange Money
  - Les comptes bancaires dont `banque IN ('MVola', 'Orange Money')` sont convertis
    en caisses avec le type_caisse correspondant
  - Leurs mouvements bancaires sont copiés dans mouvements_caisse
  - Les comptes sont ensuite désactivés (est_actif = false)

  ### Sécurité
  - RLS inchangée pour caisses et mouvements_caisse
  - FK avec ON DELETE SET NULL sur caisse_destination_id
*/

-- 1. Ajouter type_caisse sur caisses
ALTER TABLE caisses ADD COLUMN IF NOT EXISTS type_caisse text NOT NULL DEFAULT 'especes';

DO $$
BEGIN
  ALTER TABLE caisses ADD CONSTRAINT caisses_type_caisse_check
    CHECK (type_caisse IN ('especes', 'mvola', 'orange_money'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter caisse_destination_id sur mouvements_caisse
ALTER TABLE mouvements_caisse
  ADD COLUMN IF NOT EXISTS caisse_destination_id bigint REFERENCES caisses(id) ON DELETE SET NULL;

-- 3. Ajouter 'transfert_interne' dans le CHECK constraint de type_mouvement
--    On recrée le constraint en supprimant l'ancien
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints
  WHERE table_name = 'mouvements_caisse'
    AND constraint_type = 'CHECK'
    AND constraint_name ILIKE '%type_mouvement%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE mouvements_caisse DROP CONSTRAINT IF EXISTS ' || quote_ident(v_constraint_name);
  END IF;
END $$;

ALTER TABLE mouvements_caisse DROP CONSTRAINT IF EXISTS mouvements_caisse_type_mouvement_check;

ALTER TABLE mouvements_caisse ADD CONSTRAINT mouvements_caisse_type_mouvement_check
  CHECK (type_mouvement IN (
    'entree_client',
    'achat_rmb',
    'paiement_note_debit',
    'frais_annexe',
    'loyer',
    'achat_materiel',
    'salaire',
    'avance_salaire',
    'versement_banque',
    'transfert_interne',
    'autre_entree',
    'autre_sortie'
  ));

-- 4. Migrer les comptes MVola / Orange Money vers des caisses
--    Pour chaque compte bancaire MVola/OM actif, créer une caisse équivalente
--    et copier les mouvements bancaires en mouvements_caisse

DO $$
DECLARE
  rec RECORD;
  new_caisse_id bigint;
  saisie_id uuid;
BEGIN
  -- Récupérer un utilisateur de référence pour saisie_par_id (premier admin)
  SELECT user_id INTO saisie_id FROM employees WHERE role = 'administrateur' LIMIT 1;
  IF saisie_id IS NULL THEN
    SELECT user_id INTO saisie_id FROM employees LIMIT 1;
  END IF;

  FOR rec IN
    SELECT * FROM comptes_bancaires
    WHERE banque IN ('MVola', 'Orange Money') AND est_actif = true
  LOOP
    -- Créer la caisse
    INSERT INTO caisses (
      nom,
      description,
      type_caisse,
      solde_initial_mga,
      date_solde_initial,
      responsable_id,
      est_active
    ) VALUES (
      rec.nom,
      rec.banque,
      CASE WHEN rec.banque = 'MVola' THEN 'mvola' ELSE 'orange_money' END,
      rec.solde_initial,
      rec.date_solde_initial,
      rec.responsable_id,
      true
    )
    RETURNING id INTO new_caisse_id;

    -- Copier les mouvements bancaires non annulés en mouvements_caisse
    INSERT INTO mouvements_caisse (
      caisse_id,
      type_mouvement,
      sens,
      montant_mga,
      description,
      saisie_par_id,
      date_mouvement,
      est_annule,
      created_at
    )
    SELECT
      new_caisse_id,
      CASE
        WHEN mb.type_mouvement = 'virement_entrant' THEN 'autre_entree'
        WHEN mb.type_mouvement = 'virement_sortant' THEN 'autre_sortie'
        WHEN mb.type_mouvement = 'versement_caisse' THEN 'autre_entree'
        WHEN mb.type_mouvement = 'frais_bancaires' THEN 'frais_annexe'
        WHEN mb.type_mouvement = 'interets' THEN 'autre_entree'
        WHEN mb.type_mouvement = 'autre_entree' THEN 'autre_entree'
        WHEN mb.type_mouvement = 'autre_sortie' THEN 'autre_sortie'
        ELSE 'autre_entree'
      END,
      mb.sens,
      mb.montant,
      mb.description,
      COALESCE(mb.saisie_par_id, saisie_id),
      mb.date_mouvement,
      mb.est_annule,
      mb.created_at
    FROM mouvements_bancaires mb
    WHERE mb.compte_bancaire_id = rec.id;

    -- Désactiver le compte bancaire
    UPDATE comptes_bancaires SET est_actif = false WHERE id = rec.id;
  END LOOP;
END $$;
