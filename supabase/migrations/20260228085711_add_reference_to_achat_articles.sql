/*
  # Add reference column to achat_articles

  ## Changes
  - `achat_articles` table: add `reference` column (text, nullable)
    - Stores an optional product reference/SKU for each article
    - Displayed in the article table between Article and Lien columns
    - Also visible in the devis (quote) PDF view
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achat_articles' AND column_name = 'reference'
  ) THEN
    ALTER TABLE achat_articles ADD COLUMN reference text DEFAULT NULL;
  END IF;
END $$;
