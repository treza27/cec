import React, { useMemo } from 'react';
import { ShoppingCart, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { DemandeAchat } from '../../../types';
import DashboardKpiCard from './DashboardKpiCard';

interface Props {
  demandes: DemandeAchat[];
}

function formatRmb(value: number): string {
  if (value >= 1_000_000) return `¥${(value / 1_000_000).toFixed(2)} M`;
  if (value >= 1_000) return `¥${(value / 1_000).toFixed(1)} k`;
  return `¥${value.toFixed(0)}`;
}

const STATUT_COLORS: Record<string, string> = {
  'Nouveau': 'bg-gray-100 text-gray-700 border-gray-200',
  "En cours d'analyse": 'bg-blue-50 text-blue-700 border-blue-200',
  'Action requise': 'bg-amber-50 text-amber-700 border-amber-200',
  'Devis Prêt': 'bg-teal-50 text-teal-700 border-teal-200',
  'Rejeté': 'bg-red-50 text-red-600 border-red-200',
  'Payé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Acheté': 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function DashboardAchatsSection({ demandes }: Props) {
  const demandesPaye = useMemo(() => demandes.filter((d) => d.statut === 'Payé' || d.statut === 'Acheté'), [demandes]);
  const demandesDevisPret = useMemo(() => demandes.filter((d) => d.statut === 'Devis Prêt'), [demandes]);
  const demandesEnAttente = useMemo(
    () => demandes.filter((d) => ['Nouveau', "En cours d'analyse", 'Action requise'].includes(d.statut)),
    [demandes]
  );

  const montantTotalPaye = useMemo(() => {
    return demandesPaye.reduce((acc, d) => {
      const articles = (d.achat_articles || []) as { prix_unitaire_rmb?: number; quantite?: number; frais_port_locaux_rmb?: number }[];
      const total = articles.reduce(
        (s, a) => s + (Number(a.prix_unitaire_rmb) || 0) * (Number(a.quantite) || 1) + (Number(a.frais_port_locaux_rmb) || 0),
        0
      );
      return acc + total;
    }, 0);
  }, [demandesPaye]);

  const topClientsParDemandes = useMemo(() => {
    const map: Record<number, { pseudo: string; count: number; montant: number }> = {};
    for (const d of demandes) {
      if (!d.client_id) continue;
      const pseudo = (d.client as { pseudo?: string } | undefined)?.pseudo || `Client #${d.client_id}`;
      if (!map[d.client_id]) map[d.client_id] = { pseudo, count: 0, montant: 0 };
      map[d.client_id].count += 1;
      const articles = (d.achat_articles || []) as { prix_unitaire_rmb?: number; quantite?: number }[];
      map[d.client_id].montant += articles.reduce(
        (s, a) => s + (Number(a.prix_unitaire_rmb) || 0) * (Number(a.quantite) || 1),
        0
      );
    }
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [demandes]);

  const maxCount = topClientsParDemandes[0]?.count || 1;

  const recentDemandes = useMemo(
    () =>
      [...demandes]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 8),
    [demandes]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-rose-600" />
          Achats & Devis
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Demandes totales"
            value={demandes.length}
            subtitle="Toutes periodes"
            icon={ShoppingCart}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          <DashboardKpiCard
            title="Devis payes"
            value={demandesPaye.length}
            subtitle={formatRmb(montantTotalPaye)}
            icon={CheckCircle}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <DashboardKpiCard
            title="Devis en attente"
            value={demandesDevisPret.length}
            subtitle="Devis prets, non payes"
            icon={TrendingUp}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
          />
          <DashboardKpiCard
            title="En cours de traitement"
            value={demandesEnAttente.length}
            subtitle="Nouveau / En analyse / Action requise"
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients par demandes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Top clients par nombre de demandes
          </h3>
          {topClientsParDemandes.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">Aucune demande</p>
          ) : (
            <div className="space-y-3">
              {topClientsParDemandes.map((c, i) => (
                <div key={c.pseudo}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">{c.pseudo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{c.count} demande{c.count > 1 ? 's' : ''}</span>
                      {c.montant > 0 && <span className="text-xs font-bold text-gray-700">{formatRmb(c.montant)}</span>}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-rose-400 h-1.5 rounded-full"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demandes recentes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Demandes recentes
          </h3>
          {recentDemandes.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">Aucune demande</p>
          ) : (
            <div className="space-y-2">
              {recentDemandes.map((d) => {
                const pseudo = (d.client as { pseudo?: string } | undefined)?.pseudo || `Client #${d.client_id}`;
                const date = d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';
                return (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{d.nom_article}</p>
                      <p className="text-xs text-gray-400">{pseudo} · {date}</p>
                    </div>
                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${STATUT_COLORS[d.statut] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {d.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
