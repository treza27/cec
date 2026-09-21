/*
  # Unification de "versement_banque" dans "transfert_interne"

  ## Objectif
  Fusionner les deux types de mouvement de caisse "versement_banque" et "transfert_interne"
  en un seul type "transfert_interne". Le type "versement_banque" est supprimé.

  ## Modifications
  1. Migration des données : toutes les lignes mouvements_caisse dont type_mouvement = 'versement_banque'
     deviennent type_mouvement = 'transfert_interne'. Leurs champs compte_bancaire_id et autres
     données sont conservés intacts.
  2. Mise à jour de la contrainte CHECK sur type_mouvement pour retirer 'versement_banque'.

  ## Notes
  - Les champs compte_bancaire_id et caisse_destination_id restent tous les deux dans la table.
  - Un transfert vers une banque aura compte_bancaire_id renseigné (et caisse_destination_id NULL).
  - Un transfert vers une caisse aura caisse_destination_id renseigné (et compte_bancaire_id NULL).
  - Aucune donnée n'est perdue.
*/

-- 1. Migrer les lignes existantes
UPDATE mouvements_caisse
SET type_mouvement = 'transfert_interne'
WHERE type_mouvement = 'versement_banque';

-- 2. Supprimer l'ancienne contrainte CHECK (le nom exact peut varier)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'mouvements_caisse'
      AND constraint_name = 'mouvements_caisse_type_mouvement_check'
  ) THEN
    ALTER TABLE mouvements_caisse DROP CONSTRAINT mouvements_caisse_type_mouvement_check;
  END IF;
END $$;

-- 3. Recréer la contrainte CHECK sans 'versement_banque'
ALTER TABLE mouvements_caisse
  ADD CONSTRAINT mouvements_caisse_type_mouvement_check
  CHECK (type_mouvement IN (
    'entree_client',
    'achat_rmb',
    'paiement_note_debit',
    'frais_annexe',
    'loyer',
    'achat_materiel',
    'salaire',
    'avance_salaire',
    'transfert_interne',
    'autre_entree',
    'autre_sortie'
  ));
