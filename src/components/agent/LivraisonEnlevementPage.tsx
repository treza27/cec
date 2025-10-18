import React, { useState } from 'react';
import { Truck, Package, ArrowLeft, Ship, Calendar, MapPin, Weight, Users, Edit, Save, X, FileText, User } from 'lucide-react';
import { useDepartures } from '../../hooks/useDepartures';
import { useInventory } from '../../hooks/useInventory';
import { useClientDeliveryGroups } from '../../hooks/useDeliveryReceipts';
import { getDepartureStatusLabel, getDepartureStatusColor, getInventoryStatusColor } from '../../utils/statusHelpers';
import DeliveryReceiptUpload from './DeliveryReceiptUpload';
import toast from 'react-hot-toast';

export default function LivraisonEnlevementPage() {
  const { items: departItems, loading: departLoading, error: departError } = useDepartures();
  const { items: inventoryItems, loading: inventoryLoading, updateItem, isUpdating } = useInventory();
  const [selectedDepartId, setSelectedDepartId] = useState<number | null>(null);
  const [editingColisId, setEditingColisId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [showDeliveryReceipts, setShowDeliveryReceipts] = useState(false);

  // Hook pour récupérer les groupes de clients du départ sélectionné
  const { 
    data: clientGroups = [], 
    loading: clientGroupsLoading,
    refetch: refreshClientGroups 
  } = useClientDeliveryGroups(selectedDepartId || 0, inventoryItems);

  const loading = departLoading || inventoryLoading;

  // Fonction pour obtenir les colis d'un départ
  const getColisForDepart = (departId: number) => {
    const depart = departItems.find(d => d.id === departId);
    if (!depart) return [];
    
    return inventoryItems.filter(item => depart.colisAssocies.includes(item.id));
  };

  // Fonction pour obtenir le style de la carte selon le statut
  const getDepartureCardStyle = (statut: string) => {
    switch (statut) {
      case 'preparation_depart':
        return {
          bgGradient: 'from-gray-100 via-gray-50 to-white',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      case 'conteneur_charge':
        return {
          bgGradient: 'from-orange-100 via-orange-50 to-white',
          borderColor: 'border-orange-300',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
      case 'depart_chine':
        return {
          bgGradient: 'from-blue-100 via-blue-50 to-white',
          borderColor: 'border-blue-300',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'arrivee_toamasina':
        return {
          bgGradient: 'from-cyan-100 via-cyan-50 to-white',
          borderColor: 'border-cyan-300',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600'
        };
      case 'dedouanement_en_cours':
        return {
          bgGradient: 'from-purple-100 via-purple-50 to-white',
          borderColor: 'border-purple-300',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600'
        };
      case 'arrivee_antananarivo':
        return {
          bgGradient: 'from-indigo-100 via-indigo-50 to-white',
          borderColor: 'border-indigo-300',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600'
        };
      case 'decharge_trie':
        return {
          bgGradient: 'from-green-100 via-green-50 to-white',
          borderColor: 'border-green-300',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      default:
        return {
          bgGradient: 'from-gray-100 via-gray-50 to-white',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'preparation_depart':
        return Package;
      case 'conteneur_charge':
        return Truck;
      case 'depart_chine':
        return Ship;
      case 'arrivee_toamasina':
      case 'dedouanement_en_cours':
        return MapPin;
      case 'arrivee_antananarivo':
      case 'decharge_trie':
        return Truck;
      default:
        return Package;
    }
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
      'livre': 'Livré'
    };
    return statusLabels[status] || status;
  };

  const handleEditStatus = (colisId: number, currentStatus: string) => {
    setEditingColisId(colisId);
    setEditingStatus(currentStatus);
  };

  const handleSaveStatus = async (colisId: number) => {
    try {
      await updateItem(colisId, { statut: editingStatus });
      toast.success('Statut mis à jour avec succès !');
      setEditingColisId(null);
      setEditingStatus('');
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingColisId(null);
    setEditingStatus('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (departError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {departError}</p>
      </div>
    );
  }

  // Si un départ est sélectionné, afficher ses colis
  if (selectedDepartId) {
    const selectedDepart = departItems.find(d => d.id === selectedDepartId);
    const associatedColis = getColisForDepart(selectedDepartId);

    if (!selectedDepart) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedDepartId(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux départs</span>
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">Départ non trouvé</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedDepartId(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux départs</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDeliveryReceipts(!showDeliveryReceipts)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                showDeliveryReceipts 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{showDeliveryReceipts ? 'Masquer' : 'Bons de livraison'}</span>
            </button>
            <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Départ #{selectedDepart.id} - {selectedDepart.numBL}
            </h2>
            <p className="text-gray-600">{associatedColis.length} colis associés</p>
            </div>
          </div>
        </div>

        {/* Informations du départ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Date chargement</p>
                <p className="font-medium">{selectedDepart.dateChargement ? new Date(selectedDepart.dateChargement).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Ship className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Départ Chine</p>
                <p className="font-medium">{selectedDepart.dateDepartChine ? new Date(selectedDepart.dateDepartChine).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-sm text-gray-500">Arrivée Tana</p>
                <p className="font-medium">{selectedDepart.dateArriveTana ? new Date(selectedDepart.dateArriveTana).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDepartureStatusColor(selectedDepart.statut)}`}>
                {getDepartureStatusLabel(selectedDepart.statut)}
              </span>
            </div>
          </div>
        </div>

        {/* Section des bons de livraison */}
        {showDeliveryReceipts && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Bons de livraison par client</h3>
            </div>

            {clientGroupsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des groupes clients...</span>
              </div>
            ) : clientGroups.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé pour ce départ</h3>
                <div className="text-sm text-gray-600 space-y-2 max-w-md mx-auto">
                  <p>Pour générer des bons de livraison, les colis doivent avoir des <strong>Shipping Marks</strong> associées à des clients existants.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                    <p className="font-medium text-blue-800 mb-1">📋 Étapes à suivre :</p>
                    <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
                      <li>Allez dans la section <strong>"Clients"</strong></li>
                      <li>Créez ou modifiez un client</li>
                      <li>Ajoutez les Shipping Marks des colis de ce départ :</li>
                    </ol>
                    <div className="mt-2 bg-white rounded p-2 border border-blue-300">
                      <p className="text-xs font-mono text-blue-800">
                        {associatedColis.map(c => c.shippingMark).filter(Boolean).join(', ') || 'Aucune shipping mark trouvée'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {clientGroups.map((group: any) => (
                  <div key={group.client_id} className="border border-gray-200 rounded-lg p-4">
                    <DeliveryReceiptUpload
                      departId={selectedDepartId}
                      clientId={group.client_id}
                      clientName={group.client_name}
                      colisIds={group.colis.map((c: any) => c.id)}
                      shippingMarks={group.shipping_marks}
                      existingReceipts={group.delivery_receipts}
                      onReceiptUploaded={refreshClientGroups}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Liste des colis */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Colis associés ({associatedColis.length})</span>
              <button
                onClick={() => setShowDeliveryReceipts(!showDeliveryReceipts)}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span>Gérer les bons de livraison</span>
              </button>
            </h3>
          </div>

          {associatedColis.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun colis associé à ce départ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palettes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {associatedColis.map((colis) => (
                    <tr key={colis.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{colis.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-700 font-medium">
                        {colis.shippingMark || 'Sans shipping mark'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={colis.description}>
                          {colis.description}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {colis.nbPalettes}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          {colis.nbCartons}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                          {colis.poids} kg
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                          {colis.volume} m³
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingColisId === colis.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              disabled={isUpdating}
                            >
                              <option value="en_attente_confirmation">En attente de confirmation</option>
                              <option value="enregistre_chine">Enregistré en Chine</option>
                              <option value="charge_expedition">Chargé pour l'expédition</option>
                              <option value="en_route_madagascar">En route vers Madagascar</option>
                              <option value="arrive_toamasina">Arrivé au port de Toamasina</option>
                              <option value="dedouanement_cours">En cours de dédouanement</option>
                              <option value="arrive_antananarivo">Arrivé à Antananarivo</option>
                              <option value="pret_livraison_enlevement">Prêt pour livraison/enlèvement</option>
                              <option value="en_cours_livraison">En cours de livraison</option>
                              <option value="livre">Livré</option>
                            </select>
                            <button
                              onClick={() => handleSaveStatus(colis.id)}
                              disabled={isUpdating}
                              className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getInventoryStatusColor(colis.statut)}`}>
                              {getPackageStatusLabel(colis.statut)}
                            </span>
                            <button
                              onClick={() => handleEditStatus(colis.id, colis.statut)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Modifier le statut"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Affichage principal avec toutes les cartes de départ
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Livraison / Enlèvement</h2>
          <p className="text-gray-600">Cliquez sur un départ pour voir les colis associés</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Ship className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Départs</p>
              <p className="text-2xl font-bold text-gray-900">{departItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Colis</p>
              <p className="text-2xl font-bold text-gray-900">
                {departItems.reduce((total, depart) => total + depart.colisAssocies.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prêts livraison</p>
              <p className="text-2xl font-bold text-gray-900">
                {departItems.filter(d => d.statut === 'arrivee_antananarivo' || d.statut === 'decharge_trie').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des cartes de départ */}
      {departItems.length === 0 ? (
        <div className="text-center py-12">
          <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ disponible</h3>
          <p className="text-gray-500">Les départs apparaîtront ici une fois créés.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {departItems.map((depart) => {
            const cardStyle = getDepartureCardStyle(depart.statut);
            const StatusIcon = getStatusIcon(depart.statut);
            const associatedColis = getColisForDepart(depart.id);

            // Calculer les totaux
            const totals = associatedColis.reduce((acc, colis) => ({
              nbPalettes: acc.nbPalettes + (parseInt(colis.nbPalettes) || 0),
              nbCartons: acc.nbCartons + (parseInt(colis.nbCartons) || 0),
              poids: acc.poids + (parseFloat(colis.poids) || 0),
              volume: acc.volume + (parseFloat(colis.volume) || 0)
            }), { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 });

            return (
              <div
                key={depart.id}
                onClick={() => setSelectedDepartId(depart.id)}
                className={`bg-gradient-to-br ${cardStyle.bgGradient} rounded-2xl shadow-lg border-2 ${cardStyle.borderColor} p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
              >
                {/* Décoration de fond */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-lg"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 ${cardStyle.iconBg} rounded-xl shadow-md border border-white/50`}>
                        <StatusIcon className={`w-6 h-6 ${cardStyle.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Départ #{depart.id}
                        </h3>
                        <p className="text-sm text-gray-600">BL: {depart.numBL}</p>
                        {depart.numTC && (
                          <p className="text-xs text-gray-500">TC: {depart.numTC}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border-2 shadow-md ${getDepartureStatusColor(depart.statut)} backdrop-blur-sm`}>
                      {getDepartureStatusLabel(depart.statut)}
                    </span>
                  </div>

                  {/* Stats compactes */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-600">Palettes</p>
                          <p className="text-lg font-bold text-gray-900">{totals.nbPalettes}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-600">Cartons</p>
                          <p className="text-lg font-bold text-gray-900">{totals.nbCartons}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                      <div className="flex items-center space-x-2">
                        <Weight className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="text-xs text-gray-600">Poids</p>
                          <p className="text-lg font-bold text-gray-900">{totals.poids.toFixed(1)} kg</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="text-xs text-gray-600">Volume</p>
                          <p className="text-lg font-bold text-gray-900">{totals.volume.toFixed(1)} m³</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nombre de colis */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Colis associés</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{associatedColis.length}</span>
                    </div>
                  </div>

                  {/* Indicateur cliquable */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 italic">Cliquez pour voir les détails des colis</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}