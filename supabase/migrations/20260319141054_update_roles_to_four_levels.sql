/*
  # Mise à jour du système de rôles vers 4 niveaux

  ## Résumé
  Ce migration remplace l'ancien système à 3 rôles (Admin, Responsable logistique, Commercial)
  par un nouveau système à 4 rôles : administrateur, commercial, acheteur, logisticien.

  ## Changements

  ### Table `employees`
  - Suppression de la contrainte CHECK existante sur la colonne `role`
  - Migration des données existantes :
    - 'Admin' → 'administrateur'
    - 'Responsable logistique' → 'logisticien'
    - 'Commercial' → 'commercial'
    - 'Agent Logistique' → 'acheteur'
    - Toutes autres valeurs → 'acheteur' (valeur par défaut)
  - Ajout d'une nouvelle contrainte CHECK avec les 4 nouveaux rôles

  ### Politiques RLS
  - Mise à jour de la fonction helper `get_current_employee_role()` (inchangée car elle retourne juste le rôle)
  - Mise à jour de toutes les politiques qui comparaient role = 'Admin' vers role = 'administrateur'
    - Politique DELETE sur `inventaire`
    - Politique DELETE sur `demandes_achat`
    - Politiques sur `employees` (lecture de tous les employés)
    - Politiques sur `company_settings`

  ## Notes importantes
  - Les données existantes sont migrées automatiquement
  - Le rôle par défaut pour les nouveaux employés sera 'acheteur'
*/

-- Étape 1 : Supprimer l'ancienne contrainte CHECK sur la colonne role
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- Étape 2 : Migrer les données existantes vers les nouveaux noms de rôles
UPDATE public.employees SET role = 'administrateur' WHERE role = 'Admin';
UPDATE public.employees SET role = 'logisticien' WHERE role = 'Responsable logistique';
UPDATE public.employees SET role = 'commercial' WHERE role = 'Commercial';
UPDATE public.employees SET role = 'acheteur' WHERE role = 'Agent Logistique';
UPDATE public.employees SET role = 'acheteur' WHERE role NOT IN ('administrateur', 'logisticien', 'commercial', 'acheteur') AND role IS NOT NULL;

-- Étape 3 : Ajouter la nouvelle contrainte CHECK avec les 4 rôles
ALTER TABLE public.employees
ADD CONSTRAINT employees_role_check
CHECK (role IN ('administrateur', 'commercial', 'acheteur', 'logisticien'));

-- Étape 4 : Mettre à jour la fonction helper qui vérifie le rôle (elle retourne le rôle brut, donc pas de changement nécessaire dans la fonction elle-même)
-- La fonction get_current_employee_role() retourne simplement le rôle de l'employé courant

-- Étape 5 : Mettre à jour les politiques RLS qui comparent role = 'Admin'

-- Politique DELETE sur inventaire
DROP POLICY IF EXISTS "Seuls les admins peuvent supprimer des colis" ON public.inventaire;
CREATE POLICY "Seuls les admins peuvent supprimer des colis"
  ON public.inventaire
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

-- Politique DELETE sur demandes_achat
DROP POLICY IF EXISTS "Seuls les admins peuvent supprimer des demandes achat" ON public.demandes_achat;
CREATE POLICY "Seuls les admins peuvent supprimer des demandes achat"
  ON public.demandes_achat
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

-- Mise à jour de la fonction helper pour employees (si elle compare 'Admin')
CREATE OR REPLACE FUNCTION get_current_employee_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Mettre à jour les politiques employees qui utilisent get_current_employee_role() = 'Admin'
DROP POLICY IF EXISTS "Admins can read all employees" ON public.employees;
CREATE POLICY "Admins can read all employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    get_current_employee_role() = 'administrateur'
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update any employee" ON public.employees;
CREATE POLICY "Admins can update any employee"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (get_current_employee_role() = 'administrateur')
  WITH CHECK (get_current_employee_role() = 'administrateur');

-- Mettre à jour les politiques company_settings qui comparent 'Admin'
DROP POLICY IF EXISTS "Admins can read company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can update company settings" ON public.company_settings;

CREATE POLICY "Admins can read company settings"
  ON public.company_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

CREATE POLICY "Admins can insert company settings"
  ON public.company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

CREATE POLICY "Admins can update company settings"
  ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );
