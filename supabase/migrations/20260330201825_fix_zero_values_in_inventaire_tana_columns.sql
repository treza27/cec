/*
  # Nettoyage des valeurs zéro dans les colonnes mesurées à Tana

  ## Problème
  Les colonnes volume_tana et poids_tana ont une contrainte CHECK qui interdit la valeur 0 (volume_tana > 0, poids_tana > 0).
  Des données existantes peuvent avoir la valeur 0 suite à d'anciennes saisies, ce qui provoque une erreur
  "new row for relation 'inventaire' violates check constraint 'inventaire_volume_tana_check'" lors des mises à jour.

  ## Correction
  - Remplace toutes les valeurs 0 dans volume_tana par NULL (valeur autorisée par la contrainte)
  - Remplace toutes les valeurs 0 dans poids_tana par NULL (valeur autorisée par la contrainte)
  - Remplace toutes les valeurs négatives dans ces colonnes par NULL (sécurité)
*/

UPDATE inventaire
SET volume_tana = NULL
WHERE volume_tana IS NOT NULL AND volume_tana <= 0;

UPDATE inventaire
SET poids_tana = NULL
WHERE poids_tana IS NOT NULL AND poids_tana <= 0;
