/*
# Create cheques table for cheque tracking in accounting

## Summary
Creates a dedicated table to track individual cheques received by the company —
from reception through to bank deposit or cancellation. Each cheque is tracked
individually with its number, amount, payer, due date (échéance), and status.
A cheque can be linked to a note de débit (paiement_note_debit) or come from
other sources. A single cheque number can appear on multiple rows when it
covers several notes de débit (one row per note de débit, same numero_cheque).

## New Tables

### `cheques`
- `id` (bigint, PK, auto-increment)
- `numero_cheque` (text, NOT NULL) — cheque number, not unique (same number can cover multiple notes)
- `montant_mga` (numeric, NOT NULL) — cheque amount in Ariary
- `payeur` (text, NOT NULL) — payer name (client or third party)
- `date_reception` (date, NOT NULL) — date the cheque was received
- `date_echeance` (date, NOT NULL) — date the cheque can be deposited
- `statut` (text, NOT NULL, default 'en_attente') — 'en_attente' | 'verse' | 'annule'
- `description` (text, nullable) — optional notes
- `note_debit_id` (bigint, FK to notes_debit, nullable) — linked note de débit
- `mouvement_caisse_id` (bigint, FK to mouvements_caisse, nullable) — linked cash movement (reception)
- `mouvement_bancaire_id` (bigint, FK to mouvements_bancaires, nullable) — linked bank movement (deposit)
- `compte_bancaire_id` (bigint, FK to comptes_bancaires, nullable) — bank account where cheque was deposited
- `date_versement` (date, nullable) — date the cheque was deposited
- `motif_annulation` (text, nullable) — reason for cancellation
- `saisie_par_id` (uuid, FK to auth.users) — who created the cheque record
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- RLS enabled on `cheques`
- SELECT: all authenticated users can read
- INSERT: all authenticated users can create (cheque received as payment)
- UPDATE: only 'administrateur' and 'tresorier' roles can change statut / deposit
- DELETE: only 'administrateur' role can delete

## Indexes
- `idx_cheques_statut` on `statut` for filtering by status
- `idx_cheques_numero` on `numero_cheque` for searching by cheque number
*/

CREATE TABLE IF NOT EXISTS cheques (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_cheque text NOT NULL,
  montant_mga numeric NOT NULL CHECK (montant_mga > 0),
  payeur text NOT NULL,
  date_reception date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance date NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'verse', 'annule')),
  description text,
  note_debit_id bigint REFERENCES notes_debit(id) ON DELETE SET NULL,
  mouvement_caisse_id bigint REFERENCES mouvements_caisse(id) ON DELETE SET NULL,
  mouvement_bancaire_id bigint REFERENCES mouvements_bancaires(id) ON DELETE SET NULL,
  compte_bancaire_id bigint REFERENCES comptes_bancaires(id) ON DELETE SET NULL,
  date_versement date,
  motif_annulation text,
  saisie_par_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can read
DROP POLICY IF EXISTS "select_cheques" ON cheques;
CREATE POLICY "select_cheques"
  ON cheques FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: all authenticated users can create a cheque record
DROP POLICY IF EXISTS "insert_cheques" ON cheques;
CREATE POLICY "insert_cheques"
  ON cheques FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: only administrateur and tresorier can modify (change statut, deposit, etc.)
DROP POLICY IF EXISTS "update_cheques" ON cheques;
CREATE POLICY "update_cheques"
  ON cheques FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role IN ('administrateur', 'tresorier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role IN ('administrateur', 'tresorier')
    )
  );

-- DELETE: only administrateur can delete
DROP POLICY IF EXISTS "delete_cheques" ON cheques;
CREATE POLICY "delete_cheques"
  ON cheques FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'administrateur'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cheques_statut ON cheques(statut);
CREATE INDEX IF NOT EXISTS idx_cheques_numero ON cheques(numero_cheque);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_cheques_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cheques_updated_at ON cheques;
CREATE TRIGGER trg_cheques_updated_at
  BEFORE UPDATE ON cheques
  FOR EACH ROW
  EXECUTE FUNCTION update_cheques_updated_at();
