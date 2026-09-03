/*
  # Assigner une responsable à un compte bancaire

  ## Objectif
  Permettre à un administrateur d'assigner un employé comme responsable d'un compte
  bancaire (MVola, Orange Money, etc.). La responsable assignée peut voir et saisir
  des mouvements sur ses comptes depuis l'onglet Comptabilité.

  ## Modifications

  ### Table comptes_bancaires
  - Ajout colonne `responsable_id` (uuid, nullable) : FK vers employees.user_id
    → Identifie l'employé responsable de ce compte

  ### Table mouvements_bancaires
  - RLS : ajout d'une policy permettant à un employé de lire/insérer des mouvements
    sur les comptes dont il est responsable

  ## Sécurité
  - La colonne est nullable : un compte sans responsable_id reste accessible
    uniquement aux admins/trésoriers
  - Les responsables ne peuvent pas créer de nouveaux comptes ni modifier les
    paramètres d'un compte
  - RLS existante est enrichie sans casser l'existant
*/

-- 1. Ajouter la colonne responsable_id sur comptes_bancaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comptes_bancaires' AND column_name = 'responsable_id'
  ) THEN
    ALTER TABLE comptes_bancaires
      ADD COLUMN responsable_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Index pour les requêtes filtrées par responsable
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_responsable_id
  ON comptes_bancaires(responsable_id)
  WHERE responsable_id IS NOT NULL;

-- 3. Policy SELECT sur comptes_bancaires : la responsable peut lire ses comptes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'comptes_bancaires' AND policyname = 'Responsable can view assigned accounts'
  ) THEN
    CREATE POLICY "Responsable can view assigned accounts"
      ON comptes_bancaires FOR SELECT
      TO authenticated
      USING (responsable_id = auth.uid());
  END IF;
END $$;

-- 4. Policy SELECT sur mouvements_bancaires : la responsable peut lire les mouvements de ses comptes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mouvements_bancaires' AND policyname = 'Responsable can view movements of assigned accounts'
  ) THEN
    CREATE POLICY "Responsable can view movements of assigned accounts"
      ON mouvements_bancaires FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM comptes_bancaires cb
          WHERE cb.id = mouvements_bancaires.compte_bancaire_id
            AND cb.responsable_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5. Policy INSERT sur mouvements_bancaires : la responsable peut saisir des mouvements sur ses comptes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mouvements_bancaires' AND policyname = 'Responsable can insert movements on assigned accounts'
  ) THEN
    CREATE POLICY "Responsable can insert movements on assigned accounts"
      ON mouvements_bancaires FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM comptes_bancaires cb
          WHERE cb.id = compte_bancaire_id
            AND cb.responsable_id = auth.uid()
        )
      );
  END IF;
END $$;
