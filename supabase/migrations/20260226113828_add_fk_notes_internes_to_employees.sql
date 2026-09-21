/*
  # Add foreign key from notes_internes.auteur_id to employees.user_id

  ## Problem
  The noteInterneService tries to join notes_internes with employees via
  notes_internes_auteur_id_fkey, but PostgREST cannot resolve this relationship
  because auteur_id currently references auth.users (unexposed schema).

  ## Fix
  Add a foreign key constraint from notes_internes.auteur_id to employees.user_id
  so that PostgREST can auto-resolve the join using the named constraint
  notes_internes_auteur_id_fkey.

  ## Notes
  - employees.user_id must have a unique constraint for this FK to work
  - The existing auth.users reference is kept implicitly via employees.user_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notes_internes_auteur_id_fkey'
      AND table_name = 'notes_internes'
  ) THEN
    ALTER TABLE notes_internes
      ADD CONSTRAINT notes_internes_auteur_id_fkey
      FOREIGN KEY (auteur_id) REFERENCES employees(user_id) ON DELETE RESTRICT;
  END IF;
END $$;
