import React, { useState, memo, useCallback, useMemo } from 'react';
import { Search, Plus, CreditCard as Edit, Trash2, User, Save, X, Tag, ChevronUp, ChevronDown, ChevronsUpDown, Award } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';
import ClientForm from '../forms/ClientForm';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import ShippingMarksModal from './ShippingMarksModal';
type SortField = 'nom' | 'prenom' | 'entreprise';
type SortDirection = 'asc' | 'desc';
type StatutFilter = 'all' | 'Prospect' | 'Client Argent' | 'Client Or' | 'Client Platine';
type StatutContact = 'Prospect' | 'Client Argent' | 'Client Or' | 'Client Platine';

const STATUTS: StatutContact[] = ['Prospect', 'Client Argent', 'Client Or', 'Client Platine'];

const statutConfig: Record<StatutContact, { label: string; badge: string; dot: string }> = {
  'Prospect': {
    label: 'Prospect',
    badge: 'bg-gray-100 text-gray-600 border border-gray-300',
    dot: 'bg-gray-400',
  },
  'Client Argent': {
    label: 'Argent',
    badge: 'bg-blue-100 text-blue-700 border border-blue-300',
    dot: 'bg-blue-400',
  },
  'Client Or': {
    label: 'Or',
    badge: 'bg-amber-100 text-amber-700 border border-amber-300',
    dot: 'bg-amber-400',
  },
  'Client Platine': {
    label: 'Platine',
    badge: 'bg-sky-100 text-sky-700 border border-sky-300',
    dot: 'bg-sky-500',
  },
};

interface EditingData {
  id: number;
  nom?: string;
  prenom: string;
  pseudo: string;
  entreprise: string;
  quartier_ville: string;
  telephone: string;
  shipping_marks: string[];
  statut_contact: StatutContact;
}

