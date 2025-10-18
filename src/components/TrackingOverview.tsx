import React from 'react';
import { ArrowLeft, Package, Calendar, MapPin, Weight, Truck, Eye, CheckCircle, Clock, AlertTriangle, Ship, Users, Image as ImageIcon, ChevronLeft, ChevronRight, X, Archive } from 'lucide-react';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabase';
import { getDepartureProgressPercentage } from '../utils/statusHelpers';

interface TrackingOverviewProps {
  packages: InventoryItem[];
  onSelectDeparture: (departId: number) => void;
  onSelectNoDepartureGroup: (packages: InventoryItem[]) => void;
  onBack: () => void;
}

// Interface pour un groupe de départ
interface DepartureGroup {
  departId: number | null;
  bl: string;
  numTC?: string;
  packages: InventoryItem[];
  totalWeight: number;
  totalVolume: number;
  totalPallets: number;
  totalBoxes: number;
  globalStatus: string;
  globalProgress: number;
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

// Fonction pour obtenir la couleur et l'icône du statut
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'livre':
    case 'archive':
      return {
        icon: CheckCircle,
        iconColor: 'text-green-600'
      };
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
      return {
        icon: Truck,
        iconColor: 'text-blue-600'
      };
    case 'arrive_antananarivo':
      return {
        icon: MapPin,
        iconColor: 'text-purple-600'
      };
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return {
        icon: Clock,
        iconColor: 'text-orange-600'
      };
    case 'enregistre_chine':
    case 'charge_expedition':
      return {
        icon: Package,
        iconColor: 'text-gray-600'
      };
    default:
      return {
        icon: AlertTriangle,
        iconColor: 'text-gray-600'
      };
  }
};

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'livre':
    case 'archive':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'arrive_antananarivo':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'enregistre_chine':
    case 'charge_expedition':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Fonction pour calculer le pourcentage de progression
const getProgressPercentage = (status: string): number => {
  // Si le colis est archivé, la progression est à 100%
  if (status === 'archive') {
    return 100;
  }
  
  const statusProgress: Record<string, number> = {
    'en_attente_confirmation': 5,
    'enregistre_chine': 15,
    'charge_expedition': 25,
    'en_route_madagascar': 45,
    'arrive_toamasina': 65,
    'dedouanement_cours': 75,
    'arrive_antananarivo': 85,
    'pret_livraison_enlevement': 90,
    'en_cours_livraison': 95,
    'livre': 100
  };
  return statusProgress[status] || 0;
};

// Fonction pour déterminer le statut global d'un groupe de colis
const getGlobalStatus = (packages: InventoryItem[]): string => {
  // Si tous les colis sont livrés ou archivés
  if (packages.every(pkg => ['livre', 'archive'].includes(pkg.statut))) {
    return 'livre';
  }
  
  // Si au moins un colis est en cours de livraison
  if (packages.some(pkg => ['en_cours_livraison', 'pret_livraison_enlevement'].includes(pkg.statut))) {
    return 'en_cours_livraison';
  }
  
  // Prendre le statut le plus avancé
  const statusOrder = [
    'en_attente_confirmation',
    'enregistre_chine',
    'charge_expedition',
    'en_route_madagascar',
    'arrive_toamasina',
    'dedouanement_cours',
    'arrive_antananarivo',
    'pret_livraison_enlevement',
    'en_cours_livraison',
    'livre',
    'archive'
  ];
  
  let maxStatusIndex = 0;
  packages.forEach(pkg => {
    const statusIndex = statusOrder.indexOf(pkg.statut);
    if (statusIndex > maxStatusIndex) {
      maxStatusIndex = statusIndex;
    }
  });
  
  return statusOrder[maxStatusIndex];
};

// Fonction pour calculer la progression globale d'un groupe
const getGlobalProgress = (packages: InventoryItem[]): number => {
  const totalProgress = packages.reduce((sum, pkg) => sum + getProgressPercentage(pkg.statut), 0);
  return Math.round(totalProgress / packages.length);
};

