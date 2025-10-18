import React, { useState, useEffect } from 'react';
import { X, Package, Weight, Truck, Check } from 'lucide-react';
import { InventoryItem } from '../../types';
import { calculateSelectionStats } from '../../utils/calculations';
import { getInventoryStatusColor, getEntrepotColor, getNatureColor } from '../../utils/statusHelpers';

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: number[], stats: any) => void;
  inventoryItems: InventoryItem[];
  initialSelectedIds: number[];
}

export default function PackageSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  inventoryItems,
  initialSelectedIds
}: PackageSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  if (!isOpen) return null;

  const filteredItems = inventoryItems.filter(item =>
    item.shippingMark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = calculateSelectionStats(selectedIds, inventoryItems);

  const handleToggleSelection = (colisId: number) => {
    setSelectedIds(prev => 
      prev.includes(colisId) 
        ? prev.filter(id => id !== colisId)
        : [...prev, colisId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredItems.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedIds, stats);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sélectionner les colis</h2>
              <p className="text-sm text-gray-600">{selectedIds.length} colis sélectionné{selectedIds.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistiques des colis sélectionnés */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Totaux des colis sélectionnés</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Palettes</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.nbPalettes}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Cartons</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.nbCartons}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Weight className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Poids</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.poids.toFixed(1)} kg</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Volume</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.volume.toFixed(1)} m³</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et actions */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Rechercher par shipping mark, description ou BL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                Tout sélectionner
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-2 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
        </div>

        {/* Liste des colis */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'Aucun colis ne correspond à votre recherche.' : 'Aucun colis disponible dans l\'inventaire.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((colis) => (
                <label
                  key={colis.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedIds.includes(colis.id)
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(colis.id)}
                    onChange={() => handleToggleSelection(colis.id)}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    {/* Ligne principale */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">#{colis.id}</span>
                        <span className="text-xs sm:text-sm font-medium text-blue-700">{colis.shippingMark || 'Sans shipping mark'}</span>
                        {colis.entrepot && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getEntrepotColor(colis.entrepot)}`}>
                            {colis.entrepot}
                          </span>
                        )}
                        {colis.nature && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getNatureColor(colis.nature)}`}>
                            {colis.nature}
                          </span>
                        )}
                      </div>
                      
                      {selectedIds.includes(colis.id) && (
                        <div className="flex items-center space-x-1 text-blue-600 self-start sm:self-center">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-medium">Sélectionné</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-1 line-clamp-1">{colis.description}</p>

                    {/* Détails techniques */}
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3" />
                        <span>{colis.nbPalettes} pal.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3" />
                        <span>{colis.nbCartons} cart.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Weight className="w-3 h-3" />
                        <span>{colis.poids} kg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="w-3 h-3" />
                        <span>{colis.volume} m³</span>
                      </div>
                    </div>

                    {/* BL et date */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs text-gray-400 space-y-0.5 sm:space-y-0">
                      <span>BL: {colis.bl}</span>
                      <span>Entrée: {new Date(colis.dateEntree).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-gray-200 bg-gray-50 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {selectedIds.length} colis sélectionné{selectedIds.length > 1 ? 's' : ''} sur {inventoryItems.length}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Confirmer la sélection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}