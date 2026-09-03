/*
  # Création de la table mouvements_alipay

  ## Description
  Enregistre tous les mouvements du portefeuille Alipay RMB d'un responsable :
  - Approvisionnements (crédits en RMB) : depuis une caisse MGA via achat_rmb,
    ou depuis un versement extérieur manuel
  - Achats fournisseurs (débits en RMB) : paiement d'un fournisseur chinois,
    optionnellement lié à une demande d'achat (devis)

  ## Colonnes
  - `id` : identifiant auto-incrémenté
  - `compte_alipay_id` : FK vers comptes_alipay
  - `type_mouvement` : enum CHECK — approvisionnement | achat_fournisseur | autre_entree | autre_sortie
  - `sens` : entree | sortie
  - `montant_rmb` : montant en RMB
  - `taux_rmb_mga` : taux utilisé si l'approvisionnement vient d'une caisse (optionnel)
  - `caisse_mouvement_id` : lien vers mouvements_caisse.id si appro depuis caisse (nullable)
  - `demande_achat_id` : lien optionnel vers demandes_achat (devis lié à l'achat)
  - `tiers_nom` : nom libre du fournisseur / tiers (si pas de devis lié)
  - `description` : texte libre
  - `reference_externe` : référence externe optionnelle
  - `date_mouvement` : date du mouvement
  - `saisie_par_id` : employé qui a saisi
  - `est_annule`, `annule_par_id`, `annule_at`, `motif_annulation` : annulation

  ## Sécurité
  - RLS activé
  - Lecture : tous les agents authentifiés
  - Insert : tous les agents authentifiés
  - Update (annulation) : admins uniquement
*/

CREATE TABLE IF NOT EXISTS mouvements_alipay (
  id                   bigserial PRIMARY KEY,
  compte_alipay_id     bigint NOT NULL REFERENCES comptes_alipay(id) ON DELETE RESTRICT,
  type_mouvement       text NOT NULL CHECK (type_mouvement IN ('approvisionnement', 'achat_fournisseur', 'autre_entree', 'autre_sortie')),
  sens                 text NOT NULL CHECK (sens IN ('entree', 'sortie')),
  montant_rmb          numeric(14, 4) NOT NULL CHECK (montant_rmb > 0),
  taux_rmb_mga         numeric(14, 2),
  caisse_mouvement_id  bigint REFERENCES mouvements_caisse(id) ON DELETE SET NULL,
  demande_achat_id     bigint REFERENCES demandes_achat(id) ON DELETE SET NULL,
  tiers_nom            text,
  description          text NOT NULL DEFAULT '',
  reference_externe    text,
  date_mouvement       date NOT NULL DEFAULT CURRENT_DATE,
  saisie_par_id        uuid NOT NULL REFERENCES employees(user_id) ON DELETE RESTRICT,
  est_annule           boolean NOT NULL DEFAULT false,
  annule_par_id        uuid REFERENCES employees(user_id) ON DELETE SET NULL,
  annule_at            timestamptz,
  motif_annulation     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mouvements_alipay ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view mouvements alipay"
  ON mouvements_alipay FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can insert mouvements alipay"
  ON mouvements_alipay FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = saisie_par_id);

CREATE POLICY "Admins can update mouvements alipay"
  ON mouvements_alipay FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_mouvements_alipay_compte ON mouvements_alipay(compte_alipay_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_alipay_date ON mouvements_alipay(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_alipay_caisse_mouvement ON mouvements_alipay(caisse_mouvement_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_alipay_demande_achat ON mouvements_alipay(demande_achat_id);
