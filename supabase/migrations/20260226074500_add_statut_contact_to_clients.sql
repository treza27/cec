/*
  # Ajout du champ statut_contact à la table clients

  ## Résumé
  Ajout d'un champ `statut_contact` à la table `clients` existante pour distinguer
  les prospects des clients actifs.

  ## Modifications
  - Table `clients` : ajout de la colonne `statut_contact`
    - Type: TEXT avec contrainte CHECK
    - Valeurs autorisées: "Prospect", "Client"
    - Valeur par défaut: "Prospect"

  ## Notes
  - Tous les clients existants seront automatiquement définis comme "Prospect"
  - La valeur peut être modifiée manuellement ou automatiquement via trigger
    lorsqu'une demande d'achat passe au statut "Payé"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'statut_contact'
  ) THEN
    ALTER TABLE clients
    ADD COLUMN statut_contact TEXT NOT NULL DEFAULT 'Prospect'
    CHECK (statut_contact IN ('Prospect', 'Client'));
  END IF;
END $$;
