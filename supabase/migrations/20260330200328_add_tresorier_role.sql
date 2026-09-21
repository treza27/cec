/*
  # Ajout du rôle "trésorier"

  ## Résumé
  Ajout d'un nouveau rôle "trésorier" dans la contrainte CHECK de la table employees.

  ## Modifications
  - Table `employees` : la contrainte `employees_role_check` est élargie pour inclure le rôle 'tresorier'

  ## Accès accordés au trésorier
  - Inventaire
  - Contre mesure
  - Livraison / Enlèvement
  - Clients
  - Profil

  ## Notes
  - Le rôle 'tresorier' est sans accent pour la valeur en base (compatibilité technique)
  - Aucune donnée existante n'est affectée
*/

ALTER TABLE public.employees
DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE public.employees
ADD CONSTRAINT employees_role_check
CHECK (role IN ('administrateur', 'commercial', 'acheteur', 'logisticien', 'tresorier'));
