import React, { useMemo } from 'react';
import { Banknote, TrendingUp, Package2, Receipt, ArrowUpRight } from 'lucide-react';
import { NoteDebit } from '../../../services/noteDebitService';
import { DemandeAchat } from '../../../types';
import DashboardKpiCard from './DashboardKpiCard';

interface Props {
  notesDebit: NoteDebit[];
  demandes: DemandeAchat[];
}

function formatAriary(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Mrd Ar`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M Ar`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} k Ar`;
  return `${value.toFixed(0)} Ar`;
}


export default function DashboardFinanceSection({ notesDebit, demandes }: Props) {
  const totalCA = useMemo(
    () => notesDebit.reduce((acc, n) => acc + (n.montant_total_ariary || 0) + (n.frais_livraison_ariary || 0), 0),
    [notesDebit]
  );

  const montantTransportOnly = useMemo(
    () => notesDebit.reduce((acc, n) => acc + (n.montant_total_ariary || 0), 0),
    [notesDebit]
  );

  const demandesPaye = useMemo(
    () => demandes.filter((d) => d.statut === 'Payé' || d.statut === 'Acheté'),
    [demandes]
  );

  const { montantAchatsPayeAriary, margeDevise } = useMemo(() => {
    let totalAriary = 0;
    let totalMarge = 0;
    for (const d of demandesPaye) {
      const articles = (d.achat_articles || []) as { prix_unitaire_rmb?: number; quantite?: number; frais_port_locaux_rmb?: number }[];
      const totalRmb = articles.reduce(
        (s, a) => s + (Number(a.prix_unitaire_rmb) || 0) * (Number(a.quantite) || 1) + (Number(a.frais_port_locaux_rmb) || 0),
        0
      );
      const tauxVendu = Number(d.taux_change_vendu) || 0;
      const tauxAchete = Number(d.taux_change_achete) || 0;
      totalAriary += totalRmb * tauxVendu;
      totalMarge += totalRmb * (tauxVendu - tauxAchete);
    }
    return { montantAchatsPayeAriary: totalAriary, margeDevise: totalMarge };
  }, [demandesPaye]);

  const demandesParStatut = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of demandes) {
      map[d.statut] = (map[d.statut] || 0) + 1;
    }
    return map;
  }, [demandes]);

  const tauxConversionDevis = useMemo(() => {
    const pret = (demandesParStatut['Devis Prêt'] || 0) + (demandesParStatut['Payé'] || 0) + (demandesParStatut['Acheté'] || 0);
    const total = demandes.length;
    if (!total) return 0;
    return Math.round((pret / total) * 100);
  }, [demandesParStatut, demandes.length]);

  const statutColors: Record<string, string> = {
    'Nouveau': 'bg-gray-100 text-gray-700',
    "En cours d'analyse": 'bg-blue-100 text-blue-700',
    'Action requise': 'bg-amber-100 text-amber-700',
    'Devis Prêt': 'bg-teal-100 text-teal-700',
    'Rejeté': 'bg-red-100 text-red-700',
    'Payé': 'bg-emerald-100 text-emerald-700',
    'Acheté': 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" />
          Vue Financiere
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Chiffre d'affaires total"
            value={formatAriary(totalCA)}
            subtitle={`${notesDebit.length} note${notesDebit.length > 1 ? 's' : ''} de debit`}
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <DashboardKpiCard
            title="Transport (CBM)"
            value={formatAriary(montantTransportOnly)}
            subtitle="Hors frais de livraison"
            icon={Banknote}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <DashboardKpiCard
            title="Marge devise"
            value={formatAriary(margeDevise)}
            subtitle="Taux achat vs vente (achats payes)"
            icon={ArrowUpRight}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <DashboardKpiCard
            title="Achats payes (Ar)"
            value={formatAriary(montantAchatsPayeAriary)}
            subtitle={`${demandesPaye.length} demande${demandesPaye.length > 1 ? 's' : ''} payee${demandesPaye.length > 1 ? 's' : ''}`}
            icon={Package2}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-500" />
          Repartition des demandes d'achat par statut
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {['Nouveau', "En cours d'analyse", 'Action requise', 'Devis Prêt', 'Rejeté', 'Payé', 'Acheté'].map((statut) => (
            <div key={statut} className="text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold mb-1 ${statutColors[statut] || 'bg-gray-100 text-gray-700'}`}>
                {demandesParStatut[statut] || 0}
              </div>
              <p className="text-xs text-gray-500 leading-tight">{statut}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${tauxConversionDevis}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
            {tauxConversionDevis}% de devis aboutis
          </span>
        </div>
      </div>
    </div>
  );
}
