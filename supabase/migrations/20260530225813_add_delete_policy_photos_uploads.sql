/*
  # Add DELETE policy on photos_uploads and storage

  1. Security Changes
    - Add DELETE policy on `photos_uploads` table restricted to authenticated users with
      the `administrateur` role (checked via employees table)
    - This allows admins to delete individual photos or entire day groups
*/

-- Allow authenticated admins to delete photos records
CREATE POLICY "Admins can delete photos"
  ON photos_uploads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role = 'administrateur'
    )
  );
