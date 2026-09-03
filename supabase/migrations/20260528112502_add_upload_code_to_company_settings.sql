/*
  # Add upload_code to company_settings

  ## Summary
  Adds a secret access code used to protect the public photo upload page.

  ## Changes
  - `company_settings` table: new column `upload_code` (text, not null, default 'TPL')

  ## Notes
  - Default value is 'TPL' as requested
  - Existing RLS policies already allow anon read access to company_settings
  - Only administrators can modify this value via the existing update policy
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'upload_code'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN upload_code text NOT NULL DEFAULT 'TPL';
  END IF;
END $$;
