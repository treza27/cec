import React, { useState } from 'react';
import { LayoutDashboard, RefreshCw, TrendingUp, Ship, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import DashboardFinanceSection from './DashboardFinanceSection';
import DashboardLogistiqueSection from './DashboardLogistiqueSection';
import DashboardAchatsSection from './DashboardAchatsSection';

type Tab = 'finance' | 'logistique' | 'achats';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'finance', label: 'Finance', icon: TrendingUp },
  { id: 'logistique', label: 'Logistique & Volumes', icon: Ship },
  { id: 'achats', label: 'Achats & Devis', icon: ShoppingCart },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('finance');
  const { stats, loading, error, refetch } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-xs text-gray-400">Vue d'ensemble de votre activite</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Erreur de chargement</p>
            <p className="text-xs text-red-600">{error.message}</p>
          </div>
        </div>
      )}

      {loading && !stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse h-48" />
        </div>
      ) : stats ? (
        <>
          {/* Alertes operationnelles */}
          <OperationalAlerts stats={stats} />

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'finance' && (
            <DashboardFinanceSection
              notesDebit={stats.notesDebit}
              demandes={stats.demandes}
            />
          )}
          {activeTab === 'logistique' && (
            <DashboardLogistiqueSection
              departures={stats.departures}
              clientVolumes={stats.clientVolumes}
              notesDebit={stats.notesDebit}
              bonsLivraison={stats.bonsLivraison}
              inventoryStats={stats.inventoryStats}
            />
          )}
          {activeTab === 'achats' && (
            <DashboardAchatsSection demandes={stats.demandes} />
          )}
        </>
      ) : null}
    </div>
  );
}

interface AlertsProps {
  stats: NonNullable<ReturnType<typeof useDashboardStats>['stats']>;
}

function OperationalAlerts({ stats }: AlertsProps) {
  const alerts: { message: string; color: string }[] = [];

  const demandesActionRequise = stats.demandes.filter((d) => d.statut === 'Action requise').length;
  if (demandesActionRequise > 0) {
    alerts.push({
      message: `${demandesActionRequise} demande${demandesActionRequise > 1 ? 's' : ''} d'achat necessitent une action`,
      color: 'border-l-amber-400 bg-amber-50',
    });
  }

  const demandesDevisPret = stats.demandes.filter((d) => d.statut === 'Devis Prêt').length;
  if (demandesDevisPret > 0) {
    alerts.push({
      message: `${demandesDevisPret} devis en attente de paiement client`,
      color: 'border-l-teal-400 bg-teal-50',
    });
  }

  const colisEnCours = stats.inventoryStats.enCours;
  if (colisEnCours > 0) {
    alerts.push({
      message: `${colisEnCours} colis en cours de livraison`,
      color: 'border-l-blue-400 bg-blue-50',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Alertes operationnelles</h3>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border-l-4 ${a.color}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <p className="text-xs text-gray-700">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
