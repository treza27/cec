/*
  # Création de la table notes_internes

  ## Résumé
  Création de la table pour les notes internes liées aux demandes d'achat.
  Permet une communication de type "chat" entre les équipes Commerciales
  et Acheteurs sur chaque demande.

  ## Nouvelle Table: `notes_internes`
  - `id` : Identifiant unique auto-incrémenté
  - `demande_achat_id` : Référence vers la demande d'achat parente (obligatoire)
  - `auteur_id` : UUID de l'auteur de la note (auth.users, obligatoire)
  - `message` : Contenu de la note (obligatoire)
  - `created_at` : Date/heure de création automatique

  ## Sécurité
  - RLS activé
  - Lecture: tous les utilisateurs authentifiés peuvent lire les notes
  - Insertion: les utilisateurs authentifiés peuvent créer des notes avec leur propre ID
  - Pas de modification ni suppression (journal immuable)
*/

CREATE TABLE IF NOT EXISTS notes_internes (
  id BIGSERIAL PRIMARY KEY,
  demande_achat_id BIGINT NOT NULL REFERENCES demandes_achat(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes_internes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notes_internes"
  ON notes_internes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create notes_internes"
  ON notes_internes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auteur_id);

CREATE INDEX IF NOT EXISTS idx_notes_internes_demande_id ON notes_internes(demande_achat_id);
CREATE INDEX IF NOT EXISTS idx_notes_internes_created_at ON notes_internes(created_at DESC);
