/*
  # Correction FK responsable_id sur comptes_bancaires

  ## Problème
  La colonne `responsable_id` de la table `comptes_bancaires` référençait `auth.users(id)`
  au lieu de `employees(user_id)`. PostgREST ne peut pas traverser les schémas `auth` donc
  la requête `.select('*, responsable:responsable_id(full_name, email)')` échouait,
  provoquant une erreur à chaque création, lecture et mise à jour d'un compte bancaire.

  ## Correction
  - Suppression de la contrainte FK vers `auth.users`
  - Ajout d'une nouvelle contrainte FK vers `employees(user_id)`
  - Alignement avec la table `caisses` qui utilise le même pattern correctement

  ## Impact
  - Aucune perte de données (la colonne et ses valeurs sont conservées)
  - Le join PostgREST `responsable:responsable_id(full_name, email)` fonctionne désormais
*/

-- 1. Supprimer l'ancienne contrainte FK vers auth.users
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT c.conname INTO v_constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'comptes_bancaires'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) LIKE '%auth.users%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE comptes_bancaires DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

-- 2. Ajouter la nouvelle contrainte FK vers employees(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'comptes_bancaires'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%employees(user_id)%'
  ) THEN
    ALTER TABLE comptes_bancaires
      ADD CONSTRAINT comptes_bancaires_responsable_id_fkey
      FOREIGN KEY (responsable_id) REFERENCES employees(user_id) ON DELETE SET NULL;
  END IF;
END $$;
