import { PackageStatus, DepartureStatus } from '../types';

// Libellés des statuts pour l'affichage
export const getPackageStatusLabel = (status: string): string => {
  const statusLabels: Record<PackageStatus, string> = {
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
  return statusLabels[status as PackageStatus] || status;
};

export const getDepartureStatusLabel = (status: DepartureStatus): string => {
  const statusLabels: Record<DepartureStatus, string> = {
    'preparation_depart': 'Préparation du départ',
    'conteneur_charge': 'Conteneur chargé',
    'depart_chine': 'Départ de Chine',
    'arrivee_toamasina': 'Arrivée à Toamasina',
    'dedouanement_en_cours': 'Dédouanement en cours',
    'arrivee_antananarivo': 'Arrivée à Antananarivo',
    'decharge_trie': 'Déchargé et trié',
    'archive': 'Archivé'
  };
  return statusLabels[status] || status;
};

// Couleurs des statuts
export const getInventoryStatusColor = (status: string): string => {
  switch (status) {
    case 'livre':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
    case 'arrive_antananarivo':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'en_attente_confirmation':
    case 'enregistre_chine':
    case 'charge_expedition':
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'archive':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getDepartureStatusColor = (status: DepartureStatus): string => {
  switch (status) {
    case 'decharge_trie': 
      return 'bg-green-100 text-green-800 border-green-200';
    case 'arrivee_antananarivo':
    case 'arrivee_toamasina':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preparation_depart':
    case 'conteneur_charge': 
    case 'depart_chine':
    case 'dedouanement_en_cours':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'archive':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getEntrepotColor = (entrepot: string): string => {
  switch (entrepot) {
    case 'Guangzhou':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Yiwu':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Mappage des statuts départ vers statuts colis
export const departureToPackageStatusMap: Record<DepartureStatus, PackageStatus> = {
  'preparation_depart': 'enregistre_chine',
  'conteneur_charge': 'charge_expedition',
  'depart_chine': 'en_route_madagascar',
  'arrivee_toamasina': 'arrive_toamasina',
  'dedouanement_en_cours': 'dedouanement_cours',
  'arrivee_antananarivo': 'arrive_antananarivo',
  'decharge_trie': 'pret_livraison_enlevement',
  'archive': 'archive'
};

// Fonction pour calculer le pourcentage de progression d'un départ
export const getDepartureProgressPercentage = (status: DepartureStatus): number => {
  const statusProgress: Record<DepartureStatus, number> = {
    'preparation_depart': 10,
    'conteneur_charge': 25,
    'depart_chine': 40,
    'arrivee_toamasina': 60,
    'dedouanement_en_cours': 75,
    'arrivee_antananarivo': 90,
    'decharge_trie': 100,
    'archive': 100
  };
  return statusProgress[status] || 0;
};