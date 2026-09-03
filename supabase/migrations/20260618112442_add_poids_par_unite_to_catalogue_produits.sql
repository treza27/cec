ALTER TABLE catalogue_produits
  ADD COLUMN IF NOT EXISTS poids_par_unite numeric(10,4) NULL;
