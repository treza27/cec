/*
  # Fix RLS recursion on employees table

  ## Problem
  The "Admins can read all employees" policy used EXISTS (SELECT FROM employees WHERE role = 'Admin')
  which caused infinite recursion - the policy triggers itself.

  ## Solution
  1. Drop the recursive policies
  2. Create a SECURITY DEFINER helper function that bypasses RLS to get the current user's role
  3. Recreate the admin policies using this helper function

  ## Changes
  - Drop policy "Admins can read all employees"
  - Drop policy "Admins can update all employees"
  - Create function get_current_employee_role() with SECURITY DEFINER
  - Recreate admin SELECT policy using the helper function
  - Recreate admin UPDATE policy using the helper function
*/

DROP POLICY IF EXISTS "Admins can read all employees" ON employees;
DROP POLICY IF EXISTS "Admins can update all employees" ON employees;

CREATE OR REPLACE FUNCTION get_current_employee_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Admins can read all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (get_current_employee_role() = 'Admin');

CREATE POLICY "Admins can update all employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (get_current_employee_role() = 'Admin')
  WITH CHECK (get_current_employee_role() = 'Admin');
