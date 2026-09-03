import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useRapportMensuel } from '../../../hooks/useComptabilite';

const TYPE_LABELS: Record<string, string> = {
  entree_client: 'Encaissements clients',
  paiement_note_debit: 'Paiements notes de débit',
  achat_rmb: 'Achats RMB',
  frais_annexe: 'Frais annexes',
  loyer: 'Loyer',
  achat_materiel: 'Achats matériel',
  salaire: 'Salaires',
  avance_salaire: 'Avances salaires',
  transfert_interne: 'Transferts internes',
  autre_entree: 'Autres entrées',
  autre_sortie: 'Autres sorties',
};

function formatMga(n: number) {
  return n.toLocaleString('fr-MG') + ' Ar';
}

interface RapportMensuelViewProps {
  caisseId: number;
  annee: number;
  mois: number;
}

export default function RapportMensuelView({ caisseId, annee, mois }: RapportMensuelViewProps) {
  const { data, isLoading } = useRapportMensuel(caisseId, annee, mois);

  const MOIS_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const entrees = Object.entries(data.parType)
    .filter(([k]) => ['entree_client', 'paiement_note_debit', 'interets', 'autre_entree'].includes(k))
    .filter(([, v]) => v > 0);

  const sorties = Object.entries(data.parType)
    .filter(([k]) => !['entree_client', 'paiement_note_debit', 'interets', 'autre_entree'].includes(k))
    .filter(([, v]) => v > 0);

  const solde = data.totalEntrees - data.totalSorties;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">
        Rapport — {MOIS_LABELS[mois - 1]} {annee}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Entrées</span>
          </div>
          <p className="text-lg font-bold text-green-700">{formatMga(data.totalEntrees)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Sorties</span>
          </div>
          <p className="text-lg font-bold text-red-700">{formatMga(data.totalSorties)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${solde >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className="text-xs font-medium text-gray-600 mb-1">Solde net du mois</p>
          <p className={`text-lg font-bold ${solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {solde >= 0 ? '+' : ''}{formatMga(solde)}
          </p>
        </div>
      </div>

      {data.mouvements.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucun mouvement ce mois-ci.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {entrees.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">Détail des entrées</h4>
              <div className="space-y-1.5">
                {entrees.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{TYPE_LABELS[k] ?? k}</span>
                    <span className="font-medium text-green-700">{formatMga(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sorties.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Détail des sorties</h4>
              <div className="space-y-1.5">
                {sorties.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{TYPE_LABELS[k] ?? k}</span>
                    <span className="font-medium text-red-700">{formatMga(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
