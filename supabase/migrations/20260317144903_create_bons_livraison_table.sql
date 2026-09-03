/*
  # Create bons_livraison table

  ## Summary
  Creates the table for delivery notes (bons de livraison) with support for partial deliveries.
  Each bon de livraison can cover a subset of colis from a departure, with editable delivered
  quantities (volume, weight, number of cartons) per colis, enabling partial deliveries.

  ## New Tables
  - `bons_livraison`
    - `id` (serial, primary key)
    - `depart_id` (integer, FK to departures) — the departure this bon belongs to
    - `reference` (text, unique) — auto-generated reference e.g. BL26XXXXX
    - `client_nom` (text, nullable) — client name (free text or from existing client)
    - `colis_ids` (integer[]) — list of colis IDs included in this bon
    - `colis_details` (jsonb) — per-colis details with both original Tana values and delivered values
    - `volume_total_livre` (numeric) — sum of delivered volumes
    - `poids_total_livre` (numeric) — sum of delivered weights
    - `nb_cartons_total_livre` (integer) — sum of delivered cartons
    - `is_partial` (boolean) — true if any delivered value differs from original Tana value
    - `created_by` (uuid, FK to auth.users) — agent who created the bon
    - `created_at` (timestamptz) — creation timestamp

  ## colis_details JSON structure (per colis)
  Each entry in the JSONB array:
  - id, shippingMark, description
  - nbPalettesTana, nbCartonsTana, poidsTana, volumeTana (original values from Tana measurement)
  - nbCartonsLivres, poidsLivre, volumeLivre (actual delivered values — editable by user)

  ## Security
  - RLS enabled
  - SELECT: authenticated users only
  - INSERT: authenticated users only
  - DELETE: authenticated users only
*/

CREATE TABLE IF NOT EXISTS bons_livraison (
  id serial PRIMARY KEY,
  depart_id integer NOT NULL,
  reference text NOT NULL UNIQUE,
  client_nom text DEFAULT NULL,
  colis_ids integer[] NOT NULL DEFAULT '{}',
  colis_details jsonb NOT NULL DEFAULT '[]',
  volume_total_livre numeric NOT NULL DEFAULT 0,
  poids_total_livre numeric NOT NULL DEFAULT 0,
  nb_cartons_total_livre integer NOT NULL DEFAULT 0,
  is_partial boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bons_livraison ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bons de livraison"
  ON bons_livraison FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bons de livraison"
  ON bons_livraison FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete bons de livraison"
  ON bons_livraison FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_bons_livraison_depart_id ON bons_livraison(depart_id);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_created_at ON bons_livraison(created_at DESC);
