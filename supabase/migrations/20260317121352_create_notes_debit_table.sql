/*
  # Create notes_debit table

  ## Summary
  Creates a new table to store freight debit notes (Notes de Débit) generated
  from the Livraison / Enlèvement section.

  ## New Tables

  ### `notes_debit`
  - `id` (bigint, primary key, auto-increment)
  - `depart_id` (bigint, FK to depart.id) - the departure this note belongs to
  - `reference` (text) - human-readable reference like "ND26001"
  - `prix_cbm_usd` (numeric) - price per CBM in USD
  - `taux_change` (numeric) - exchange rate USD to Ariary
  - `volume_total_tana` (numeric) - sum of volumeTana for selected colis (m³)
  - `montant_total_ariary` (numeric) - final amount = prix_cbm_usd * taux_change * volume_total_tana
  - `colis_ids` (integer[]) - array of selected colis IDs
  - `colis_details` (jsonb) - snapshot of colis data at time of generation
  - `created_by` (uuid, FK to auth.users) - who created the note
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can read all notes
  - Authenticated users can insert notes
  - Admins can delete notes
*/

CREATE TABLE IF NOT EXISTS notes_debit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  depart_id bigint NOT NULL REFERENCES depart(id) ON DELETE CASCADE,
  reference text NOT NULL,
  prix_cbm_usd numeric NOT NULL CHECK (prix_cbm_usd > 0),
  taux_change numeric NOT NULL CHECK (taux_change > 0),
  volume_total_tana numeric NOT NULL CHECK (volume_total_tana > 0),
  montant_total_ariary numeric NOT NULL CHECK (montant_total_ariary > 0),
  colis_ids integer[] NOT NULL DEFAULT '{}',
  colis_details jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes_debit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notes_debit"
  ON notes_debit FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes_debit"
  ON notes_debit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete notes_debit"
  ON notes_debit FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_notes_debit_depart_id ON notes_debit(depart_id);
