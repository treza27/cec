/*
  # Rendre seul le shipping mark obligatoire

  1. Modifications de contraintes
    - Supprimer les contraintes NOT NULL sur bl et description
    - Garder shipping_mark comme seul champ obligatoire (avec nom/prénom pour les clients)
    - Permettre des valeurs par défaut pour les champs numériques

  2. Sécurité
    - Maintenir RLS et les politiques existantes
*/

-- Modifier la table inventaire pour rendre seul shipping_mark obligatoire
ALTER TABLE inventaire 
  ALTER COLUMN bl DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL;

-- Ajouter des valeurs par défaut pour éviter les erreurs
ALTER TABLE inventaire 
  ALTER COLUMN bl SET DEFAULT '',
  ALTER COLUMN description SET DEFAULT '';