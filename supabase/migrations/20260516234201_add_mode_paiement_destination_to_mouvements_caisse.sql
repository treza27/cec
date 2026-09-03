/*
  # Add mode_paiement_destination to mouvements_caisse

  ## Summary
  Adds a `mode_paiement_destination` column to support the new internal transfer
  logic where source and destination payment modes can differ within the same
  caisse (e.g. Especes → MVola) or across caisses.

  ## Changes
  - `mouvements_caisse`: new nullable text column `mode_paiement_destination`
    Stores the receiving mode for transfert_interne rows (entry side).
    NULL for all other mouvement types.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_caisse' AND column_name = 'mode_paiement_destination'
  ) THEN
    ALTER TABLE mouvements_caisse ADD COLUMN mode_paiement_destination text;
  END IF;
END $$;