export default function TrackingOverview({ packages, onSelectDeparture, onSelectNoDepartureGroup, onBack }: TrackingOverviewProps) {

  const [supabaseImages, setSupabaseImages] = React.useState<{ [key: number]: any[] }>({});
  const [viewingImages, setViewingImages] = React.useState<{ images: any[], itemId: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<'active' | 'archived'>('active');

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

  // Regrouper les colis par départ (BL)
  const groupPackagesByDeparture = (): DepartureGroup[] => {
    const groups: { [key: string]: DepartureGroup } = {};
    
    packages.forEach(pkg => {
      // Utiliser l'ID du départ comme clé de regroupement
      const departId = pkg.id_depart;
      const groupKey = departId ? `depart-${departId}` : 'sans-depart';
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          departId: departId || null,
          bl: pkg.bl || '',
          numTC: pkg.numTC,
          packages: [],
          totalWeight: 0,
          totalVolume: 0,
          totalPallets: 0,
          totalBoxes: 0,
          globalStatus: '',
          globalProgress: 0
        };
      }
      
      groups[groupKey].packages.push(pkg);
      groups[groupKey].totalWeight += parseFloat(pkg.poids) || 0;
      groups[groupKey].totalVolume += parseFloat(pkg.volume) || 0;
      groups[groupKey].totalPallets += parseInt(pkg.nbPalettes) || 0;
      groups[groupKey].totalBoxes += parseInt(pkg.nbCartons) || 0;
      
      // Utiliser le numTC du premier colis qui en a un
      if (pkg.numTC && !groups[groupKey].numTC) {
        groups[groupKey].numTC = pkg.numTC;
      }
    });
    
    // Calculer le statut et la progression globale pour chaque groupe
    Object.values(groups).forEach(group => {
      console.log('🔍 DIAGNOSTIC - Groupe:', {
        departId: group.departId,
        bl: group.bl,
        nbColis: group.packages.length,
        numTC: group.numTC
      });
      
      if (group.departId) {
        // Pour les groupes avec un départ, utiliser le statut et la progression du départ
        // Utiliser le statut du départ depuis les colis
        const departStatus = group.packages.find(pkg => pkg.depart_statut)?.depart_statut;
        
        if (departStatus) {
          group.globalStatus = departStatus;
          group.globalProgress = getDepartureProgressPercentage(departStatus);
        } else {
          // Fallback si le départ n'est pas trouvé
          group.globalStatus = getGlobalStatus(group.packages);
          group.globalProgress = getGlobalProgress(group.packages);
        }
      } else {
        // Pour les groupes sans départ, utiliser la logique basée sur les colis
        group.globalStatus = getGlobalStatus(group.packages);
        group.globalProgress = getGlobalProgress(group.packages);
      }
    });
    
    return Object.values(groups).sort((a, b) => {
      // Les groupes sans départ viennent en dernier
      if (a.departId === null && b.departId === null) return 0;
      if (a.departId === null) return 1;
      if (b.departId === null) return -1;

      // Trier par ID de départ en ordre croissant
      return a.departId - b.departId;
    });
  };

  const departureGroups = groupPackagesByDeparture();

  // Séparer les groupes de départs en actifs et archivés
  const activeDepartureGroups = departureGroups.filter(group => group.globalStatus !== 'archive');
  const archivedDepartureGroups = departureGroups.filter(group => group.globalStatus === 'archive');

  // Déterminer quels groupes afficher selon l'onglet actif
  const displayedDepartureGroups = activeTab === 'active' ? activeDepartureGroups : archivedDepartureGroups;

  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Modal de visualisation des images */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                Images du colis ({currentImageIndex + 1}/{viewingImages.images.length})
              </h3>
              <button
                onClick={closeImageViewer}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {viewingImages && viewingImages.images.length > 0 && (
                <div className="space-y-6">
                  <div className="relative bg-gray-50 rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
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
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={currentImageIndex === viewingImages.images.length - 1}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-800">
                      {viewingImages.images[currentImageIndex]?.file_name || 'Image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {viewingImages.images[currentImageIndex]?.file_size ? 
                        (viewingImages.images[currentImageIndex].file_size / 1024 / 1024).toFixed(2) + ' MB' : 
                        'Taille inconnue'
                      }
                    </p>
                  </div>

                  {viewingImages.images.length > 1 && (
                    <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
                      {viewingImages.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-3 transition-all duration-300 ${
                            index === currentImageIndex 
                              ? 'border-blue-500 ring-4 ring-blue-200 scale-110' 
                              : 'border-gray-200 hover:border-gray-300 hover:scale-105'
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

            <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeImageViewer}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header amélioré */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-all duration-200 hover:translate-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Nouvelle recherche</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900">
                    Vos colis{clientInfo.client_prenom && `, ${clientInfo.client_prenom}`}
                  </h1>
                  {clientInfo.client_entreprise && (
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <span className="text-sm font-semibold text-blue-700">{clientInfo.client_entreprise}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistiques redessinées */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {packages.filter(p => ['en_attente_confirmation', 'enregistre_chine', 'charge_expedition'].includes(p.statut)).length}
                    </div>
                    <div className="text-sm font-medium text-blue-700">En préparation</div>
                  </div>
                  <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center shadow-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-orange-600 mb-1">
                      {packages.filter(p => ['en_route_madagascar', 'arrive_toamasina', 'dedouanement_cours', 'arrive_antananarivo', 'pret_livraison_enlevement', 'en_cours_livraison'].includes(p.statut)).length}
                    </div>
                    <div className="text-sm font-medium text-orange-700">En transit</div>
                  </div>
                  <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center shadow-md">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {packages.filter(p => ['livre', 'archive'].includes(p.statut)).length}
                    </div>
                    <div className="text-sm font-medium text-green-700">Livrés</div>
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center shadow-md">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets pour séparer les départs actifs et archivés */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'active'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Ship className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Départs en cours</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {activeDepartureGroups.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'archived'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Marchandises déjà livrées</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'archived'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {archivedDepartureGroups.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Groupes de départ redessinés */}
        <div className="space-y-4">
          {displayedDepartureGroups.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/60 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'active' ? (
                  <Ship className="w-8 h-8 text-gray-400" />
                ) : (
                  <Archive className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'active' ? 'Aucun départ en cours' : 'Aucune marchandise archivée'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'active'
                  ? 'Tous vos départs sont déjà livrés.'
                  : 'Aucun départ n\'a encore été archivé.'}
              </p>
            </div>
          ) : (
            displayedDepartureGroups.map((group, groupIndex) => {
            const globalStatusStyle = getStatusStyle(group.globalStatus);
            const StatusIcon = globalStatusStyle.icon;
            return (
              <div key={groupIndex} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/60 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Header du groupe redessiné */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Partie gauche : Icône + Titre + TC */}
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-md border border-gray-200/50 flex-shrink-0">
                        <Ship className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">
                          {group.departId ? `Départ ${group.departId}` : 'Colis sans départ'}
                        </h3>
                        {group.numTC && (
                          <p className="text-xs sm:text-sm text-blue-600 font-semibold truncate">Conteneur: {group.numTC}</p>
                        )}
                        <p className="text-xs text-gray-500">{group.packages.length} colis</p>
                      </div>
                    </div>

                    {/* Partie centrale : Statistiques - cachées sur mobile, visibles sur desktop */}
                    <div className="hidden xl:flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">{group.totalPallets}</span>
                        <span className="text-xs text-gray-600">pal.</span>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                        <Package className="w-3.5 h-3.5 text-orange-600" />
                        <span className="text-xs font-bold text-orange-700">{group.totalBoxes}</span>
                        <span className="text-xs text-gray-600">cart.</span>
                      </div>
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                        <Weight className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">{group.totalWeight.toFixed(1)}kg</span>
                      </div>
                      <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-700">{group.totalVolume.toFixed(1)}m³</span>
                      </div>
                    </div>

                    {/* Partie droite : Statut + Progression + Bouton */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      {/* Progression + Statut */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Progression redessinée */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 shadow-inner min-w-[80px]">
                            <div
                              className="h-2.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 via-blue-600 to-blue-600 shadow-sm"
                              style={{ width: `${group.globalProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-800 min-w-[2.5rem] text-right flex-shrink-0">{group.globalProgress}%</span>
                        </div>

                        {/* Statut coloré */}
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(group.globalStatus)} whitespace-nowrap flex-shrink-0`}>
                          {getStatusLabel(group.globalStatus)}
                        </span>
                      </div>

                      {/* Bouton détails redessiné */}
                      <button
                        onClick={() => {
                          if (group.departId) {
                            onSelectDeparture(group.departId);
                          } else {
                            onSelectNoDepartureGroup(group.packages);
                          }
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg flex-shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Détails</span>
                      </button>
                    </div>
                  </div>

                  {/* Statistiques mobiles redessinées */}
                  <div className="xl:hidden mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Package className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-bold text-blue-700">{group.totalPallets}</span>
                        </div>
                        <span className="text-xs text-gray-600 block text-center">Pal.</span>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Package className="w-3 h-3 text-orange-600" />
                          <span className="text-xs font-bold text-orange-700">{group.totalBoxes}</span>
                        </div>
                        <span className="text-xs text-gray-600 block text-center">Cart.</span>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Weight className="w-3 h-3 text-purple-600" />
                          <span className="text-xs font-bold text-purple-700">{group.totalWeight.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-gray-600 block text-center">kg</span>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Truck className="w-3 h-3 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-700">{group.totalVolume.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-gray-600 block text-center">m³</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Liste des colis redessinée */}
                <div className="p-4">
                  <div className="space-y-2">
                    {group.packages.map((packageItem) => {
                      const packageStatusStyle = getStatusStyle(packageItem.statut);
                      const PackageStatusIcon = packageStatusStyle.icon;
                      const progress = getProgressPercentage(packageItem.statut);

                      return (
                        <div
                          key={packageItem.id}
                          className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-3 hover:bg-white hover:border-blue-300/50 hover:shadow-sm transition-all duration-200"
                        >
                          {/* Layout responsive pour mobile et desktop */}
                          <div className="flex flex-col gap-2">
                            {/* Première ligne : Icône + ID + Shipping Mark + Statut + Images */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <div className="p-1 sm:p-1.5 bg-gray-50 rounded-md border border-gray-200 flex-shrink-0">
                                  <PackageStatusIcon className={`w-3 h-3 ${packageStatusStyle.iconColor}`} />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-gray-900">#{packageItem.id}</span>
                                <span className="text-xs sm:text-sm font-semibold text-blue-600">
                                  {packageItem.shippingMark || 'Sans SM'}
                                </span>
                              </div>

                              {/* Statut + Images */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Statut */}
                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(packageItem.statut)} whitespace-nowrap`}>
                                  {getStatusLabel(packageItem.statut)}
                                </span>

                                {/* Bouton images si disponibles */}
                                {supabaseImages[packageItem.id] && supabaseImages[packageItem.id].length > 0 && (
                                  <button
                                    onClick={() => handleViewSupabaseImages(packageItem.id)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                                    title="Voir les images"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>{supabaseImages[packageItem.id].length}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Deuxième ligne : Description */}
                            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              {packageItem.description}
                            </div>

                            {/* Troisième ligne : Détails techniques - TOUJOURS visible */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{packageItem.nbPalettes} pal.</span>
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{packageItem.nbCartons} cart.</span>
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{packageItem.poids} kg</span>
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{packageItem.volume} m³</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
          )}
        </div>
      </div>
    </section>
  );
}