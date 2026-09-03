/*
  # Allow all authenticated agents to read all employee profiles

  ## Problem
  The current SELECT policy on the `employees` table only allows:
  - Administrators to read all rows
  - Other roles to read only their own row

  This causes the "Commerciale" and "Acheteur" columns in the Achats section
  to appear empty for non-admin agents, because the Supabase join query
  cannot resolve employee profiles belonging to other users.

  ## Fix
  Replace the restrictive SELECT policy with one that allows any authenticated
  employee to read all rows. The employees table contains only work-related
  information (name, email, role, profile picture) which is safe to share
  among colleagues.

  ## Changes
  - Drop the old restrictive SELECT policy on `employees`
  - Create a new policy allowing all authenticated users to read all employees
*/

DROP POLICY IF EXISTS "Admins can read all employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.employees;

CREATE POLICY "All authenticated agents can read all employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (true);
