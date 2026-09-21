/*
  # Ajouter le statut 'archive' aux départs et colis

  1. Modifications des contraintes
    - Ajouter 'archive' aux statuts autorisés pour les départs
    - Ajouter 'archive' aux statuts autorisés pour l'inventaire
  
  2. Sécurité
    - Maintenir les politiques RLS existantes
    - Aucune modification des permissions requise
*/

-- Supprimer et recréer la contrainte de statut pour les départs
ALTER TABLE public.depart 
DROP CONSTRAINT IF EXISTS depart_statut_check;

ALTER TABLE public.depart 
ADD CONSTRAINT depart_statut_check 
CHECK (statut = ANY (ARRAY[
  'preparation_depart'::text, 
  'conteneur_charge'::text, 
  'depart_chine'::text, 
  'arrivee_toamasina'::text, 
  'dedouanement_en_cours'::text, 
  'arrivee_antananarivo'::text, 
  'decharge_trie'::text,
  'archive'::text
]));

-- Supprimer et recréer la contrainte de statut pour l'inventaire
ALTER TABLE public.inventaire 
DROP CONSTRAINT IF EXISTS inventaire_statut_check;

ALTER TABLE public.inventaire 
ADD CONSTRAINT inventaire_statut_check 
CHECK (statut = ANY (ARRAY[
  'en_attente_confirmation'::text, 
  'enregistre_chine'::text, 
  'charge_expedition'::text, 
  'en_route_madagascar'::text, 
  'arrive_toamasina'::text, 
  'dedouanement_cours'::text, 
  'arrive_antananarivo'::text, 
  'pret_livraison_enlevement'::text, 
  'en_cours_livraison'::text, 
  'livre'::text,
  'archive'::text
]));