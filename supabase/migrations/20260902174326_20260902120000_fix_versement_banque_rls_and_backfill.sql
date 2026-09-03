/*
# Fix: versement en banque non visible côté banque (RLS trop restrictif)

## Problème
Quand un agent fait un "transfert interne vers banque" depuis la caisse,
deux opérations doivent se faire:
1. Création d'un mouvement de caisse (sortie) — réussit
2. Création d'un mouvement bancaire (entrée) — BLOQUÉ par RLS

Les politiques RLS sur `mouvements_bancaires` n'autorisent l'INSERT que pour:
- administrateur
- tresorier
- caissier (uniquement pour versement_caisse et remise_cheque)
- responsable du compte bancaire

Un agent avec le rôle `acheteur` (ex: Nirina) ne correspond à AUCUN de ces
rôles. Le mouvement bancaire est donc silencieusement rejeté par RLS.

De plus, le compte T52 n'a pas de responsable assigné, donc la politique
"responsable" ne s'applique pas non plus.

## Solution
1. Ajouter une politique INSERT qui permet à TOUT agent authentifié de
   créer un mouvement bancaire de type `versement_caisse` ou `remise_cheque`
   (les types de dépôt depuis la caisse), à condition que `saisie_par_id`
   soit son propre ID utilisateur. Cela élargit la politique existante
   "Caissiers can insert" pour inclure tous les rôles, pas seulement caissier.

2. Ajouter une politique SELECT pour que tout agent authentifié puisse voir
   les mouvements bancaires des comptes qu'il peut consulter (nécessaire
   pour que l'agent qui fait le versement puisse le voir apparaître).

3. Corriger le mouvement manquant: Nirina a fait un versement de 20M Ar
   vers T52 (mouvement de caisse #224) mais le mouvement bancaire n'a jamais
   été créé. On l'insère manuellement avec les mêmes données.

## Sécurité
- La nouvelle politique INSERT limite les types à versement_caisse et
  remise_cheque (dépôts entrants depuis la caisse), pas de virement sortant.
- `saisie_par_id = auth.uid()` garantit que l'agent ne peut créer des
  mouvements qu'en son propre nom.
- La nouvelle politique SELECT permet aux agents de voir les mouvements
  qu'ils ont créés (saisie_par_id = auth.uid()).
*/

-- 1. Élargir la politique INSERT pour versement_caisse / remise_cheque à tous les agents
DROP POLICY IF EXISTS "All agents can insert versement_caisse movements" ON mouvements_bancaires;
CREATE POLICY "All agents can insert versement_caisse movements"
ON mouvements_bancaires FOR INSERT
TO authenticated
WITH CHECK (
  saisie_par_id = auth.uid()
  AND type_mouvement IN ('versement_caisse', 'remise_cheque')
);

-- 2. Permettre aux agents de voir les mouvements qu'ils ont créés
DROP POLICY IF EXISTS "Agents can view their own created movements" ON mouvements_bancaires;
CREATE POLICY "Agents can view their own created movements"
ON mouvements_bancaires FOR SELECT
TO authenticated
USING (saisie_par_id = auth.uid());

-- 3. Backfill: créer le mouvement bancaire manquant pour le versement de Nirina
--    Caisse movement #224: 20M Ar vers T52 (compte_bancaire_id=9), 2026-08-31
INSERT INTO mouvements_bancaires (
  compte_bancaire_id,
  type_mouvement,
  sens,
  montant,
  mode_paiement,
  description,
  date_mouvement,
  mouvement_caisse_id,
  saisie_par_id,
  est_annule
)
SELECT
  9,
  'versement_caisse',
  'entree',
  20000000,
  'depot_especes',
  'Versement vers compte transit 52',
  '2026-08-31',
  224,
  saisie_par_id,
  false
FROM mouvements_caisse
WHERE id = 224
AND NOT EXISTS (
  SELECT 1 FROM mouvements_bancaires mb
  WHERE mb.mouvement_caisse_id = 224
);
