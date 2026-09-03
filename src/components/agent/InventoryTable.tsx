import React, { useState } from 'react';
import { Search, CreditCard as Edit, Check, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { PackageStatus, InventoryItem, DepartureStatus } from '../../types';
import { supabase } from '../../utils/supabase';
import SimpleImageUpload from './SimpleImageUpload';
// Fonction pour obtenir le libellé client du statut
const getPackageStatusLabel = (status: string): string => {
  const statusLabels: Record<PackageStatus, string> = {
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
  return statusLabels[status as PackageStatus] || status;
};

// Fonction pour obtenir la couleur de l'entrepôt
const getEntrepotColor = (entrepot: string): string => {
  switch (entrepot) {
    case 'Guangzhou':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Yiwu':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Fonction pour obtenir la couleur du statut (même logique que DepartsPage)
const getInventoryStatusColor = (status: string): string => {
  switch (status) {
    case 'livre':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'arrive_antananarivo':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'en_route_madagascar':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'charge_expedition':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'enregistre_chine':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  onUpdateItem?: (id: number, updatedItem: InventoryItem) => void;
  onDeleteItem?: (id: number) => void;
  isPackageAssociatedToActiveDepart: (packageId: number) => boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

// Fonction pour calculer le WFI
const calculateWFI = (volume: string, poids: string): string => {
  const vol = parseFloat(volume);
  const weight = parseFloat(poids);
  
  if (!vol || !weight || vol <= 0 || weight <= 0) {
    return '-';
  }
  
  const wfi = (weight / 28000) / (vol / 65);
  return wfi.toFixed(3);
};

// Fonction pour obtenir la couleur du WFI avec dégradé
const getWFIColor = (wfiValue: string): string => {
  if (wfiValue === '-') return 'text-gray-500';
  
  const wfi = parseFloat(wfiValue);
  if (isNaN(wfi)) return 'text-gray-500';
  
  if (wfi < 1) {
    // Vert avec intensité basée sur la distance à 1
    const intensity = Math.min(1, (1 - wfi) * 2); // Plus c'est loin de 1, plus c'est intense
    if (intensity > 0.8) return 'text-green-800';
    if (intensity > 0.6) return 'text-green-700';
    if (intensity > 0.4) return 'text-green-600';
    if (intensity > 0.2) return 'text-green-500';
    return 'text-green-400';
  } else if (wfi > 1) {
    // Rouge avec intensité basée sur la distance à 1
    const intensity = Math.min(1, (wfi - 1) * 0.5); // Plus c'est loin de 1, plus c'est intense
    if (intensity > 0.8) return 'text-red-800';
    if (intensity > 0.6) return 'text-red-700';
    if (intensity > 0.4) return 'text-red-600';
    if (intensity > 0.2) return 'text-red-500';
    return 'text-red-400';
  } else {
    return 'text-gray-900'; // Exactement 1
  }
};

export default function InventoryTable({ inventoryItems, onUpdateItem, onAddItem, isAddingNew, onCancelAdd, isPackageAssociatedToActiveDepart, onDeleteItem }: InventoryTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  // Debug: Log des items reçus
  React.useEffect(() => {
    console.log('📋 InventoryTable - Items reçus:', inventoryItems);
    console.log('📋 InventoryTable - Nombre d\'items:', inventoryItems.length);
  }, [inventoryItems]);
  
  const [viewingImages, setViewingImages] = useState<{ images: File[], itemId: number } | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<{ [key: number]: boolean }>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newItem, setNewItem] = useState<InventoryItem>({
    id: 0,
    bl: '',
    dateEntree: new Date().toISOString().split('T')[0],
    entrepot: '',
    pseudo: '',
    shippingMark: '',
    description: '',
    nbPalettes: '0',
    nbCartons: '1',
    poids: '',
    volume: '',
    images: [],
    statut: 'enregistre_chine'
  });
  const [supabaseImages, setSupabaseImages] = useState<{ [key: number]: any[] }>({});

  // Fonction pour charger les images d'un item spécifique
  const loadSupabaseImagesForItem = async (itemId: number) => {
    try {
      const { data, error } = await supabase
        .from('package_images')
        .select('*')
        .eq('inventaire_id', itemId)
        .eq('image_type', 'general')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setSupabaseImages(prev => ({
          ...prev,
          [itemId]: data
        }));
      }
    } catch (error) {
      console.error('Erreur chargement images:', error);
    }
  };

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

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditingItem({ ...item });
  };

  const handleSave = () => {
    if (editingItem && editingId) {
      onUpdateItem(editingId, editingItem);
      setEditingId(null);
      setEditingItem(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingItem(null);
  };

  const handleViewSupabaseImages = async (itemId: number) => {
    const images = supabaseImages[itemId] || [];
    if (images.length === 0) return;

    // Créer des URLs signées pour toutes les images
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        try {
          const { data, error } = await supabase.storage
            .from('package-images')
            .createSignedUrl(image.file_path, 3600);
          
          if (data) {
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
    setViewingImages({ images: validImages, itemId });
    setCurrentImageIndex(0);
  };

  const closeImageViewer = () => {
    setViewingImages(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (viewingImages && currentImageIndex < viewingImages.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleSaveNew = () => {
    if (newItem.bl && newItem.description && newItem.poids && newItem.volume) {
      const itemToAdd = {
        ...newItem,
        id: inventoryItems.length > 0 ? Math.max(...inventoryItems.map(item => item.id)) + 1 : 1
      };
      onAddItem(itemToAdd);
      setNewItem({
        id: 0,
        bl: '',
        dateEntree: new Date().toISOString().split('T')[0],
        entrepot: '',
        pseudo: '',
        shippingMark: '',
        description: '',
        nbPalettes: '0',
        nbCartons: '1',
        poids: '',
        volume: '',
        images: [],
        statut: 'En attente de livraison'
      });
    }
  };

  const handleCancelNew = () => {
    setNewItem({
      id: 0,
      bl: '',
      dateEntree: new Date().toISOString().split('T')[0],
      entrepot: '',
      pseudo: '',
      shippingMark: '',
      description: '',
      nbPalettes: '0',
      nbCartons: '1',
      poids: '',
      volume: '',
      nature: '',
      msds: false,
      images: [],
      statut: 'enregistre_chine'
    });
    onCancelAdd();
  };

  const handleNewItemChange = (field: keyof InventoryItem, value: string | boolean | File[]) => {
    setNewItem({ ...newItem, [field]: value });
  };

  const handleInputChange = (field: keyof InventoryItem, value: string | boolean | File[]) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };

  const handleImageUpload = (files: FileList | null, isNew: boolean = false) => {
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (isNew) {
        handleNewItemChange('images', [...newItem.images, ...imageFiles]);
      } else if (editingItem) {
        handleInputChange('images', [...editingItem.images, ...imageFiles]);
      }
    }
  };

  const removeImage = (index: number, isNew: boolean = false) => {
    if (isNew) {
      const updatedImages = newItem.images.filter((_, i) => i !== index);
      handleNewItemChange('images', updatedImages);
    } else if (editingItem) {
      const updatedImages = editingItem.images.filter((_, i) => i !== index);
      handleInputChange('images', updatedImages);
    }
  };

  const renderEditableCell = (field: keyof InventoryItem, value: any, type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'images' = 'text', options?: string[], isNew: boolean = false) => {
    // Déclarer editValue au début pour éviter les erreurs d'initialisation
    const editValue = isNew ? newItem[field] : editingItem?.[field];
    
    const currentItem = inventoryItems.find(item => item.id === editingId);
    const isStatusField = field === 'statut';
    const isAssociatedToActiveDepart = currentItem ? isPackageAssociatedToActiveDepart(currentItem.id) : false;
    
    if (!isNew && (editingId === null || !editingItem || !currentItem)) {
      // Mode lecture
      if (field === 'dateEntree' && value) {
        return new Date(value).toLocaleDateString('fr-FR');
      }
      if (field === 'poids' && value) {
        return `${value} kg`;
      }
      if (field === 'volume' && value) {
        return `${value} m³`;
      }
      if (field === 'images') {
        const images = value as File[];
        return (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              {images.length} image{images.length > 1 ? 's' : ''}
            </span>
            {images.length > 0 && (
              <button 
                onClick={() => handleViewImages(images, inventoryItems.find(item => item.id === editingId)?.id || 0)}
                className="text-blue-600 hover:text-blue-900 text-xs flex items-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                Voir
              </button>
            )}
          </div>
        );
      }
      if (field === 'statut') {
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === 'livre' ? 'bg-green-100 text-green-800' :
            value === 'en_route_madagascar' ? 'bg-yellow-100 text-yellow-800' :
            value === 'pret_livraison_enlevement' ? 'bg-blue-100 text-blue-800' :
            value === 'en_cours_livraison' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getPackageStatusLabel(value)}
            {isAssociatedToActiveDepart && (
              <span className="ml-1 text-xs opacity-75">(Auto)</span>
            )}
          </span>
        );
      }
      return value || '-';
    }

    // Si c'est le champ statut et que le colis est associé à un départ actif, désactiver l'édition
    if (isStatusField && !isNew && isAssociatedToActiveDepart) {
      return (
        <div className="flex items-center space-x-2">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            editValue === 'livre' ? 'bg-green-100 text-green-800' :
            editValue === 'en_route_madagascar' ? 'bg-yellow-100 text-yellow-800' :
            editValue === 'pret_livraison_enlevement' ? 'bg-blue-100 text-blue-800' :
            editValue === 'en_cours_livraison' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getPackageStatusLabel(editValue as string)}
          </span>
          <span className="text-xs text-orange-600 font-medium">
            🔒 Géré par le départ
          </span>
        </div>
      );
    }

    // Mode édition
    if (type === 'images') {
      return (
        <div className="w-full min-w-[200px]">
          <SimpleImageUpload
            inventaireId={isNew ? 0 : (editingItem?.id || 0)}
            imageType="general"
            onImagesChange={(count) => {
              // Recharger les images Supabase après upload
              if (!isNew && editingItem?.id) {
                loadSupabaseImagesForItem(editingItem.id);
              }
            }}
            maxImages={5}
            className="text-xs"
          />
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <select
          value={editValue as string}
          onChange={(e) => isNew ? handleNewItemChange(field, e.target.value) : handleInputChange(field, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={editValue as boolean}
          onChange={(e) => isNew ? handleNewItemChange(field, e.target.checked) : handleInputChange(field, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      );
    }

    return (
      <input
        type={type}
        value={editValue as string}
        onChange={(e) => isNew ? handleNewItemChange(field, e.target.value) : handleInputChange(field, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        step={type === 'number' ? '0.001' : undefined}
        min={type === 'number' ? '0' : undefined}
      />
    );
  };

  return (
    <>
      {/* Modal de visualisation des images */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Header du modal */}
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

            {/* Contenu du modal */}
            <div className="p-6">
              {viewingImages && viewingImages.images.length > 0 && (
                <div className="space-y-4">
                  {/* Image principale */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                    <img
                      src={viewingImages.images[currentImageIndex]?.signedUrl || ''}
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain max-h-96"
                    />
                    
                    {/* Boutons de navigation */}
                    {viewingImages.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={currentImageIndex === 0}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={currentImageIndex === viewingImages.images.length - 1}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Nom du fichier */}
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

                  {/* Miniatures */}
                  {viewingImages.images.length > 1 && (
                    <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
                      {viewingImages.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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

            {/* Footer du modal */}
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

      <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un colis..."
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">N°</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">BL</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date entrée</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tracking Number</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Entrepôt</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">PSEUDO</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Shipping Mark</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nb Palettes</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nb Cartons</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Poids</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Volume</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">WFI</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Images</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Statut</th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventoryItems.map((item) => (
              <tr key={item.id} className={editingId === item.id ? 'bg-blue-50' : ''}>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('bl', editingItem?.bl || item.bl) : (item.bl || '-')}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('dateEntree', editingItem?.dateEntree || item.dateEntree, 'date') : (
                    item.dateEntree ? new Date(item.dateEntree).toLocaleDateString('fr-FR') : '-'
                  )}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm">
                  {editingId === item.id ? renderEditableCell('entrepot', editingItem?.entrepot || item.entrepot, 'select', ['Guangzhou', 'Yiwu']) : (
                    item.entrepot ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEntrepotColor(item.entrepot)}`}>
                        {item.entrepot}
                      </span>
                    ) : '-'
                  )}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('pseudo', editingItem?.pseudo || item.pseudo) : (item.pseudo || '-')}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editingItem?.shippingMark || ''}
                        onChange={(e) => handleInputChange('shippingMark', e.target.value)}
                        list={`shipping-marks-edit-${item.id}`}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Shipping mark..."
                      />
                      <datalist id={`shipping-marks-edit-${item.id}`}>
                        {/* Les shipping marks seront injectées via le hook useClients */}
                      </datalist>
                    </>
                  ) : (item.shippingMark || '-')}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('description', editingItem?.description || item.description) : item.description}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('nbPalettes', editingItem?.nbPalettes || item.nbPalettes, 'number') : item.nbPalettes}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('nbCartons', editingItem?.nbCartons || item.nbCartons, 'number') : item.nbCartons}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('poids', editingItem?.poids || item.poids, 'number') : `${item.poids} kg`}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('volume', editingItem?.volume || item.volume, 'number') : `${parseFloat(String(item.volume)).toFixed(3)} m³`}
                </td>
                <td className={`px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold ${getWFIColor(calculateWFI(editingId === item.id && editingItem ? editingItem.volume : item.volume, editingId === item.id && editingItem ? editingItem.poids : item.poids))}`}>
                  {calculateWFI(editingId === item.id && editingItem ? editingItem.volume : item.volume,
                               editingId === item.id && editingItem ? editingItem.poids : item.poids)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {editingId === item.id ? renderEditableCell('images', editingItem?.images || item.images, 'images') : (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600"> 
                        {(supabaseImages[item.id] || []).length} image{(supabaseImages[item.id] || []).length > 1 ? 's' : ''}
                      </span>
                      {(supabaseImages[item.id] || []).length > 0 && (
                        <button 
                          onClick={() => handleViewSupabaseImages(item.id)}
                          className="text-blue-600 hover:text-blue-900 text-xs flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Voir</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                  {editingId === item.id ? (
                    renderEditableCell('statut', editingItem?.statut || item.statut, 'select', [
                        'enregistre_chine',
                        'charge_expedition',
                        'en_route_madagascar',
                        'arrive_toamasina',
                        'dedouanement_cours',
                        'arrive_antananarivo',
                        'pret_livraison_enlevement',
                        'en_cours_livraison',
                        'livre'
                      ])
                  ) : (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getInventoryStatusColor(item.statut)}`}>
                      {getPackageStatusLabel(item.statut)}
                    </span>
                  )}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                  {editingId === item.id ? (
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Sauver</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* Nouvelle ligne pour ajouter un colis */}
            {isAddingNew && (
              <tr className="bg-green-50 border-2 border-green-200">
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Nouveau</td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('bl', newItem.bl, 'text', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('dateEntree', newItem.dateEntree, 'date', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm">
                  {renderEditableCell('entrepot', newItem.entrepot, 'select', ['Guangzhou', 'Yiwu'], true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('pseudo', newItem.pseudo, 'text', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  <>
                    <input
                      type="text"
                      value={newItem.shippingMark}
                      onChange={(e) => handleNewItemChange('shippingMark', e.target.value)}
                      list="shipping-marks-new"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Shipping mark..."
                    />
                    <datalist id="shipping-marks-new">
                      {/* Les shipping marks seront injectées via le hook useClients */}
                    </datalist>
                  </>
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('description', newItem.description, 'text', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('nbPalettes', newItem.nbPalettes, 'number', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('nbCartons', newItem.nbCartons, 'number', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('poids', newItem.poids, 'number', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('volume', newItem.volume, 'number', undefined, true)}
                </td>
                <td className={`px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold ${getWFIColor(calculateWFI(newItem.volume, newItem.poids))}`}>
                  {calculateWFI(newItem.volume, newItem.poids)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {renderEditableCell('images', newItem.images, 'images', undefined, true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                  {renderEditableCell('statut', newItem.statut, 'select', [
                    'enregistre_chine',
                    'charge_expedition',
                    'en_route_madagascar',
                    'arrive_toamasina',
                    'dedouanement_cours',
                    'arrive_antananarivo',
                    'pret_livraison_enlevement',
                    'en_cours_livraison',
                    'livre'
                  ], true)}
                </td>
                <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    <button
                      onClick={handleSaveNew}
                      className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                    <button
                      onClick={handleCancelNew}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    </>
  );
}