const StatutBadge = memo(function StatutBadge({ statut }: { statut?: string }) {
  const key = (statut as StatutContact) || 'Prospect';
  const cfg = statutConfig[key] ?? statutConfig['Prospect'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
});

const ClientsPage = memo(function ClientsPage() {
  const { clients, loading, error, refreshClients } = useClients();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all');
  const [shippingMarksModalOpen, setShippingMarksModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(client => {
      const matchesSearch =
        client.nom?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.prenom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.pseudo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.entreprise?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.shipping_marks.some(mark =>
          mark.shipping_mark.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

      const matchesStatut =
        statutFilter === 'all' ||
        (client.statut_contact || 'Prospect') === statutFilter;

      return matchesSearch && matchesStatut;
    });

    result.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      switch (sortField) {
        case 'nom': aValue = a.nom ?? ''; bValue = b.nom ?? ''; break;
        case 'prenom': aValue = a.prenom ?? ''; bValue = b.prenom ?? ''; break;
        case 'entreprise': aValue = a.entreprise ?? ''; bValue = b.entreprise ?? ''; break;
      }
      aValue = String(aValue || '');
      bValue = String(bValue || '');
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, debouncedSearchTerm, sortField, sortDirection, statutFilter]);

  const statutCounts = useMemo(() => {
    const counts: Record<StatutContact, number> = {
      'Prospect': 0,
      'Client Argent': 0,
      'Client Or': 0,
      'Client Platine': 0,
    };
    clients.forEach(c => {
      const key = (c.statut_contact as StatutContact) || 'Prospect';
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [clients]);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
  } = usePagination({
    items: filteredAndSortedClients,
    itemsPerPage: 15,
  });

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleEdit = useCallback((client: any) => {
    setEditingId(client.id);
    setEditingData({
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      pseudo: client.pseudo || '',
      entreprise: client.entreprise || '',
      quartier_ville: client.quartier_ville || '',
      telephone: client.telephone || '',
      shipping_marks: client.shipping_marks.map((mark: any) => mark.shipping_mark),
      statut_contact: (client.statut_contact as StatutContact) || 'Prospect',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingData(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingData) return;

    if (!editingData.prenom.trim() || !editingData.pseudo.trim() || !editingData.telephone.trim()) {
      toast.error('Le prénom, pseudo et téléphone sont obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      await clientService.update(editingData.id, {
        nom: editingData.nom,
        prenom: editingData.prenom,
        pseudo: editingData.pseudo,
        entreprise: editingData.entreprise || undefined,
        quartier_ville: editingData.quartier_ville || undefined,
        telephone: editingData.telephone || undefined,
        shipping_marks: editingData.shipping_marks,
        statut_contact: editingData.statut_contact,
      });
      toast.success('Client mis à jour avec succès !');
      setEditingId(null);
      setEditingData(null);
      refreshClients();
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingData, refreshClients]);

  const handleDelete = useCallback(async (clientId: number, pseudo: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${pseudo}" ?`)) {
      setIsSubmitting(true);
      try {
        await clientService.delete(clientId);
        toast.success('Client supprimé avec succès !');
        refreshClients();
      } catch (error: any) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [refreshClients]);

  const handleFormSuccess = useCallback(() => {
    setIsAddingNew(false);
    refreshClients();
  }, [refreshClients]);

  const handleFormCancel = useCallback(() => {
    setIsAddingNew(false);
  }, []);

  const handleOpenShippingMarksModal = useCallback(() => {
    setShippingMarksModalOpen(true);
  }, []);

  const handleCloseShippingMarksModal = useCallback(() => {
    setShippingMarksModalOpen(false);
  }, []);

  const handleUpdateShippingMarks = useCallback((marks: string[]) => {
    if (editingData) {
      setEditingData({ ...editingData, shipping_marks: marks });
    }
  }, [editingData]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const renderShippingMarks = (marks: any[]) => {
    if (marks.length === 0) return <span className="text-gray-400 text-sm italic">Aucune</span>;
    const displayMarks = marks.slice(0, 3);
    const remaining = marks.length - 3;
    return (
      <div className="flex flex-wrap gap-1">
        {displayMarks.map((mark) => (
          <span
            key={mark.id}
            className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200"
          >
            <Tag className="w-3 h-3" />
            <span>{mark.shipping_mark}</span>
          </span>
        ))}
        {remaining > 0 && (
          <span
            className="inline-flex items-center bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium"
            title={marks.slice(3).map(m => m.shipping_mark).join(', ')}
          >
            +{remaining}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button onClick={() => refreshClients()} className="mt-2 text-red-700 underline hover:text-red-900">
          Réessayer
        </button>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * 15 + 1;
  const endIndex = Math.min(currentPage * 15, filteredAndSortedClients.length);
  const totalItems = filteredAndSortedClients.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Statistiques par niveau */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUTS.map(statut => {
          const cfg = statutConfig[statut];
          const count = statutCounts[statut];
          const isActive = statutFilter === statut;
          return (
            <button
              key={statut}
              onClick={() => setStatutFilter(isActive ? 'all' : statut)}
              className={`rounded-xl p-4 text-left border-2 transition-all duration-150 ${
                isActive
                  ? 'border-blue-500 shadow-md bg-white'
                  : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Barre de recherche + filtre statut */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, entreprise ou shipping mark..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as StatutFilter)}
          className="px-3 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
        >
          <option value="all">Tous les statuts</option>
          {STATUTS.map(s => (
            <option key={s} value={s}>{statutConfig[s].label}</option>
          ))}
        </select>
      </div>

      {/* Formulaire d'ajout */}
      {isAddingNew && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <ClientForm
            isEditing={false}
            onCancel={handleFormCancel}
            onSuccess={handleFormSuccess}
            isSubmitting={false}
          />
        </div>
      )}

      {/* Compteur */}
      {totalItems > 0 && (
        <div className="text-sm text-gray-600">
          Affichage de {startIndex} à {endIndex} sur {totalItems} client{totalItems > 1 ? 's' : ''}
          {statutFilter !== 'all' && (
            <span className="ml-1 text-blue-600 font-medium">
              — filtre : {statutConfig[statutFilter as StatutContact]?.label}
            </span>
          )}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N°</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('nom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nom</span>
                    {renderSortIcon('nom')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('prenom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Prénom</span>
                    {renderSortIcon('prenom')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-amber-50 border-l border-r border-amber-200">
                  Pseudo
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors hidden md:table-cell"
                  onClick={() => handleSort('entreprise')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Entreprise</span>
                    {renderSortIcon('entreprise')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Quartier/Ville</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Shipping Marks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Niveau</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.map((client, index) => {
                const isEditing = editingId === client.id;
                const rowNumber = startIndex + index;
                const currentStatut = (client.statut_contact as StatutContact) || 'Prospect';

                return (
                  <tr
                    key={client.id}
                    className={`
                      ${isEditing ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      ${isSubmitting && isEditing ? 'opacity-50' : ''}
                      hover:bg-blue-50 transition-colors
                    `}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{rowNumber}</td>

                    {isEditing && editingData ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData.nom || ''}
                            onChange={(e) => setEditingData({ ...editingData, nom: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nom (optionnel)"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <input
                            type="text"
                            value={editingData.prenom}
                            onChange={(e) => setEditingData({ ...editingData, prenom: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Prénom"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 bg-amber-50 border-l border-r border-amber-200">
                          <input
                            type="text"
                            value={editingData.pseudo}
                            onChange={(e) => setEditingData({ ...editingData, pseudo: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="Pseudo"
                            disabled={isSubmitting}
                          />
                          <input
                            type="text"
                            value={editingData.telephone}
                            onChange={(e) => setEditingData({ ...editingData, telephone: e.target.value })}
                            className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white md:hidden"
                            placeholder="Téléphone"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <input
                            type="text"
                            value={editingData.entreprise}
                            onChange={(e) => setEditingData({ ...editingData, entreprise: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Entreprise"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <input
                            type="text"
                            value={editingData.telephone}
                            onChange={(e) => setEditingData({ ...editingData, telephone: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Téléphone"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <input
                            type="text"
                            value={editingData.quartier_ville}
                            onChange={(e) => setEditingData({ ...editingData, quartier_ville: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Quartier/Ville"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <button
                            onClick={handleOpenShippingMarksModal}
                            disabled={isSubmitting}
                            className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                          >
                            Gérer ({editingData.shipping_marks.length})
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <select
                            value={editingData.statut_contact}
                            onChange={(e) => setEditingData({ ...editingData, statut_contact: e.target.value as StatutContact })}
                            disabled={isSubmitting}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                          >
                            {STATUTS.map(s => (
                              <option key={s} value={s}>{statutConfig[s].label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSubmitting}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSubmitting}
                              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{client.nom || ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">{client.prenom}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold bg-amber-50 border-l border-r border-amber-200">
                          <div>{client.pseudo || '-'}</div>
                          <div className="md:hidden text-xs font-normal text-gray-500 mt-0.5">{client.telephone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">{client.entreprise || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">{client.telephone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">{client.quartier_ville || '-'}</td>
                        <td className="px-4 py-3 hidden xl:table-cell">{renderShippingMarks(client.shipping_marks)}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatutBadge statut={currentStatut} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(client)}
                              disabled={isSubmitting || editingId !== null}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id, `${client.nom || ''} ${client.prenom}`.trim())}
                              disabled={isSubmitting || editingId !== null}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Message si aucun client */}
        {paginatedItems.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-2">
              {searchTerm || statutFilter !== 'all' ? 'Aucun client trouvé' : 'Aucun client'}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm || statutFilter !== 'all'
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Commencez par ajouter votre premier client.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <button
            onClick={previousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal de gestion des shipping marks */}
      {shippingMarksModalOpen && editingData && (
        <ShippingMarksModal
          shippingMarks={editingData.shipping_marks}
          onUpdate={handleUpdateShippingMarks}
          onClose={handleCloseShippingMarksModal}
        />
      )}
    </div>
  );
});

export default ClientsPage;
