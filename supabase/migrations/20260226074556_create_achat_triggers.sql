/*
  # Création des triggers pour la gestion des demandes d'achat

  ## Résumé
  Deux triggers automatisent la logique métier principale :
  1. Mise à jour automatique des timestamps de traitement et validation selon le statut
  2. Mise à jour automatique du statut_contact du client quand une demande passe à "Payé"
  3. Mise à jour automatique du champ updated_at

  ## Trigger 1: update_demande_achat_timestamps
  - Déclenché: BEFORE UPDATE sur demandes_achat
  - Action: met à jour date_traitement quand statut -> "En cours d'analyse"
  - Action: met à jour date_validation quand statut -> "Devis Prêt"
  - Action: toujours met à jour updated_at

  ## Trigger 2: update_client_statut_on_payment
  - Déclenché: AFTER UPDATE sur demandes_achat
  - Condition: statut passe à "Payé"
  - Action: change statut_contact du client lié de "Prospect" à "Client"

  ## Notes
  - Les triggers sont STABLE/VOLATILE selon les bonnes pratiques Supabase
  - Le trigger de payment ne modifie le statut que si le client est encore "Prospect"
*/

CREATE OR REPLACE FUNCTION update_demande_achat_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();

  IF NEW.statut = 'En cours d''analyse' AND (OLD.statut IS NULL OR OLD.statut != 'En cours d''analyse') THEN
    IF NEW.date_traitement IS NULL THEN
      NEW.date_traitement = now();
    END IF;
  END IF;

  IF NEW.statut = 'Devis Prêt' AND (OLD.statut IS NULL OR OLD.statut != 'Devis Prêt') THEN
    IF NEW.date_validation IS NULL THEN
      NEW.date_validation = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_demande_achat_timestamps ON demandes_achat;
CREATE TRIGGER trigger_update_demande_achat_timestamps
  BEFORE UPDATE ON demandes_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_demande_achat_timestamps();

CREATE OR REPLACE FUNCTION update_client_statut_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.statut = 'Payé' AND (OLD.statut IS NULL OR OLD.statut != 'Payé') THEN
    UPDATE clients
    SET statut_contact = 'Client'
    WHERE id = NEW.client_id
      AND statut_contact = 'Prospect';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_client_statut_on_payment ON demandes_achat;
CREATE TRIGGER trigger_update_client_statut_on_payment
  AFTER UPDATE ON demandes_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_client_statut_on_payment();

CREATE OR REPLACE FUNCTION set_demandes_achat_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
