/*
  # Création de la table comptes_alipay

  ## Description
  Chaque responsable de caisse qui reçoit du RMB (via un achat de devises) peut avoir un
  portefeuille Alipay associé. Ce portefeuille est crédité automatiquement lors d'un
  mouvement caisse de type `achat_rmb`, et débité lors d'achats fournisseurs en Chine
  (en RMB, avec ou sans lien vers une demande d'achat).

  ## Nouvelles tables
  - `comptes_alipay` : un compte Alipay par responsable (solde exprimé en RMB ¥)

  ## Colonnes
  - `id` : identifiant auto-incrémenté
  - `nom` : nom affiché du compte (ex. "Alipay Jean")
  - `responsable_id` : FK vers employees.user_id
  - `solde_initial_rmb` : solde de départ en RMB (pour saisir un historique existant)
  - `date_solde_initial` : date à laquelle s'applique le solde initial
  - `est_actif` : archivage logique
  - `created_at`, `updated_at` : timestamps

  ## Sécurité
  - RLS activé
  - Lecture : tous les agents authentifiés
  - Écriture (insert/update) : admins uniquement
*/

CREATE TABLE IF NOT EXISTS comptes_alipay (
  id              bigserial PRIMARY KEY,
  nom             text NOT NULL DEFAULT '',
  responsable_id  uuid REFERENCES employees(user_id) ON DELETE SET NULL,
  solde_initial_rmb numeric(14, 4) NOT NULL DEFAULT 0,
  date_solde_initial date NOT NULL DEFAULT CURRENT_DATE,
  est_actif       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comptes_alipay ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view comptes alipay"
  ON comptes_alipay FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert comptes alipay"
  ON comptes_alipay FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update comptes alipay"
  ON comptes_alipay FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
        AND employees.role IN ('admin', 'superadmin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_comptes_alipay_responsable ON comptes_alipay(responsable_id);
CREATE INDEX IF NOT EXISTS idx_comptes_alipay_actif ON comptes_alipay(est_actif);
