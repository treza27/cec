/*
  # Add SEO fields to articles table

  ## Changes
  - New Columns on `articles`:
    - `meta_description` (text, nullable): Custom meta description for SEO (150-160 chars recommended). Falls back to `resume` if empty.
    - `mots_cles` (text[], nullable): Array of keywords associated with the article for SEO meta tags and JSON-LD schema.

  ## Notes
  - Both fields are optional to maintain backward compatibility with existing articles.
  - The application falls back to `resume` for meta description when `meta_description` is not set.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE articles ADD COLUMN meta_description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'mots_cles'
  ) THEN
    ALTER TABLE articles ADD COLUMN mots_cles text[] DEFAULT '{}';
  END IF;
END $$;
