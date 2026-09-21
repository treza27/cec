/*
  # Add foreign keys from demandes_achat to employees

  ## Problem
  The achatService uses PostgREST JOIN syntax to fetch employee data
  (cree_par and assigne_a) from the demandes_achat table. However,
  demandes_achat.cree_par_id and assigne_a_id only reference auth.users(id),
  not the employees table. PostgREST cannot resolve the JOIN because there
  is no direct FK relationship between demandes_achat and employees.

  ## Solution
  Add two foreign key constraints that reference employees(user_id):
  - demandes_achat.cree_par_id -> employees(user_id)
  - demandes_achat.assigne_a_id -> employees(user_id)

  This allows PostgREST to resolve:
    employees!demandes_achat_cree_par_id_fkey(user_id, full_name, email)
    employees!demandes_achat_assigne_a_id_fkey(user_id, full_name, email)

  ## Notes
  - employees.user_id must be UNIQUE for FK references to work
  - We add a UNIQUE constraint on employees.user_id if not already present
  - Existing data integrity is preserved (no data loss)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'employees'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'employees_user_id_key'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'demandes_achat'
      AND constraint_name = 'demandes_achat_cree_par_id_fkey_employees'
  ) THEN
    ALTER TABLE demandes_achat
      ADD CONSTRAINT demandes_achat_cree_par_id_fkey_employees
      FOREIGN KEY (cree_par_id) REFERENCES employees(user_id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'demandes_achat'
      AND constraint_name = 'demandes_achat_assigne_a_id_fkey_employees'
  ) THEN
    ALTER TABLE demandes_achat
      ADD CONSTRAINT demandes_achat_assigne_a_id_fkey_employees
      FOREIGN KEY (assigne_a_id) REFERENCES employees(user_id) ON DELETE SET NULL;
  END IF;
END $$;
