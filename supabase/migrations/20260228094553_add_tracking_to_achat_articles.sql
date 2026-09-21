/*
  # Add tracking column to achat_articles

  ## Changes
  - `achat_articles` table: add `tracking` column (text, nullable)
    - Stores the tracking number/URL for an article once the purchase has been made
    - Filled in after the purchase, as tracking info becomes available a few days later
    - Displayed between the Lien and Quantité columns in the article table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achat_articles' AND column_name = 'tracking'
  ) THEN
    ALTER TABLE achat_articles ADD COLUMN tracking text DEFAULT NULL;
  END IF;
END $$;
