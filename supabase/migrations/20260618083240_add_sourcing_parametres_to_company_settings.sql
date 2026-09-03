ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS sourcing_fret_usd_cbm numeric(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_taux_usd_ar numeric(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_taux_rmb_ar numeric(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_taux_rmb_usd numeric(12,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_marge_1 numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_marge_2 numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sourcing_marge_3 numeric(6,2) DEFAULT 0;
