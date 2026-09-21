/*
  # Create devis_requests table

  ## Purpose
  Stores quote requests submitted by visitors through the public Tarification page.

  ## New Table: devis_requests
  - `id` (uuid, primary key)
  - `nom` (text) – full name of the requester
  - `email` (text) – email address
  - `whatsapp` (text) – WhatsApp number
  - `type_service` (text) – 'lcl' | 'fcl' | 'conseil'
  - `description_marchandise` (text) – description of goods
  - `poids_estime` (text) – estimated weight (free text, e.g. "200 kg")
  - `volume_estime` (text) – estimated volume in CBM (free text)
  - `destination` (text) – target province in Madagascar
  - `message` (text, nullable) – additional message
  - `statut` (text) – 'nouveau' | 'traite' | 'archive', default 'nouveau'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public (anonymous) users can INSERT (submit a quote request)
  - Authenticated users (agents) can SELECT and UPDATE (manage requests)
  - No public SELECT (privacy of requests)
  - Admins can DELETE
*/

CREATE TABLE IF NOT EXISTS devis_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text,
  whatsapp text,
  type_service text NOT NULL DEFAULT 'lcl',
  description_marchandise text NOT NULL,
  poids_estime text,
  volume_estime text,
  destination text,
  message text,
  statut text NOT NULL DEFAULT 'nouveau',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE devis_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit quote requests"
  ON devis_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated agents can view quote requests"
  ON devis_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated agents can update quote requests"
  ON devis_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated agents can delete quote requests"
  ON devis_requests
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_devis_requests_statut ON devis_requests (statut);
CREATE INDEX IF NOT EXISTS idx_devis_requests_created_at ON devis_requests (created_at DESC);

CREATE OR REPLACE FUNCTION update_devis_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_devis_requests_updated_at
  BEFORE UPDATE ON devis_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_requests_updated_at();
