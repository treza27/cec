/*
  # Upgrade du statut client vers un système à 4 niveaux

  ## Résumé
  Remplacement du système binaire (Prospect / Client) par une hiérarchie à 4 niveaux :
  - Prospect : nouveau contact, aucun achat réalisé
  - Client Argent : premier achat payé (promotion automatique depuis Prospect)
  - Client Or : niveau intermédiaire, assigné manuellement
  - Client Platine : niveau premium, assigné manuellement

  ## Modifications
  1. Table `clients` :
     - Suppression de l'ancienne contrainte CHECK sur statut_contact
     - Ajout d'une nouvelle contrainte CHECK autorisant les 4 valeurs
     - Migration des données : 'Client' existants deviennent 'Client Argent'

  2. Fonction trigger `update_client_statut_on_payment` :
     - Mise à jour pour promouvoir les Prospects en 'Client Argent' (au lieu de 'Client')

  ## Valeurs autorisées
  - 'Prospect'
  - 'Client Argent'
  - 'Client Or'
  - 'Client Platine'

  ## Notes
  - La promotion automatique ne concerne que les Prospects (premier achat)
  - Les niveaux Or et Platine sont attribués manuellement
  - Les clients déjà au statut 'Client' sont migrés en 'Client Argent'
*/

-- Étape 1 : Supprimer l'ancienne contrainte CHECK
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_statut_contact_check;

-- Étape 2 : Migrer les données existantes ('Client' -> 'Client Argent')
UPDATE clients
SET statut_contact = 'Client Argent'
WHERE statut_contact = 'Client';

-- Étape 3 : Ajouter la nouvelle contrainte CHECK avec les 4 niveaux
ALTER TABLE clients
ADD CONSTRAINT clients_statut_contact_check
CHECK (statut_contact IN ('Prospect', 'Client Argent', 'Client Or', 'Client Platine'));

-- Étape 4 : Mettre à jour la fonction trigger pour promouvoir vers 'Client Argent'
CREATE OR REPLACE FUNCTION update_client_statut_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.statut = 'Payé' AND (OLD.statut IS NULL OR OLD.statut != 'Payé') THEN
    UPDATE clients
    SET statut_contact = 'Client Argent'
    WHERE id = NEW.client_id
      AND statut_contact = 'Prospect';
  END IF;

  RETURN NEW;
END;
$$;
