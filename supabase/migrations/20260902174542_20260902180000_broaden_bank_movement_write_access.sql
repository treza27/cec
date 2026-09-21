/*
# Fix: autoriser tout agent authentifié à écrire dans les mouvements bancaires

## Problème
La politique ajoutée précédemment ne couvrait que les types
`versement_caisse` et `remise_cheque`. D'autres types de mouvements
créés depuis l'application (ex: `virement_entrant` lors d'un virement
depuis la caisse) sont toujours bloqués pour les rôles non-admin
comme `acheteur`.

L'application contrôle déjà quelles opérations sont disponibles dans
l'interface selon le rôle de l'agent. La couche RLS ne doit pas être
plus restrictive que l'application elle-même.

## Solution
1. Remplacer la politique INSERT limitée à versement_caisse/remise_cheque
   par une politique qui permet à tout agent authentifié d'insérer
   n'importe quel type de mouvement bancaire, à condition que
   `saisie_par_id = auth.uid()` (l'agent ne peut créer qu'en son nom).

2. La politique SELECT "Agents can view their own created movements"
   reste en place pour que l'agent voie les mouvements qu'il a créés.
*/

-- 1. Remplacer la politique INSERT par une version sans restriction de type
DROP POLICY IF EXISTS "All agents can insert versement_caisse movements" ON mouvements_bancaires;
DROP POLICY IF EXISTS "All authenticated agents can insert bank movements" ON mouvements_bancaires;
CREATE POLICY "All authenticated agents can insert bank movements"
ON mouvements_bancaires FOR INSERT
TO authenticated
WITH CHECK (saisie_par_id = auth.uid());

-- 2. Permettre aux agents de voir les mouvements qu'ils ont créés (déjà existant, recréé par sécurité)
DROP POLICY IF EXISTS "Agents can view their own created movements" ON mouvements_bancaires;
CREATE POLICY "Agents can view their own created movements"
ON mouvements_bancaires FOR SELECT
TO authenticated
USING (saisie_par_id = auth.uid());
