/*
  # Augmentation de la précision décimale pour volume et poids

  ## Problème
  Les colonnes volume, poids, volume_tana et poids_tana sont définies en DECIMAL(10,2),
  ce qui limite les valeurs à 2 chiffres après la virgule.
  Des valeurs comme 0.004 ou 0.125 sont arrondies à 0.00 ou 0.12/0.13,
  ce qui provoque une violation de la contrainte CHECK (> 0) et empêche la sauvegarde.

  ## Solution
  Passer toutes ces colonnes à DECIMAL(12,4) pour supporter jusqu'à 4 décimales.

  ## Colonnes modifiées
  - `volume` : DECIMAL(10,2) → DECIMAL(12,4)
  - `poids` : DECIMAL(10,2) → DECIMAL(12,4)
  - `volume_tana` : DECIMAL(10,2) → DECIMAL(12,4)
  - `poids_tana` : DECIMAL(10,2) → DECIMAL(12,4)

  ## Impact
  - Correction de l'erreur "violates check constraint inventaire_volume_tana_check"
  - Les valeurs comme 0.004 m³ et 0.125 m³ peuvent désormais être stockées correctement
  - Aucune donnée existante n'est perdue
*/

ALTER TABLE inventaire
  ALTER COLUMN volume TYPE decimal(12,4),
  ALTER COLUMN poids TYPE decimal(12,4),
  ALTER COLUMN volume_tana TYPE decimal(12,4),
  ALTER COLUMN poids_tana TYPE decimal(12,4);
