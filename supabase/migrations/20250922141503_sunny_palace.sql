/*
  # Ajouter contrainte de rôle pour la table employees

  1. Contraintes
    - Ajouter une contrainte CHECK sur la colonne `role` de la table `employees`
    - Seuls 3 rôles autorisés : 'Admin', 'Responsable logistique', 'Commercial'
    
  2. Sécurité
    - La contrainte s'applique automatiquement à tous les INSERT et UPDATE
    - Empêche l'insertion de rôles non autorisés
*/

-- Ajouter une contrainte CHECK pour limiter les rôles possibles
DO $$
BEGIN
  -- Vérifier si la contrainte n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_role_check' 
    AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees 
    ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('Admin', 'Responsable logistique', 'Commercial'));
  END IF;
END $$;