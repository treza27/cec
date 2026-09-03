/*
  # Allow public read access to company_settings

  ## Summary
  The client portal (tracking space) is used by unauthenticated visitors.
  When they view their documents (Note de Débit, Bon de Livraison), the
  modal fetches company_settings to display the company header (name, logo,
  address, phone). The existing SELECT policy only allows authenticated users,
  so the settings returned null for public users.

  ## Changes
  - Add a SELECT policy on `company_settings` for the `anon` role so that
    unauthenticated users can read the single company settings row.
    This is safe because company settings (name, address, logo) are
    intentionally public-facing information shown on all documents.
*/

CREATE POLICY "Public can read company settings"
  ON company_settings
  FOR SELECT
  TO anon
  USING (true);
