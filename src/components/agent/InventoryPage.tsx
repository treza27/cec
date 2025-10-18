import React, { useState, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Check, X, Eye, Package, Weight, Truck, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useClients } from '../../hooks/useClients';
import { InventoryFormData } from '../../schemas/inventorySchema';
import InventoryForm from '../forms/InventoryForm';
import InventoryStatistics from './InventoryStatistics';
import SimpleImageUpload from './SimpleImageUpload';
import { calculateWFI, getWFIColor } from '../../utils/calculations';
import { getInventoryStatusColor, getEntrepotColor, getNatureColor } from '../../utils/statusHelpers';
import { supabase } from '../../utils/supabase';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { useDebounce } from '../../hooks/useDebounce';

const InventoryPage = memo(function InventoryPage() {
  const { t } = useTranslation();
  const { profileData } = useEmployeeProfile();
  const { 
    items: inventoryItems, 
    loading, 
    error, 
    addItem, 
    updateItem,
    deleteItem,
    archiveItem,
    isAdding,
    isUpdating,
    isDeleting,
    isArchiving
  } = useInventory();
  const { shippingMarks } = useClients();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingImages, setViewingImages] = useState<{ images: any[], itemId: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [supabaseImages, setSupabaseImages] = useState<{ [key: number]: any[] }>({});

  // Debounce search term pour optimiser les performances
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Vérifier si l'utilisateur est un commercial (lecture seule)
  const isCommercial = profileData?.role === 'Commercial';

  // Charger les images Supabase pour chaque item
  React.useEffect(() => {
    const loadSupabaseImages = async () => {
      const imagePromises = inventoryItems.map(async (item) => {
        try {
          const { data, error } = await supabase
            .from('package_images')
            .select('*')
            .eq('inventaire_id', item.id)
            .eq('image_type', 'general')
            .order('created_at', { ascending: true });

          if (!error && data) {
            return { itemId: item.id, images: data };
          }
        } catch (error) {
          console.error('Erreur chargement images:', error);
        }
        return { itemId: item.id, images: [] };
      });

      const results = await Promise.all(imagePromises);
      const imageMap: { [key: number]: any[] } = {};
      results.forEach(result => {
        imageMap[result.itemId] = result.images;
      });
      setSupabaseImages(imageMap);
    };

    if (inventoryItems.length > 0) {
      loadSupabaseImages();
    }
  }, [inventoryItems]);

  const handleAddItem = useCallback(async (formData: InventoryFormData) => {
    try {
      await addItem(formData);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  }, [addItem, setIsAddingNew]);

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

  const handleInputChange = useCallback((field: string, value: any) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  }, [editingItem]);

  const handleViewSupabaseImages = useCallback(async (itemId: number) => {
    const images = supabaseImages[itemId] || [];
    if (images.length === 0) return;

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        try {
          const { data, error } = await supabase.storage
            .from('package-images')
            .createSignedUrl(image.file_path, 3600);
          
          if (data && !error) {
            return {
              ...image,
              signedUrl: data.signedUrl
            };
          }
        } catch (error) {
          console.error('Erreur création URL signée:', error);
        }
        return null;
      })
    );

    const validImages = imageUrls.filter(img => img !== null);
    if (validImages.length === 0) {
      console.warn('Aucune image valide trouvée pour le colis', itemId);
      return;
    }
    setViewingImages({ images: validImages, itemId });
    setCurrentImageIndex(0);
  }, [supabaseImages]);

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

  // Memoize filtered items pour éviter les recalculs inutiles
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item =>
      item.shippingMark?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.bl.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [inventoryItems, debouncedSearchTerm]);

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
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
        {!isCommercial && (
          <button 
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew || isAdding}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{isAddingNew || isAdding ? t('inventory.addingInProgress') : t('inventory.newPackage')}</span>
          </button>
        )}
      </div>

      {/* Statistiques */}
      <InventoryStatistics inventoryItems={inventoryItems} />

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par shipping mark, description ou BL..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAddingNew && !isCommercial && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-2 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('inventory.newPackage')}</h3>
          <InventoryForm
            onSubmit={handleAddItem}
            onCancel={() => setIsAddingNew(false)}
            isSubmitting={isAdding}
            submitLabel={t('inventory.form.addPackage')}
            shippingMarks={shippingMarks}
          />
        </div>
      )}

      {/* Tableau responsive */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BL (Auto)</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date entrée</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tracking</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entrepôt</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pal.</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart.</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Poids</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Volume</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">WFI</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Nature</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">MSDS</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Images</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`${editingId === item.id ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.bl ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.bl || 'Non assigné'}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
                      <input
                        type="text"
                        value={editingItem?.numRecu || ''}
                        onChange={(e) => handleInputChange('numRecu', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      item.numRecu || '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
                      <>
                        <input
                          type="text"
                          value={editingItem?.shippingMark || ''}
                          onChange={(e) => handleInputChange('shippingMark', e.target.value)}
                          list={`shipping-marks-${item.id}`}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Shipping mark..."
                        />
                        <datalist id={`shipping-marks-${item.id}`}>
                          {shippingMarks.map((mark) => (
                            <option key={mark} value={mark} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      item.shippingMark || '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell max-w-32">
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                    {editingId === item.id && !isCommercial ? (
                      <select
                        value={editingItem?.nature || ''}
                        onChange={(e) => handleInputChange('nature', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="GG">GG</option>
                        <option value="SG">SG</option>
                        <option value="DG">DG</option>
                      </select>
                    ) : (
                      item.nature ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getNatureColor(item.nature)}`}>
                          {item.nature}
                        </span>
                      ) : '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                    {editingId === item.id && !isCommercial ? (
                      <input
                        type="checkbox"
                        checked={editingItem?.msds || false}
                        onChange={(e) => handleInputChange('msds', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    ) : (
                      item.msds ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Oui
                        </span>
                      ) : null
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                    {editingId === item.id && !isCommercial ? (
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
                        {!isCommercial && (
                          <>
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
                          </>
                        )}
                        {isCommercial && (
                          <span className="text-xs text-gray-500 italic px-2 py-1">
                            Consultation seule
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && !isAddingNew && (
          <div className="text-center py-8 sm:py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun colis trouvé</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Aucun colis ne correspond à votre recherche.' : 'Commencez par ajouter votre premier colis.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default InventoryPage;