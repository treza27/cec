/*
  # Ajout du statut "Acheté" dans le cycle de vie des demandes d'achat

  ## Résumé
  Ce migration ajoute un nouveau statut "Acheté" dans la table `demandes_achat`, 
  qui représente l'étape où la responsable caisse a effectué l'achat en RMB sur 
  un site chinois via Alipay, après que le client a payé en Ariary.

  ## Cycle de vie complet
  Nouveau → En cours d'analyse → Devis Prêt → Payé → **Acheté**
  (Rejeté possible à tout moment)

  ## Changements

  ### 1. Table `demandes_achat`
  - Ajout de 'Acheté' dans la contrainte CHECK sur la colonne `statut`

  ### 2. Triggers automatiques
  - `trigger_marquer_achete_on_mouvement_alipay` : quand un mouvement Alipay
    de type `achat_fournisseur` non annulé est créé avec un `demande_achat_id`,
    la demande liée passe automatiquement en statut "Acheté"
  - `trigger_revert_achete_on_annulation_alipay` : quand ce mouvement est annulé
    (est_annule = true), si aucun autre mouvement achat_fournisseur non annulé
    n'existe pour cette demande, le statut revient à "Payé"

  ## Notes importantes
  - La transition Payé → Acheté est entièrement automatique
  - La transition Acheté → Payé (annulation) est aussi automatique
  - Un seul mouvement actif suffit pour maintenir le statut "Acheté"
*/

-- 1. Modifier la contrainte CHECK pour ajouter 'Acheté'
ALTER TABLE demandes_achat
  DROP CONSTRAINT IF EXISTS demandes_achat_statut_check;

ALTER TABLE demandes_achat
  ADD CONSTRAINT demandes_achat_statut_check
  CHECK (statut IN ('Nouveau', 'En cours d''analyse', 'Action requise', 'Devis Prêt', 'Rejeté', 'Payé', 'Acheté'));

-- 2. Fonction trigger : passer en "Acheté" lors de la création d'un mouvement Alipay achat_fournisseur
CREATE OR REPLACE FUNCTION fn_marquer_achete_on_mouvement_alipay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Uniquement pour les achats fournisseur liés à une demande, non annulés
  IF NEW.type_mouvement = 'achat_fournisseur'
    AND NEW.demande_achat_id IS NOT NULL
    AND NEW.est_annule = false
  THEN
    UPDATE demandes_achat
    SET statut = 'Acheté', updated_at = now()
    WHERE id = NEW.demande_achat_id
      AND statut = 'Payé';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger AFTER INSERT sur mouvements_alipay
DROP TRIGGER IF EXISTS trigger_marquer_achete_on_mouvement_alipay ON mouvements_alipay;
CREATE TRIGGER trigger_marquer_achete_on_mouvement_alipay
  AFTER INSERT ON mouvements_alipay
  FOR EACH ROW
  EXECUTE FUNCTION fn_marquer_achete_on_mouvement_alipay();

-- 4. Fonction trigger : revenir à "Payé" si le mouvement est annulé et qu'il n'en reste aucun autre actif
CREATE OR REPLACE FUNCTION fn_revert_achete_on_annulation_alipay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demande_id bigint;
  v_actifs_restants int;
BEGIN
  -- Uniquement si le mouvement passe à annulé (est_annule devient true)
  IF NEW.est_annule = true
    AND OLD.est_annule = false
    AND NEW.type_mouvement = 'achat_fournisseur'
    AND NEW.demande_achat_id IS NOT NULL
  THEN
    v_demande_id := NEW.demande_achat_id;

    -- Compter les mouvements achat_fournisseur actifs restants pour cette demande
    SELECT COUNT(*) INTO v_actifs_restants
    FROM mouvements_alipay
    WHERE demande_achat_id = v_demande_id
      AND type_mouvement = 'achat_fournisseur'
      AND est_annule = false
      AND id != NEW.id;

    -- Si aucun mouvement actif restant, revenir à "Payé"
    IF v_actifs_restants = 0 THEN
      UPDATE demandes_achat
      SET statut = 'Payé', updated_at = now()
      WHERE id = v_demande_id
        AND statut = 'Acheté';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Trigger AFTER UPDATE sur mouvements_alipay (pour la gestion des annulations)
DROP TRIGGER IF EXISTS trigger_revert_achete_on_annulation_alipay ON mouvements_alipay;
CREATE TRIGGER trigger_revert_achete_on_annulation_alipay
  AFTER UPDATE ON mouvements_alipay
  FOR EACH ROW
  EXECUTE FUNCTION fn_revert_achete_on_annulation_alipay();
