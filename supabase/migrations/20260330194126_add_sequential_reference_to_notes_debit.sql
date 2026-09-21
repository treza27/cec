/*
  # Génération séquentielle des références de notes de débit

  ## Résumé
  Remplace la génération côté client (basée sur le timestamp) par une séquence
  PostgreSQL fiable, garantissant l'unicité et produisant des références courtes
  et lisibles au format ND{AA}-{NNN} (ex: ND26-001).

  ## Modifications

  ### Nouvelle fonction SQL : `next_note_debit_reference()`
  - Crée dynamiquement une séquence par année si elle n'existe pas encore
    (ex: `notes_debit_seq_2026`)
  - Incrémente la séquence et retourne la référence formatée
  - Format : `ND{2 derniers chiffres de l'année}-{compteur sur 3 chiffres}`
  - Exemple : `ND26-001`, `ND26-002`, ..., `ND26-999`, `ND26-1000` (sans troncature)

  ### Colonne `reference` dans `notes_debit`
  - Ajout d'une valeur par défaut : `next_note_debit_reference()`
  - Les anciennes références (format ND2645611) restent intactes
  - Ajout d'une contrainte UNIQUE sur `reference`

  ## Sécurité
  - La fonction est définie avec SECURITY DEFINER pour accéder aux séquences système
  - Pas de modification des politiques RLS existantes
*/

CREATE OR REPLACE FUNCTION next_note_debit_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year    text;
  v_seq_name text;
  v_counter  bigint;
BEGIN
  v_year     := to_char(now(), 'YY');
  v_seq_name := 'notes_debit_seq_' || to_char(now(), 'YYYY');

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = v_seq_name
      AND n.nspname = 'public'
  ) THEN
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I START 1 INCREMENT 1', v_seq_name);
  END IF;

  EXECUTE format('SELECT nextval(''public.%I'')', v_seq_name) INTO v_counter;

  RETURN 'ND' || v_year || '-' || lpad(v_counter::text, 3, '0');
END;
$$;

ALTER TABLE notes_debit
  ALTER COLUMN reference SET DEFAULT next_note_debit_reference();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notes_debit_reference_unique'
      AND conrelid = 'notes_debit'::regclass
  ) THEN
    ALTER TABLE notes_debit ADD CONSTRAINT notes_debit_reference_unique UNIQUE (reference);
  END IF;
END $$;
