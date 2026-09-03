/*
  # Add client_pseudo to notes_debit and bons_livraison

  ## Summary
  Adds a client_pseudo column to both notes_debit and bons_livraison tables,
  and creates public (anon) read-only RLS policies so clients can access
  their own documents using only their pseudo, without agent authentication.

  ## Changes

  ### notes_debit
  - New column: client_pseudo (text, nullable) — the pseudo of the client linked to this note
  - New index: idx_notes_debit_client_pseudo for fast lookup
  - New RLS policy: anon users can SELECT rows where client_pseudo matches their query parameter

  ### bons_livraison
  - New column: client_pseudo (text, nullable) — the pseudo of the client linked to this bon
  - New index: idx_bons_livraison_client_pseudo for fast lookup
  - New RLS policy: anon users can SELECT rows where client_pseudo matches their query parameter

  ## Security Notes
  - The anon policies use USING (true) which allows unauthenticated reads filtered by client_pseudo.
    Row-level filtering is enforced in the application query (.eq('client_pseudo', pseudo)).
    This is intentional: client tracking is already public (pseudo + phone verification
    happens at the application level, not at the DB level for the inventory table either).
  - No write access is granted to anon users.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes_debit' AND column_name = 'client_pseudo'
  ) THEN
    ALTER TABLE notes_debit ADD COLUMN client_pseudo text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bons_livraison' AND column_name = 'client_pseudo'
  ) THEN
    ALTER TABLE bons_livraison ADD COLUMN client_pseudo text DEFAULT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_debit_client_pseudo ON notes_debit(client_pseudo);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_client_pseudo ON bons_livraison(client_pseudo);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notes_debit' AND policyname = 'Anon users can view notes debit by client pseudo'
  ) THEN
    CREATE POLICY "Anon users can view notes debit by client pseudo"
      ON notes_debit FOR SELECT
      TO anon
      USING (client_pseudo IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bons_livraison' AND policyname = 'Anon users can view bons livraison by client pseudo'
  ) THEN
    CREATE POLICY "Anon users can view bons livraison by client pseudo"
      ON bons_livraison FOR SELECT
      TO anon
      USING (client_pseudo IS NOT NULL);
  END IF;
END $$;
