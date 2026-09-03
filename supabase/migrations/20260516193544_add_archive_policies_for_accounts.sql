/*
  # Politiques RLS pour archivage des comptes (Caisses et Banque)

  ## Objectif
  Permettre à un administrateur d'archiver (désactiver) et de restaurer
  un compte Caisse ou Bancaire via une mise à jour du flag est_active / est_actif.

  ## Modifications
  - Ajout politique DELETE admin sur `caisses` (précaution)
  - Ajout politique DELETE admin sur `comptes_bancaires` (précaution)
  - Les UPDATE admin existent déjà sur les deux tables ; l'archivage
    utilise UPDATE (est_active = false), donc aucune nouvelle politique
    UPDATE n'est nécessaire.

  ## Notes
  - L'archivage est logique (soft delete via flag boolean)
  - Aucune donnée n'est supprimée ; les mouvements associés sont conservés
*/

-- Policy DELETE admin sur caisses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'caisses' AND policyname = 'Admins can delete caisses'
  ) THEN
    CREATE POLICY "Admins can delete caisses"
      ON caisses FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM employees
          WHERE employees.user_id = auth.uid()
            AND employees.role = 'administrateur'
        )
      );
  END IF;
END $$;

-- Policy DELETE admin sur comptes_bancaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'comptes_bancaires' AND policyname = 'Admins can delete comptes_bancaires'
  ) THEN
    CREATE POLICY "Admins can delete comptes_bancaires"
      ON comptes_bancaires FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM employees
          WHERE employees.user_id = auth.uid()
            AND employees.role = 'administrateur'
        )
      );
  END IF;
END $$;
