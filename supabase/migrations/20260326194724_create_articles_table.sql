/*
  # Création de la table articles (Blog / Actualités)

  ## Résumé
  Cette migration crée la table `articles` qui permettra à l'équipe CEC de publier
  des articles de blog et actualités directement depuis l'espace agent, visibles
  publiquement sur le site.

  ## Nouvelles tables

  ### `articles`
  - `id` (uuid, clé primaire) — identifiant unique
  - `titre` (text, obligatoire) — titre de l'article
  - `slug` (text, unique, obligatoire) — URL SEO-friendly (ex: "comment-importer-depuis-la-chine")
  - `resume` (text) — résumé court affiché dans les cartes de liste
  - `contenu` (text) — corps complet de l'article (Markdown ou texte riche)
  - `image_url` (text) — URL de l'image de couverture
  - `categorie` (text) — catégorie (Conseils Import, Actualités marché, Guides pratiques, Nouvelles CEC)
  - `auteur` (text) — nom de l'auteur affiché
  - `published` (boolean, défaut false) — article visible publiquement ou brouillon
  - `created_by` (uuid, FK → auth.users) — agent qui a créé l'article
  - `date_publication` (timestamptz) — date affichée sur l'article (peut différer de created_at)
  - `created_at` (timestamptz, défaut now()) — date de création en base
  - `updated_at` (timestamptz, défaut now()) — date de dernière modification

  ## Sécurité (RLS)

  1. Lecture publique uniquement pour les articles `published = true`
  2. Les agents authentifiés peuvent lire tous les articles (y compris brouillons)
  3. Les agents authentifiés peuvent créer des articles
  4. Les agents authentifiés peuvent modifier leurs propres articles
  5. Seul l'administrateur peut supprimer des articles (géré via rôle employee)

  ## Index
  - Index sur `slug` pour les lookups URL rapides
  - Index sur `published` + `date_publication` pour les requêtes de liste publique
  - Index sur `categorie` pour le filtrage
*/

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  slug text UNIQUE NOT NULL,
  resume text DEFAULT '',
  contenu text DEFAULT '',
  image_url text DEFAULT '',
  categorie text DEFAULT 'Nouvelles CEC',
  auteur text DEFAULT '',
  published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  date_publication timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des articles publiés"
  ON articles
  FOR SELECT
  TO anon
  USING (published = true);

CREATE POLICY "Agents peuvent lire tous les articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents peuvent créer des articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Agents peuvent modifier leurs articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins peuvent modifier tous les articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

CREATE POLICY "Admins peuvent supprimer des articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles (published, date_publication DESC);
CREATE INDEX IF NOT EXISTS idx_articles_categorie ON articles (categorie);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles (created_by);

CREATE OR REPLACE FUNCTION update_articles_updated_at()
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

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();
