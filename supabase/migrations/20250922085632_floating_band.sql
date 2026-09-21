/*
  # Ajouter la politique INSERT manquante pour la table employees

  1. Sécurité
    - Ajouter une politique pour permettre aux utilisateurs authentifiés de créer leur propre profil employé
    - La politique vérifie que l'utilisateur ne peut créer un profil que pour son propre user_id
*/

-- Ajouter la politique INSERT pour permettre aux utilisateurs authentifiés de créer leur propre profil
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);