import React, { useState } from 'react';
import { Ship, Plus, Search } from 'lucide-react';
import { useDepartures } from '../../hooks/useDepartures';
import { useInventory } from '../../hooks/useInventory';
import { DepartureFormData } from '../../schemas/departureSchema';
import { getDepartureStatusLabel, getDepartureStatusColor, departureToPackageStatusMap } from '../../utils/statusHelpers';
import DepartureForm from '../forms/DepartureForm';
import DepartCard from './DepartCard';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

export default function DepartsPage() {
  const { profileData } = useEmployeeProfile();
  const { 
    items: departItems, 
    loading, 
    error, 
    addItem, 
    updateItem,
    archiveItem,
    isAdding,
    isUpdating,
    isArchiving
  } = useDepartures();
  const { items: inventoryItems, updateStatus } = useInventory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddDepart = async (formData: DepartureFormData) => {
    try {
      // Convertir les données du formulaire en DepartItem
      const newDepart = {
        ...formData,
        imageChargement: [],
        imageSuiviMaritime: [],
        imageReceptionColis: [],
        colisAssocies: formData.colisAssocies || []
      };
      await addItem(newDepart);
      setIsAddingNew(false);
      
      // Synchroniser les statuts des colis
      const packageStatus = departureToPackageStatusMap[newDepart.statut!];
      if (packageStatus) {
        await updateStatus(newDepart.colisAssocies, packageStatus);
      }
    } catch (error) {
      console.error('Erreur ajout départ:', error);
      // L'erreur sera automatiquement gérée par React Query
    }
  };

  const handleUpdateDepart = async (id: number, updates: any) => {
    try {
      const updatedDepart = await updateItem(id, updates);
      
      // Synchroniser les statuts des colis si le statut a changé
      if (updates.statut) {
        const packageStatus = departureToPackageStatusMap[updates.statut];
        if (packageStatus && updates.colisAssocies) {
          await updateStatus(updates.colisAssocies, packageStatus);
        }
      }
      
      // Fermer automatiquement l'édition après sauvegarde réussie
      setEditingId(null);
    } catch (error) {
      console.error('Erreur mise à jour départ:', error);
      // L'erreur sera automatiquement gérée par React Query
    }
  };

  const handleArchiveDepart = async (id: number) => {
    const depart = departItems.find(d => d.id === id);
    if (!depart) return;

    const confirmMessage = `Êtes-vous sûr de vouloir archiver le départ #${id} - ${depart.numBL} ?\n\nCette action archivera également tous les ${depart.colisAssocies.length} colis associés.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await archiveItem(id);
      } catch (error) {
        console.error('Erreur archivage départ:', error);
        // L'erreur sera automatiquement gérée par React Query
      }
    }
  };
  const filteredDepartItems = departItems.filter(item =>
    item.numBL.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numTC.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDepartureStatusLabel(item.statut).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des départs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-700 underline hover:text-red-900"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Départs</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || isAdding}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{isAddingNew || isAdding ? 'Ajout en cours...' : 'Nouveau Départ'}</span>
        </button>
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
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro BL, TC ou statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des départs */}
      {isAddingNew && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau départ</h3>
          <DepartureForm
            onSubmit={handleAddDepart}
            onCancel={() => setIsAddingNew(false)}
            isSubmitting={isAdding}
            submitLabel="Créer le départ"
          />
        </div>
      )}
      
      <div className="space-y-3">
        {filteredDepartItems.map((item) => (
          <DepartCard
            key={item.id}
            depart={item}
            inventoryItems={inventoryItems}
            isEditing={editingId === item.id}
            isReadOnly={false}
            isUpdating={isUpdating}
            isArchiving={isArchiving}
            onEdit={() => setEditingId(item.id)}
            onSave={(updates) => handleUpdateDepart(item.id, updates)}
            onCancel={() => setEditingId(null)}
            onArchive={() => handleArchiveDepart(item.id)}
          />
        ))}
      </div>

      {filteredDepartItems.length === 0 && !isAddingNew && (
        <div className="text-center py-12">
          <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ trouvé</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Aucun départ ne correspond à votre recherche.' : 'Commencez par créer votre premier départ.'}
          </p>
        </div>
      )}
    </div>
  );
}