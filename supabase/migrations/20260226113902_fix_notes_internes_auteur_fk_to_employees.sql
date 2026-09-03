/*
  # Fix notes_internes auteur_id foreign key to point to employees

  ## Problem
  The existing FK notes_internes_auteur_id_fkey points to auth.users (unexposed schema).
  PostgREST cannot resolve joins through auth.users, causing the error:
  "Could not find a relationship between 'notes_internes' and 'employees' in the schema cache"

  ## Fix
  Drop the existing FK to auth.users and replace it with a FK to employees.user_id,
  which PostgREST can resolve for automatic joins.

  ## Notes
  - employees.user_id has a unique constraint (employees_user_id_key), so it can be a FK target
  - The same constraint name is reused so the service code requires no changes
*/

ALTER TABLE notes_internes
  DROP CONSTRAINT IF EXISTS notes_internes_auteur_id_fkey;

ALTER TABLE notes_internes
  ADD CONSTRAINT notes_internes_auteur_id_fkey
  FOREIGN KEY (auteur_id) REFERENCES employees(user_id) ON DELETE RESTRICT;
