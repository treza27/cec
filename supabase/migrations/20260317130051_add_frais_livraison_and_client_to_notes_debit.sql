/*
  # Add frais_livraison and client_nom to notes_debit

  ## Summary
  Adds two optional columns to the notes_debit table:
  - `frais_livraison_ariary`: optional delivery fee in Ariary to be added on top of the CBM amount
  - `client_nom`: display name of the client (free text or selected from existing clients)

  ## Changes to notes_debit
  - `frais_livraison_ariary` (numeric, nullable) — optional delivery fee in Ariary
  - `client_nom` (text, nullable) — client name shown on the document

  ## Notes
  - Both columns are nullable so existing records are unaffected
  - montant_total_ariary continues to represent the CBM subtotal only; the final total
    displayed on the document adds frais_livraison_ariary when present
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes_debit' AND column_name = 'frais_livraison_ariary'
  ) THEN
    ALTER TABLE notes_debit ADD COLUMN frais_livraison_ariary numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes_debit' AND column_name = 'client_nom'
  ) THEN
    ALTER TABLE notes_debit ADD COLUMN client_nom text DEFAULT NULL;
  END IF;
END $$;
