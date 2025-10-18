import React, { useState } from 'react';
import { Archive, Search, Calendar, Package, FileText, Download, Eye, Filter, RotateCcw, AlertTriangle, Weight, Truck, ChevronDown, ChevronUp, User, Building } from 'lucide-react';
import { useArchivedDepartures } from '../../hooks/useDepartures';
import { useAllInventoryItems } from '../../hooks/useInventory';
import { getDepartureStatusLabel, getDepartureStatusColor, getInventoryStatusColor, getEntrepotColor, getNatureColor } from '../../utils/statusHelpers';

export default function ArchivesPage() {
  const { 
    archivedItems, 
    loading, 
    error, 
    unarchiveItem, 
    isUnarchiving 
  } = useArchivedDepartures();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useAllInventoryItems();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedDeparts, setExpandedDeparts] = useState<{ [key: number]: boolean }>({});

  const handleUnarchive = async (departId: number) => {
    const depart = archivedItems.find(d => d.id === departId);
    if (!depart) return;

    const confirmMessage = `Êtes-vous sûr de vouloir désarchiver le départ #${departId} - ${depart.numBL} ?\n\nCette action remettra également tous les colis associés en statut actif.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log('🔄 Début du désarchivage du départ:', departId);
        const result = await unarchiveItem(departId, 'decharge_trie');
        console.log('✅ Désarchivage réussi:', result);
      } catch (error) {
        console.error('❌ Erreur désarchivage départ:', error);
        // Empêcher la propagation de l'erreur qui pourrait causer une déconnexion
        if (error instanceof Error) {
          alert(`Erreur lors du désarchivage: ${error.message}`);
        } else {
          alert('Erreur lors du désarchivage du départ');
        }
      }
    }
  };

  const getColisForDepart = (departId: number) => {
    const depart = archivedItems.find(d => d.id === departId);
    if (!depart) return [];
    
    return inventoryItems.filter(item => depart.colisAssocies.includes(item.id));
  };

  const toggleDepartExpansion = (departId: number) => {
    setExpandedDeparts(prev => ({
      ...prev,
      [departId]: !prev[departId]
    }));
  };

  const getPackageStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'en_attente_confirmation': 'En attente de confirmation',
      'enregistre_chine': 'Enregistré en Chine',
      'charge_expedition': 'Chargé pour l\'expédition',
      'en_route_madagascar': 'En route vers Madagascar',
      'arrive_toamasina': 'Arrivé au port de Toamasina',
      'dedouanement_cours': 'En cours de dédouanement',
      'arrive_antananarivo': 'Arrivé à Antananarivo',
      'pret_livraison_enlevement': 'Prêt pour livraison/enlèvement',
      'en_cours_livraison': 'En cours de livraison',
      'livre': 'Livré',
      'archive': 'Archivé'
    };
    return statusLabels[status] || status;
  };

  const filteredArchivedItems = archivedItems.filter(item => {
    const matchesSearch = item.numBL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numTC.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      (item.dateArriveTana && item.dateArriveTana.startsWith(dateFilter));
    
    return matchesSearch && matchesDate;
  });

  // Calculer les statistiques
  const totalArchivedPackages = archivedItems.reduce((total, depart) => {
    const associatedColis = getColisForDepart(depart.id);
    return total + associatedColis.length;
  }, 0);

  const totalArchivedWeight = archivedItems.reduce((total, depart) => {
    const associatedColis = getColisForDepart(depart.id);
    return total + associatedColis.reduce((sum, colis) => sum + (parseFloat(colis.poids) || 0), 0);
  }, 0);

  const totalArchivedVolume = archivedItems.reduce((total, depart) => {
    const associatedColis = getColisForDepart(depart.id);
    return total + associatedColis.reduce((sum, colis) => sum + (parseFloat(colis.volume) || 0), 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Chargement des archives...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Archive className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Archives</h2>
          <p className="text-gray-600">Consultez l'historique des départs et colis archivés</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Archive className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Départs archivés</p>
              <p className="text-2xl font-bold text-gray-900">{archivedItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total colis</p>
              <p className="text-2xl font-bold text-gray-900">{totalArchivedPackages}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <Weight className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Poids total</p>
              <p className="text-2xl font-bold text-gray-900">{totalArchivedWeight.toFixed(1)} kg</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Truck className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Volume total</p>
              <p className="text-2xl font-bold text-gray-900">{totalArchivedVolume.toFixed(1)} m³</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par BL, TC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tous les départs</option>
              <option value="recent">Récemment archivés</option>
              <option value="old">Plus anciens</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des départs archivés */}
      {filteredArchivedItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Archive className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {searchTerm || dateFilter ? 'Aucun résultat trouvé' : 'Aucun départ archivé'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || dateFilter 
                ? 'Aucun départ archivé ne correspond à vos critères de recherche.'
                : 'Les départs archivés apparaîtront ici. Vous pouvez archiver un départ depuis la section "Départs".'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredArchivedItems.map((depart) => {
            const associatedColis = getColisForDepart(depart.id);
            const isExpanded = expandedDeparts[depart.id];
            
            // Calculer les totaux
            const totals = {
              nbPalettes: depart.nbPalettesTotal || 0,
              nbCartons: depart.nbCartonsTotal || 0,
              poids: depart.poidsTotal || 0,
              volume: depart.volumeTotal || 0
            };

            return (
              <div
                key={depart.id}
                className="bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-2xl shadow-lg border-2 border-gray-300 p-6 relative overflow-hidden"
              >
                {/* Décoration de fond */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-lg"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-xl shadow-md border border-white/50">
                        <Archive className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Départ #{depart.id} - {depart.numBL}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {associatedColis.length} colis archivés
                        </p>
                        {depart.numTC && (
                          <p className="text-xs text-gray-500">TC: {depart.numTC}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-4 py-2 rounded-xl text-sm font-bold border-2 shadow-md bg-gray-100 text-gray-800 border-gray-200 backdrop-blur-sm">
                        Archivé
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleDepartExpansion(depart.id)}
                          className="text-gray-600 hover:text-gray-800 hover:scale-110 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 shadow-md"
                          title={isExpanded ? "Masquer les colis" : "Voir les colis"}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        
                        <button
                          onClick={() => handleUnarchive(depart.id)}
                          disabled={isUnarchiving}
                          className="text-blue-600 hover:text-blue-800 hover:scale-110 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50"
                          title="Désarchiver le départ"
                        >
                          {isUnarchiving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          ) : (
                            <RotateCcw className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Package className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Palettes</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totals.nbPalettes}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Package className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Cartons</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totals.nbCartons}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Package className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Poids</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totals.poids.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Package className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Volume</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totals.volume.toFixed(1)} m³</p>
                    </div>
                  </div>

                  {/* Dates importantes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Chargement</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {depart.dateChargement ? new Date(depart.dateChargement).toLocaleDateString('fr-FR') : 'Non défini'}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Départ Chine</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {depart.dateDepartChine ? new Date(depart.dateDepartChine).toLocaleDateString('fr-FR') : 'Non défini'}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Arrivée Tana</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {depart.dateArriveTana ? new Date(depart.dateArriveTana).toLocaleDateString('fr-FR') : 'Non défini'}
                      </p>
                    </div>
                  </div>

                  {/* Liste des colis archivés */}
                  {isExpanded && associatedColis.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Package className="w-4 h-4 text-purple-600" />
                        <h4 className="text-sm font-bold text-gray-800">Colis archivés ({associatedColis.length})</h4>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-inner">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-max text-sm">
                            <thead className="bg-white/50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrepôt</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palettes</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/30 divide-y divide-gray-200">
                              {associatedColis.map((colis) => (
                                <tr key={colis.id} className="hover:bg-white/50 transition-colors">
                                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{colis.id}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-purple-700 font-medium">
                                    {colis.shippingMark || 'Sans shipping mark'}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-gray-900 max-w-xs">
                                    <div className="truncate" title={colis.description}>
                                      {colis.description}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                                    {colis.entrepot ? (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEntrepotColor(colis.entrepot)}`}>
                                        {colis.entrepot}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {colis.nbPalettes}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {colis.nbCartons}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {colis.poids} kg
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {colis.volume} m³
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                                    {colis.nature ? (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getNatureColor(colis.nature)}`}>
                                        {colis.nature}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getInventoryStatusColor(colis.statut)}`}>
                                      {getPackageStatusLabel(colis.statut)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message si aucun colis */}
                  {isExpanded && associatedColis.length === 0 && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-inner text-center">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Aucun colis associé à ce départ archivé</p>
                    </div>
                  )}

                  {/* Aperçu compact des colis quand fermé */}
                  {!isExpanded && associatedColis.length > 0 && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-700">
                          <span className="font-medium">{associatedColis.length} colis archivés</span>
                          <span className="text-gray-500">•</span>
                          <span>Shipping marks: {associatedColis.map(c => c.shippingMark).filter(Boolean).slice(0, 3).join(', ')}{associatedColis.filter(c => c.shippingMark).length > 3 ? '...' : ''}</span>
                        </div>
                        <button
                          onClick={() => toggleDepartExpansion(depart.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Voir détails</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}