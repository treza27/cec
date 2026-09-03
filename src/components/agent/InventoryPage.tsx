import React, { useState, memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CreditCard as Edit, Check, X, Eye, Package, Weight, Truck, ChevronLeft, ChevronRight, Archive, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useInventory, useInventoryPage, PAGE_SIZE } from '../../hooks/useInventory';
import { inventoryService } from '../../services/inventoryService';
import { useClients } from '../../hooks/useClients';
import InventoryStatistics from './InventoryStatistics';
import SimpleImageUpload from './SimpleImageUpload';
import BulkImportModal from './BulkImportModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { calculateWFI, getWFIColor } from '../../utils/calculations';
import { getInventoryStatusColor, getEntrepotColor } from '../../utils/statusHelpers';
import { supabase } from '../../utils/supabase';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { useDebounce } from '../../hooks/useDebounce';

const InventoryPage = memo(function InventoryPage() {
  const { t } = useTranslation();
  const { profileData } = useEmployeeProfile();
  const {
    updateItem,
    deleteItem,
    deleteMultipleItems,
    archiveItem,
    refreshItems,
    isUpdating,
    isDeleting,
    isDeletingMultiple,
    isArchiving
  } = useInventory();
  const { shippingMarks, pseudos } = useClients();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingImages, setViewingImages] = useState<{ images: any[], itemId: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [supabaseImages, setSupabaseImages] = useState<{ [key: number]: any[] }>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { items: inventoryItems, total, totalPages, loading, isFetching, error } = useInventoryPage(currentPage, debouncedSearchTerm);

  const [globalStats, setGlobalStats] = useState<{ totalPalettes: number; totalCartons: number; totalPoids: number; totalVolume: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshGlobalStats = useCallback(() => {
    setStatsLoading(true);
    inventoryService.getGlobalStats(debouncedSearchTerm)
      .then(setGlobalStats)
      .catch(() => setGlobalStats(null))
      .finally(() => setStatsLoading(false));
  }, [debouncedSearchTerm]);

  useEffect(() => {
    refreshGlobalStats();
  }, [debouncedSearchTerm, inventoryItems]);

  const isAdmin = profileData?.role === 'administrateur';

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Nettoyer les sélections invalides quand les items changent
  React.useEffect(() => {
    const validIds = new Set(inventoryItems.map(item => item.id));
    const invalidSelections = Array.from(selectedItems).filter(id => !validIds.has(id));

    if (invalidSelections.length > 0) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        invalidSelections.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [inventoryItems, selectedItems]);

  const handleUpdateItem = useCallback(async (id: number, updates: any) => {
    try {
      await updateItem(id, updates);
      setEditingId(null);
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur mise à jour item:', error);
    }
  }, [updateItem]);

  const handleEdit = useCallback((item: any) => {
    setEditingId(item.id);
    setEditingItem({ ...item });
  }, []);

  const handleSave = useCallback(() => {
    if (editingItem && editingId) {
      handleUpdateItem(editingId, editingItem);
    }
  }, [editingItem, editingId, handleUpdateItem]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditingItem(null);
  }, []);

  const handleArchive = useCallback(async (itemId: number, itemDescription: string) => {
    const confirmMessage = `Êtes-vous sûr de vouloir archiver le colis #${itemId} ?\n\nDescription: ${itemDescription}\n\nCette action déplacera le colis vers les archives.`;

    if (window.confirm(confirmMessage)) {
      try {
        await archiveItem(itemId);
      } catch (error) {
        console.error('Erreur archivage colis:', error);
      }
    }
  }, [archiveItem]);

  const handleDelete = useCallback(async (itemId: number, itemDescription: string) => {
    const confirmMessage = `⚠️ ATTENTION - SUPPRESSION DÉFINITIVE ⚠️\n\nÊtes-vous absolument sûr de vouloir SUPPRIMER DÉFINITIVEMENT le colis #${itemId} ?\n\nDescription: ${itemDescription}\n\nCette action est IRRÉVERSIBLE et supprimera le colis ainsi que toutes ses données associées (images, historique, etc.).\n\nPour archiver le colis plutôt que de le supprimer, utilisez le bouton "Archiver".`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Erreur suppression colis:', error);
      }
    }
  }, [deleteItem]);

  const handleDeleteMultiple = useCallback(() => {
    setIsDeleteModalVisible(true);
  }, []);

  const confirmDeleteMultiple = useCallback(async () => {
    const itemsToDelete = Array.from(selectedItems);
    try {
      await deleteMultipleItems(itemsToDelete);
      setSelectedItems(new Set());
      setIsDeleteModalVisible(false);
    } catch (error) {
      console.error('Erreur suppression multiple colis:', error);
      setIsDeleteModalVisible(false);
    }
  }, [selectedItems, deleteMultipleItems]);

  const cancelDeleteMultiple = useCallback(() => {
    setIsDeleteModalVisible(false);
  }, []);

  const toggleItemSelection = useCallback((itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleBulkImportSuccess = useCallback(() => {
    setCurrentPage(1);
    refreshItems();
    setIsBulkImportOpen(false);
  }, [refreshItems]);

  const handleInputChange = useCallback((field: string, value: any) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  }, [editingItem]);

  const handleViewSupabaseImages = useCallback(async (itemId: number) => {
    try {
      const { data, error } = await supabase
        .from('package_images')
        .select('*')
        .eq('inventaire_id', itemId)
        .eq('image_type', 'general')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return;

      const imageUrls = await Promise.all(
        data.map(async (image) => {
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('package-images')
              .createSignedUrl(image.file_path, 3600);
            if (urlData && !urlError) return { ...image, signedUrl: urlData.signedUrl };
          } catch {
            console.error('Erreur création URL signée');
          }
          return null;
        })
      );

      const validImages = imageUrls.filter(img => img !== null);
      if (validImages.length === 0) return;
      setSupabaseImages(prev => ({ ...prev, [itemId]: data }));
      setViewingImages({ images: validImages, itemId });
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Erreur chargement images:', error);
    }
  }, []);

  const closeImageViewer = useCallback(() => {
    setViewingImages(null);
    setCurrentImageIndex(0);
  }, []);

  const nextImage = useCallback(() => {
    if (viewingImages && currentImageIndex < viewingImages.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [viewingImages, currentImageIndex]);

  const prevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  const getPackageStatusLabel = useCallback((status: string): string => {
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
  }, []);

  const filteredItems = inventoryItems;

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }, [selectedItems.size, filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{t('common.error')}: {error}</p>
        </div>
      )}
      {/* Modal de visualisation des images */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Images du colis ({currentImageIndex + 1}/{viewingImages.images.length})
              </h3>
              <button
                onClick={closeImageViewer}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {viewingImages && viewingImages.images.length > 0 && (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                    <img
                      src={viewingImages.images[currentImageIndex]?.signedUrl || ''}
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain max-h-96"
                    />
                    
                    {viewingImages.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={currentImageIndex === 0}
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={currentImageIndex === viewingImages.images.length - 1}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      {viewingImages.images[currentImageIndex]?.file_name || 'Image'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {viewingImages.images[currentImageIndex]?.file_size ? 
                        (viewingImages.images[currentImageIndex].file_size / 1024 / 1024).toFixed(2) + ' MB' : 
                        'Taille inconnue'
                      }
                    </p>
                  </div>

                  {viewingImages.images.length > 1 && (
                    <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
                      {viewingImages.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentImageIndex 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image?.signedUrl || ''}
                            alt={`Miniature ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeImageViewer}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('inventory.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Multiples Colis</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <InventoryStatistics globalStats={globalStats} isLoading={statsLoading} />

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par shipping mark, description, BL, tracking ou pseudo..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'actions pour la sélection multiple */}
      {isAdmin && selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full shadow-2xl z-40 flex items-center space-x-3 sm:space-x-4 animate-slide-up">
          <span className="text-sm sm:text-base font-medium">
            {selectedItems.size} colis sélectionné{selectedItems.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteMultiple}
              disabled={isDeletingMultiple}
              className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeletingMultiple ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">Supprimer</span>
            </button>
            <button
              onClick={clearSelection}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Tableau responsive */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      title="Tout sélectionner / Tout désélectionner"
                    />
                  </th>
                )}
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BL (Auto)</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date entrée</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tracking</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entrepôt</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PSEUDO</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pal.</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart.</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Poids</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Volume</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">WFI</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Images</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isInvalidPseudo = item.pseudo && !pseudos.includes(item.pseudo);
                const isMissingPseudo = !item.pseudo || item.pseudo.trim() === '';
                return (
                <tr key={item.id} className={`${
                  editingId === item.id ? 'bg-blue-50' :
                  selectedItems.has(item.id) ? 'bg-blue-50' :
                  isInvalidPseudo ? 'bg-red-50 border-l-4 border-red-500' :
                  isMissingPseudo ? 'bg-orange-50 border-l-4 border-orange-400' :
                  'hover:bg-gray-50'
                } transition-colors`}>
                  {isAdmin && (
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.bl ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.bl || 'Non assigné'}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={editingItem?.dateEntree || ''}
                        onChange={(e) => handleInputChange('dateEntree', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      item.dateEntree ? new Date(item.dateEntree).toLocaleDateString('fr-FR') : '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingItem?.trackingNumber || ''}
                        onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      item.trackingNumber || '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                    {editingId === item.id ? (
                      <select
                        value={editingItem?.entrepot || ''}
                        onChange={(e) => handleInputChange('entrepot', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="Guangzhou">Guangzhou</option>
                        <option value="Yiwu">Yiwu</option>
                      </select>
                    ) : (
                      item.entrepot ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEntrepotColor(item.entrepot)}`}>
                          {item.entrepot}
                        </span>
                      ) : '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {editingId === item.id ? (
                      <select
                        value={editingItem?.pseudo || ''}
                        onChange={(e) => handleInputChange('pseudo', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        {pseudos.map((pseudo) => (
                          <option key={pseudo} value={pseudo}>
                            {pseudo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      isInvalidPseudo ? (
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          {item.pseudo}
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        </span>
                      ) : isMissingPseudo ? (
                        <span className="flex items-center gap-1 text-orange-500 italic text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          Sans client
                        </span>
                      ) : (
                        <span>{item.pseudo}</span>
                      )
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {editingId === item.id ? (
                      <select
                        value={editingItem?.shippingMark || ''}
                        onChange={(e) => handleInputChange('shippingMark', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        {shippingMarks.map((mark) => (
                          <option key={mark} value={mark}>
                            {mark}
                          </option>
                        ))}
                      </select>
                    ) : (
                      item.shippingMark || '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell max-w-32">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingItem?.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="truncate block">{item.description}</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="1"
                        value={editingItem?.nbPalettes || ''}
                        onChange={(e) => handleInputChange('nbPalettes', e.target.value)}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    ) : (
                      item.nbPalettes
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="1"
                        value={editingItem?.nbCartons || ''}
                        onChange={(e) => handleInputChange('nbCartons', e.target.value)}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    ) : (
                      item.nbCartons
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editingItem?.poids || ''}
                        onChange={(e) => handleInputChange('poids', e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        step="0.1"
                        min="0"
                      />
                    ) : (
                      `${item.poids} kg`
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editingItem?.volume || ''}
                        onChange={(e) => handleInputChange('volume', e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        step="0.1"
                        min="0"
                      />
                    ) : (
                      `${item.volume} m³`
                    )}
                  </td>
                  <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold hidden lg:table-cell ${getWFIColor(calculateWFI(editingId === item.id && editingItem ? editingItem.volume : item.volume, editingId === item.id && editingItem ? editingItem.poids : item.poids))}`}>
                    {calculateWFI(editingId === item.id && editingItem ? editingItem.volume : item.volume,
                                 editingId === item.id && editingItem ? editingItem.poids : item.poids)}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                    {editingId === item.id ? (
                      <div className="w-48">
                        <SimpleImageUpload
                          inventaireId={item.id}
                          imageType="general"
                          onImagesChange={(count) => {
                            // Recharger les images après upload
                            const loadImages = async () => {
                              try {
                                const { data } = await supabase
                                  .from('package_images')
                                  .select('*')
                                  .eq('inventaire_id', item.id)
                                  .eq('image_type', 'general');
                                setSupabaseImages(prev => ({ ...prev, [item.id]: data || [] }));
                              } catch (error) {
                                console.error('Erreur rechargement images:', error);
                              }
                            };
                            loadImages();
                          }}
                          maxImages={5}
                          className="table-mode"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600"> 
                          {(supabaseImages[item.id] || []).length} img{(supabaseImages[item.id] || []).length > 1 ? 's' : ''}
                        </span>
                        {(supabaseImages[item.id] || []).length > 0 && (
                          <button 
                            onClick={() => handleViewSupabaseImages(item.id)}
                            className="text-blue-600 hover:text-blue-900 text-xs flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">Voir</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                    {editingId === item.id ? (
                      <select
                        value={editingItem?.statut || ''}
                        onChange={(e) => handleInputChange('statut', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getInventoryStatusColor(item.statut)}`}>
                        <span className="hidden sm:inline">{getPackageStatusLabel(item.statut)}</span>
                        <span className="sm:hidden">{item.statut === 'livre' ? '✓' : item.statut === 'en_route_madagascar' ? '🚢' : '📦'}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    {editingId === item.id ? (
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="text-green-600 hover:text-green-900 flex items-center justify-center space-x-1 p-1"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Sauver</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-red-600 hover:text-red-900 flex items-center justify-center space-x-1 p-1"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Annuler</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-center space-x-1 p-1"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                        <button
                          onClick={() => handleArchive(item.id, item.description)}
                          disabled={isArchiving}
                          className="text-orange-600 hover:text-orange-900 flex items-center justify-center space-x-1 p-1 disabled:opacity-50"
                          title="Archiver le colis"
                        >
                          {isArchiving ? (
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span className="hidden sm:inline">Archiver</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item.id, item.description)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 flex items-center justify-center space-x-1 p-1 disabled:opacity-50"
                            title="Supprimer définitivement le colis (Admin uniquement)"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="hidden sm:inline">Supprimer</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun colis trouvé</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Aucun colis ne correspond à votre recherche.' : 'Commencez par importer des colis via "Multiples Colis".'}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
              {' '}&mdash; <span className="font-semibold">{total}</span> colis au total
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isFetching}
                className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Première page"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isFetching}
                className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (currentPage <= 3) {
                  p = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = currentPage - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                      p === currentPage
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isFetching}
                className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || isFetching}
                className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Dernière page"
              >
                »
              </button>
            </div>
          </div>
        )}

        {totalPages <= 1 && total > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              <span className="font-semibold">{total}</span> colis au total
            </p>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportSuccess={handleBulkImportSuccess}
        existingPseudos={pseudos}
        existingShippingMarks={shippingMarks}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isVisible={isDeleteModalVisible}
        onConfirm={confirmDeleteMultiple}
        onCancel={cancelDeleteMultiple}
        itemCount={selectedItems.size}
      />

    </div>
  );
});

export default InventoryPage;