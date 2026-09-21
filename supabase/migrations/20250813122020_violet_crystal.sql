/*
  # Ajouter le statut "En attente de confirmation"

  1. Modifications
    - Mise à jour de la contrainte `inventaire_statut_check` pour inclure le nouveau statut
    - Ajout du statut 'en_attente_confirmation' en première position
    - Modification de la valeur par défaut pour utiliser le nouveau statut

  2. Sécurité
    - Aucune modification des politiques RLS existantes
    - Conservation de toutes les contraintes de sécurité

  3. Notes
    - Le nouveau statut permet de pré-renseigner des commandes en attente
    - Statut par défaut modifié pour refléter l'état initial des nouvelles commandes
*/

-- Supprimer l'ancienne contrainte de statut
ALTER TABLE inventaire DROP CONSTRAINT IF EXISTS inventaire_statut_check;

-- Ajouter la nouvelle contrainte avec le statut 'en_attente_confirmation' en premier
ALTER TABLE inventaire ADD CONSTRAINT inventaire_statut_check 
CHECK ((statut = ANY (ARRAY[
  'en_attente_confirmation'::text,
  'enregistre_chine'::text, 
  'charge_expedition'::text, 
  'en_route_madagascar'::text, 
  'arrive_toamasina'::text, 
  'dedouanement_cours'::text, 
  'arrive_antananarivo'::text, 
  'pret_livraison_enlevement'::text, 
  'en_cours_livraison'::text, 
  'livre'::text
])));

-- Mettre à jour la valeur par défaut du statut
ALTER TABLE inventaire ALTER COLUMN statut SET DEFAULT 'en_attente_confirmation'::text;