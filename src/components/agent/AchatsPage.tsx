import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, Filter, ShoppingCart, ChevronDown, X, Calendar, User, Loader2, Trash2, AlertTriangle, PackageSearch
} from 'lucide-react';
import { useAchats, AchatFilters } from '../../hooks/useAchats';
import { useAllEmployees } from '../../hooks/useEmployeeProfile';
import { StatutDemandeAchat, DemandeAchat } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import AchatStatusBadge from './achat/AchatStatusBadge';
import AchatDetailPanel from './achat/AchatDetailPanel';
import DemandeAchatForm from '../forms/DemandeAchatForm';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { supabase } from '../../utils/supabase';
import { useEffect } from 'react';

const STATUTS: StatutDemandeAchat[] = [
  'Nouveau', 'En cours d\'analyse', 'Action requise', 'Devis Prêt', 'Rejeté', 'Payé', 'Acheté'
];

function EmployeeCell({
  employee,
  emptyLabel,
}: {
  employee?: { full_name: string | null; email: string | null; profile_picture_url: string | null } | null;
  emptyLabel?: string;
}) {
  if (!employee) {
    return <span className="text-gray-400 text-xs italic">{emptyLabel ?? '-'}</span>;
  }
  const name = employee.full_name || employee.email || '-';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
        {employee.profile_picture_url ? (
          <img
            src={employee.profile_picture_url}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold text-blue-600">{initials}</span>
        )}
      </div>
      <span className="text-xs text-gray-700 font-medium leading-tight truncate max-w-[110px]">{name}</span>
    </div>
  );
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export default function AchatsPage() {
  const { profileData } = useEmployeeProfile();
  const { data: employees = [] } = useAllEmployees();
  const isAdmin = profileData?.role === 'administrateur';
  const canDelete = profileData?.role === 'administrateur' || profileData?.role === 'commercial';

  const [filters, setFilters] = useState<AchatFilters>({});
  const [serverPage, setServerPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trackingManquant, setTrackingManquant] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { demandes, total, totalPages, pageSize, statsCounts, loading, error, refreshAchats, deleteDemande, isDeleting } = useAchats(filters, serverPage);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id || null));
  }, []);

  const filteredDemandes = useMemo(() => {
    let result = demandes;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(d =>
        d.nom_article.toLowerCase().includes(q) ||
        d.client?.pseudo?.toLowerCase().includes(q) ||
        d.client?.prenom?.toLowerCase().includes(q) ||
        d.client?.nom?.toLowerCase().includes(q) ||
        d.client?.entreprise?.toLowerCase().includes(q) ||
        String(d.id).includes(q)
      );
    }
    if (trackingManquant) {
      result = result.filter(d => {
        const articles = d.achat_articles ?? [];
        if (articles.length === 0) return true;
        return articles.some(a => !a.tracking || a.tracking.trim() === '');
      });
    }
    return result;
  }, [demandes, debouncedSearch, trackingManquant]);

  const trackingManquantCount = useMemo(() => {
    return filteredDemandes
      .filter(d => d.statut === 'Acheté')
      .filter(d => {
        const articles = d.achat_articles ?? [];
        if (articles.length === 0) return true;
        return articles.some(a => !a.tracking || a.tracking.trim() === '');
      }).length;
  }, [filteredDemandes]);

  const handleFilterChange = useCallback((key: keyof AchatFilters, value: string) => {
    setServerPage(1);
    setFilters(f => {
      const updated = { ...f, [key]: value || undefined };
      if (key === 'statut' && value !== 'Acheté') {
        setTrackingManquant(false);
      }
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setTrackingManquant(false);
    setServerPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  const handleCreationSuccess = useCallback(() => {
    setIsCreating(false);
    refreshAchats();
  }, [refreshAchats]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, demande: DemandeAchat) => {
    e.stopPropagation();
    setDeleteConfirmId(demande.id);
    setDeleteConfirmName(demande.nom_article);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirmId == null) return;
    await deleteDemande(deleteConfirmId);
    if (selectedDemandeId === deleteConfirmId) setSelectedDemandeId(null);
    setDeleteConfirmId(null);
  }, [deleteConfirmId, deleteDemande, selectedDemandeId]);

  if (loading && demandes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des demandes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button onClick={() => refreshAchats()} className="mt-2 text-red-700 underline hover:text-red-900 text-sm">
          Réessayer
        </button>
      </div>
    );
  }

  const startIndex = (serverPage - 1) * pageSize + 1;
  const endIndex = Math.min(serverPage * pageSize, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Gestion des Achats
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} demande{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Demande
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUTS.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange('statut', filters.statut === s ? '' : s)}
            className={`p-3 rounded-xl border text-center transition-all ${
              filters.statut === s
                ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <p className={`text-xl font-bold ${filters.statut === s ? 'text-white' : 'text-gray-900'}`}>
              {statsCounts[s] || 0}
            </p>
            <p className={`text-xs mt-0.5 leading-tight ${filters.statut === s ? 'text-blue-100' : 'text-gray-500'}`}>
              {s}
            </p>
          </button>
        ))}
      </div>

      {/* Sous-filtre tracking manquant (visible uniquement quand statut = Acheté) */}
      {filters.statut === 'Acheté' && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTrackingManquant(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              trackingManquant
                ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                : 'bg-white border-orange-300 text-orange-700 hover:bg-orange-50'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            Tracking manquant
            {trackingManquantCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                trackingManquant ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-700'
              }`}>
                {trackingManquantCount}
              </span>
            )}
          </button>
          {trackingManquant && (
            <p className="text-xs text-orange-600 italic">
              {filteredDemandes.length} commande{filteredDemandes.length !== 1 ? 's' : ''} avec tracking incomplet
            </p>
          )}
        </div>
      )}

      {/* Formulaire création */}
      {isCreating && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
          <DemandeAchatForm onSuccess={handleCreationSuccess} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par article, client, pseudo..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || Object.keys(filters).length > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {Object.keys(filters).filter(k => filters[k as keyof AchatFilters]).length > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {Object.keys(filters).filter(k => filters[k as keyof AchatFilters]).length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Effacer
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            {/* Filtre statut */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select
                value={filters.statut ?? ''}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Filtre Commerciale */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Commerciale
              </label>
              <select
                value={filters.cree_par_id ?? ''}
                onChange={(e) => handleFilterChange('cree_par_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les commerciales</option>
                {employees.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.full_name || emp.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Acheteur */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Acheteur assigné
              </label>
              <select
                value={filters.assigne_a_id ?? ''}
                onChange={(e) => handleFilterChange('assigne_a_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les acheteurs</option>
                {employees.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.full_name || emp.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtres dates */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Période
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.date_from ?? ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={filters.date_to ?? ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Au"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compteur */}
      {total > 0 && (
        <p className="text-sm text-gray-500">
          Affichage de {startIndex} à {endIndex} sur {total} demande{total > 1 ? 's' : ''}
          {(debouncedSearch || trackingManquant) && filteredDemandes.length < demandes.length && (
            <span className="ml-1 text-blue-600">({filteredDemandes.length} sur cette page)</span>
          )}
        </p>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N°</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Article</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Nb art.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Qté</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prix final (Ar)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Commerciale</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acheteur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                {canDelete && <th className="px-2 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDemandes.map((demande, index) => {
                const taux = demande.taux_change_vendu;
                const articles = demande.achat_articles ?? [];
                const sousTotalArticles = taux != null && articles.length > 0
                  ? articles.reduce((sum, a) => {
                      const p = Number(a.prix_unitaire_rmb ?? 0);
                      const q = Number(a.quantite) || 1;
                      return sum + p * q * Number(taux);
                    }, 0)
                  : null;
                const fraisPortAr = taux != null && demande.frais_port_locaux_rmb != null
                  ? Number(demande.frais_port_locaux_rmb) * Number(taux)
                  : 0;
                const prixFinalArticles = sousTotalArticles != null && sousTotalArticles > 0
                  ? sousTotalArticles + fraisPortAr
                  : null;
                const prixFinalLegacy = demande.prix_unitaire_rmb != null && taux != null
                  ? Math.round((Number(demande.prix_unitaire_rmb) * Number(taux)) + fraisPortAr)
                  : null;
                const prixFinal = prixFinalArticles != null && prixFinalArticles > 0
                  ? Math.round(prixFinalArticles)
                  : prixFinalLegacy;

                return (
                  <tr
                    key={demande.id}
                    onClick={() => setSelectedDemandeId(demande.id)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">#{demande.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {demande.photo_url ? (
                          <img
                            src={demande.photo_url}
                            alt={demande.nom_article}
                            loading="lazy"
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                          {demande.nom_article}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {demande.client?.prenom} {demande.client?.nom || ''}
                        </p>
                        <p className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {demande.client?.pseudo}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <AchatStatusBadge statut={demande.statut} size="sm" />
                        {demande.statut === 'Acheté' && (() => {
                          const arts = demande.achat_articles ?? [];
                          const hasManquant = arts.length === 0 || arts.some(a => !a.tracking || a.tracking.trim() === '');
                          return hasManquant ? (
                            <span title="Tracking manquant" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 flex-shrink-0">
                              <PackageSearch className="w-2.5 h-2.5 text-orange-600" />
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                      {articles.length > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {articles.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                      {articles.length > 0
                        ? articles.reduce((sum, a) => sum + (Number(a.quantite) || 0), 0)
                        : demande.quantite}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {prixFinal !== null ? (
                        <span className="font-semibold text-green-700">
                          {prixFinal.toLocaleString('fr-FR')} Ar
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">En attente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EmployeeCell employee={demande.cree_par} />
                    </td>
                    <td className="px-4 py-3">
                      <EmployeeCell employee={demande.assigne_a} emptyLabel="Non assigné" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateShort(demande.date_creation)}
                    </td>
                    {canDelete && (
                      <td className="px-2 py-3">
                        <button
                          onClick={(e) => handleDeleteClick(e, demande)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer la demande"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDemandes.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-1">
              {hasActiveFilters ? 'Aucune demande trouvée' : 'Aucune demande d\'achat'}
            </p>
            <p className="text-sm text-gray-400">
              {hasActiveFilters
                ? 'Modifiez vos filtres ou effacez-les pour voir toutes les demandes.'
                : 'Créez votre première demande d\'achat en cliquant sur "Nouvelle Demande".'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination serveur */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <button
            onClick={() => setServerPage(p => Math.max(1, p - 1))}
            disabled={serverPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (page === 1 || page === totalPages || (page >= serverPage - 1 && page <= serverPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setServerPage(page)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      serverPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === serverPage - 2 || page === serverPage + 2) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setServerPage(p => Math.min(totalPages, p + 1))}
            disabled={serverPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Panneau de détail */}
      {selectedDemandeId && (
        <AchatDetailPanel
          demandeId={selectedDemandeId}
          onClose={() => setSelectedDemandeId(null)}
          currentUserId={currentUserId}
          onUpdated={refreshAchats}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Supprimer la demande</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Voulez-vous supprimer la demande <span className="font-semibold text-gray-900">#{deleteConfirmId} — {deleteConfirmName}</span> ?
              Tous les articles et données associés seront perdus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
