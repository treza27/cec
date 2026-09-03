/*
# Backfill missing cheque tracking records

## Summary
Several cash movements were recorded with mode_paiement = 'cheque' but no
corresponding row was ever created in the `cheques` tracking table. This
affects 4 entry movements (cheques received from clients / third parties)
that should appear in the cheque tracking tab but currently don't.

This migration inserts the missing cheque records, using:
- The note de débit reference + client pseudo for the two August payments
- The tiers_nom and description for the older entries
- A placeholder cheque number "A COMPLETER" since the original numbers were lost
- statut = 'en_attente' (none of these entries were deposited as a cheque —
  movement 15 had a bank movement but it's a transfert_interne sortie, not a
  received cheque, so it is excluded entirely)

## Affected rows
- mc.id 78: paiement_note_debit, 10 098 000 Ar, ND26-312, Nazir
- mc.id 76: paiement_note_debit, 26 235 352 Ar, ND26-314, Royal
- mc.id 30: autre_entree, 2 000 000 Ar, MPL
- mc.id 14: autre_entree, 1 000 000 Ar, "Test chèque"

## Not affected (excluded)
- mc.id 15: transfert_interne sortie — outgoing, not a received cheque
- mc.id 13: frais_annexe sortie — outgoing cheque we wrote, not received

## Security
No policy changes. The new rows are inserted directly by the migration.
*/

INSERT INTO cheques (
  numero_cheque,
  montant_mga,
  payeur,
  date_reception,
  date_echeance,
  statut,
  description,
  note_debit_id,
  mouvement_caisse_id,
  saisie_par_id,
  created_at,
  updated_at
)
SELECT
  'A COMPLETER',
  mc.montant_mga,
  COALESCE(
    NULLIF(mc.tiers_nom, ''),
    nd.client_pseudo,
    nd.client_nom,
    'N/A'
  ),
  mc.date_mouvement,
  mc.date_mouvement,
  'en_attente',
  COALESCE(
    NULLIF(mc.description, ''),
    'Chèque encaissé (créé par backfill)'
  ),
  mc.note_debit_id,
  mc.id,
  mc.saisie_par_id,
  mc.created_at,
  now()
FROM mouvements_caisse mc
LEFT JOIN notes_debit nd ON nd.id = mc.note_debit_id
WHERE mc.mode_paiement = 'cheque'
  AND mc.est_annule = false
  AND mc.sens = 'entree'
  AND NOT EXISTS (
    SELECT 1 FROM cheques c WHERE c.mouvement_caisse_id = mc.id
  )
  AND mc.id IN (78, 76, 30, 14);
