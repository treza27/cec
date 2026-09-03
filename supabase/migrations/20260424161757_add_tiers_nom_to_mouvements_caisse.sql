/*
  # Ajout du champ tiers_nom dans mouvements_caisse

  ## Contexte
  Ajout d'un champ texte libre permettant de saisir le nom du tiers concerné par un mouvement :
  - Pour une **entrée** : la provenance (ex: nom du client ou de l'expéditeur)
  - Pour une **sortie** : le bénéficiaire (ex: nom du fournisseur, prestataire, etc.)

  ## Modification
  - Table : `mouvements_caisse`
  - Nouvelle colonne `tiers_nom` (text, nullable) — champ libre, complémentaire aux FK existantes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_caisse' AND column_name = 'tiers_nom'
  ) THEN
    ALTER TABLE mouvements_caisse ADD COLUMN tiers_nom text;
  END IF;
END $$;
