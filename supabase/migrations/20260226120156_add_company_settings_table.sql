/*
  # Création de la table company_settings

  ## Résumé
  Création d'une table pour stocker les paramètres administratifs de l'entreprise
  utilisés notamment pour la génération des devis. Cette table contient une seule
  ligne mise à jour par upsert.

  ## Nouvelle Table: `company_settings`

  ### Colonnes
  - `id` (integer, PK, toujours 1) : identifiant fixe pour la ligne unique
  - `nom_entreprise` : Nom légal de l'entreprise
  - `adresse` : Adresse complète
  - `telephone` : Numéro de téléphone principal
  - `email` : Email de contact
  - `site_web` : URL du site web
  - `num_stat` : Numéro STAT
  - `num_nif` : Numéro NIF
  - `num_rcs` : Numéro RCS
  - `logo_url` : URL du logo stocké dans Supabase Storage
  - `conditions_paiement` : Texte des conditions de paiement
  - `mentions_legales` : Mentions légales pour le pied de page des devis
  - `signature_devis` : Texte de signature / formule de politesse
  - `created_at` / `updated_at` : Timestamps

  ## Sécurité
  - RLS activé
  - SELECT : tous les employés authentifiés peuvent lire
  - INSERT : uniquement les Admins (via app_metadata.role)
  - UPDATE : uniquement les Admins (via app_metadata.role)
  - DELETE : aucun (ligne unique protégée)
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nom_entreprise TEXT NOT NULL DEFAULT '',
  adresse TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  site_web TEXT DEFAULT '',
  num_stat TEXT DEFAULT '',
  num_nif TEXT DEFAULT '',
  num_rcs TEXT DEFAULT '',
  logo_url TEXT,
  conditions_paiement TEXT DEFAULT '',
  mentions_legales TEXT DEFAULT '',
  signature_devis TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_settings_single_row CHECK (id = 1)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read company_settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert company_settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update company_settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'Admin'
    )
  );

INSERT INTO company_settings (id, nom_entreprise, adresse, telephone, email)
VALUES (1, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
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

DROP TRIGGER IF EXISTS set_company_settings_updated_at ON company_settings;
CREATE TRIGGER set_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();
