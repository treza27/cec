import React from 'react';
import { ArrowLeft, Package, Calendar, Weight, Truck, Clock, MapPin, Ship, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabase';

interface NoDepartureDetailsViewProps {
  packages: InventoryItem[];
  onBack: () => void;
}

// Fonction pour obtenir le libellé client du statut
const getStatusLabel = (status: string): string => {
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

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'livre':
    case 'archive':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
    case 'arrive_antananarivo':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'en_attente_confirmation':
    case 'enregistre_chine':
    case 'charge_expedition':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Fonction pour obtenir la couleur et l'icône du statut
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'livre':
    case 'archive':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600'
      };
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600'
      };
    case 'arrive_antananarivo':
      return {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-600'
      };
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600'
      };
    case 'enregistre_chine':
    case 'charge_expedition':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-600'
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600'
      };
  }
};
export default function NoDepartureDetailsView({ packages, onBack }: NoDepartureDetailsViewProps) {
  const [supabaseImages, setSupabaseImages] = React.useState<{ [key: number]: any[] }>({});
  const [viewingImages, setViewingImages] = React.useState<{ images: any[], itemId: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const clientInfo = packages[0]; // Toutes les packages ont les mêmes infos client

  // Charger les images Supabase pour chaque colis
  React.useEffect(() => {
    const loadSupabaseImages = async () => {
      const imagePromises = packages.map(async (item) => {
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

    if (packages.length > 0) {
      loadSupabaseImages();
    }
  }, [packages]);

  const handleViewSupabaseImages = async (itemId: number) => {
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

  // Calculer les totaux
  const totals = packages.reduce((acc, pkg) => ({
    nbPalettes: acc.nbPalettes + (parseInt(pkg.nbPalettes) || 0),
    nbCartons: acc.nbCartons + (parseInt(pkg.nbCartons) || 0),
    poids: acc.poids + (parseFloat(pkg.poids) || 0),
    volume: acc.volume + (parseFloat(pkg.volume) || 0)
  }), { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 });

  return (
    <section className="py-8 sm:py-12 lg:py-20 bg-gradient-to-br from-blue-50 to-white min-h-screen">
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

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors duration-200 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Retour à la vue d'ensemble</span>
          </button>
        </div>

        {/* Message principal avec icône rassurante */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Ship className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Préparation en cours
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 px-2">
              Vos colis ne sont pas assignés à un départ pour le moment
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
              <div className="flex items-start gap-2 sm:gap-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-blue-800 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Que se passe-t-il maintenant ?</p>
                  <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                    Vos colis sont actuellement en entrepôt en Chine et seront bientôt assignés à un conteneur pour l'expédition vers Madagascar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations client simplifiées */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-500">Client</div>
                  <div className="font-medium text-sm sm:text-base truncate">{clientInfo.client_prenom}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques simplifiées */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totals.nbPalettes}</div>
              <div className="text-xs sm:text-sm text-blue-700">Palettes</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totals.nbCartons}</div>
              <div className="text-xs sm:text-sm text-blue-700">Cartons</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
              <Weight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totals.poids.toFixed(1)}</div>
              <div className="text-xs sm:text-sm text-blue-700">kg</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totals.volume.toFixed(1)}</div>
              <div className="text-xs sm:text-sm text-blue-700">m³</div>
            </div>
          </div>
        </div>

        {/* Liste des colis simplifiée */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>Vos colis en attente ({packages.length})</span>
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {packages.map((packageItem) => (
              <div
                key={packageItem.id}
                className="bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 hover:bg-gray-100 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                  {/* Informations principales */}
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                    {/* Icône et numéro */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`p-2 ${getStatusStyle(packageItem.statut).bgColor} rounded-lg border ${getStatusStyle(packageItem.statut).borderColor}`}>
                        <Package className={`w-4 h-4 ${getStatusStyle(packageItem.statut).iconColor}`} />
                      </div>
                      <span className="text-sm font-bold text-gray-900">{packageItem.id}</span>
                    </div>
                    
                    {/* Shipping mark */}
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {packageItem.shippingMark || 'Sans shipping mark'}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 truncate block" title={packageItem.description}>
                        {packageItem.description}
                      </span>
                    </div>
                    
                    {/* Statistiques compactes */}
                    <div className="flex items-center space-x-3 text-xs text-gray-600 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3 text-blue-600" />
                        <span>{packageItem.nbPalettes} pal.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3 text-blue-600" />
                        <span>{packageItem.nbCartons} cart.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Weight className="w-3 h-3 text-blue-600" />
                        <span>{packageItem.poids} kg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="w-3 h-3 text-blue-600" />
                        <span>{packageItem.volume} m³</span>
                      </div>
                    </div>
                    
                    {/* Icône image */}
                    {(supabaseImages[packageItem.id] || []).length > 0 && (
                      <button
                        onClick={() => handleViewSupabaseImages(packageItem.id)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-full shadow-lg border-2 border-white hover:scale-125 hover:shadow-xl transition-all duration-300 flex-shrink-0 animate-pulse hover:animate-none"
                        title={`Voir les ${(supabaseImages[packageItem.id] || []).length} image(s)`}
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Statut */}
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(packageItem.statut)} whitespace-nowrap`}>
                      {getStatusLabel(packageItem.statut)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}