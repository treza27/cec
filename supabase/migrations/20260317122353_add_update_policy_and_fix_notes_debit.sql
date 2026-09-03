/*
  # Fix notes_debit: add UPDATE policy

  The two-step create (INSERT then UPDATE for reference) was failing
  because there was no UPDATE RLS policy. This adds the missing policy.
*/

CREATE POLICY "Authenticated users can update notes_debit"
  ON notes_debit FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
