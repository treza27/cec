-- Augmentation de la précision décimale pour volume et poids de DECIMAL(12,4) à DECIMAL(16,8)
-- Les valeurs très petites comme 0.000049999 s'arrondissaient à 0.0000 avec DECIMAL(12,4),
-- ce qui violait la contrainte CHECK (volume > 0).
ALTER TABLE inventaire
  ALTER COLUMN volume TYPE decimal(16,8),
  ALTER COLUMN poids TYPE decimal(16,8),
  ALTER COLUMN volume_tana TYPE decimal(16,8),
  ALTER COLUMN poids_tana TYPE decimal(16,8);
