/*
# Restrict notes_debit UPDATE and DELETE to administrators only

1. Security changes
- Replace the existing UPDATE policy on `notes_debit` so that only authenticated
  users whose `employees.role = 'administrateur'` can modify a note de débit.
- Replace the existing DELETE policy on `notes_debit` so that only authenticated
  users whose `employees.role = 'administrateur'` can delete a note de débit.
- SELECT and INSERT policies remain unchanged (all authenticated agents can
  read notes and create new ones).
- The admin check matches the pattern already used by other tables in this
  project (e.g. articles, inventory delete restriction).
*/

DROP POLICY IF EXISTS "Authenticated users can update notes_debit" ON notes_debit;
DROP POLICY IF EXISTS "Authenticated users can delete notes_debit" ON notes_debit;

CREATE POLICY "Admins can update notes_debit"
  ON notes_debit FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );

CREATE POLICY "Admins can delete notes_debit"
  ON notes_debit FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );
