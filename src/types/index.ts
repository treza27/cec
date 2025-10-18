export interface Package {
  id: string;
  trackingCode: string;
  clientName: string;
  clientPhone: string;
  clientBirthDate: string;
  description: string;
  weight: number;
  registrationDate: string;
  estimatedArrival: string;
  currentStatus: PackageStatus;
  steps: PackageStep[];
  numTC?: string;
}

export interface PackageStep {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
  location: string;
  image?: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
  uploadDate: string;
}

export type PackageStatus = 
  | 'enregistre_chine'
  | 'charge_expedition'
  | 'en_route_madagascar'
  | 'arrive_toamasina'
  | 'dedouanement_cours'
  | 'arrive_antananarivo'
  | 'pret_livraison_enlevement'
  | 'en_cours_livraison'
  | 'livre'
  | 'archive';

export type DepartureStatus = 
  | 'preparation_depart'
  | 'conteneur_charge'
  | 'depart_chine'
  | 'arrivee_toamasina'
  | 'dedouanement_en_cours'
  | 'arrivee_antananarivo'
  | 'decharge_trie'
  | 'archive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'admin';
}

export interface Employee {
  user_id: string;
  full_name: string | null;
  email: string | null;
  telephone: string | null;
  role: string | null;
  departement: string | null;
  created_at: string;
  updated_at: string;
}

  client_id: number | null;
export interface ClientShippingMark {
  id: number;
  client_id: number;
  shipping_mark: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientWithShippingMarks {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone?: string;
  created_at?: string;
  updated_at?: string;
  shipping_marks: ClientShippingMark[];
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

export interface DeliveryReceipt {
  id: string;
  depart_id: number;
  client_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  colis_ids: number[];
  client_name: string;
  shipping_marks: string[];
}

export interface FaqItem {
  id: number;
  category: string;
  question_fr: string;
  answer_fr: string;
  question_en: string;
  answer_en: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface ClientDeliveryGroup {
  client_id: number;
  client_name: string;
  shipping_marks: string[];
  colis: InventoryItem[];
  delivery_receipts: DeliveryReceipt[];
}

export interface InventoryItem {
  id: number;
  bl: string;
  dateEntree: string;
  numRecu: string;
  entrepot: string;
  shippingMark: string;
  description: string;
  nbPalettes: string;
  nbCartons: string;
  poids: string;
  volume: string;
  nature: string;
  msds: boolean;
  images: File[];
  statut: string;
  // Valeurs mesurées au dépôt de Tana
  nbPalettesTana?: string;
  nbCartonsTana?: string;
  poidsTana?: string;
  volumeTana?: string;
  // Informations client pour le suivi
  client_id?: number;
  client_nom?: string;
  client_prenom?: string;
  client_pseudo?: string;
  client_entreprise?: string;
  client_phone?: string;
  numTC?: string;
  id_depart?: number | null;
  depart_statut?: string;
}

export interface DepartItem {
  id: number;
  numBL: string;
  numTC: string;
  nbPalettesTotal: number;
  nbCartonsTotal: number;
  poidsTotal: number;
  volumeTotal: number;
  statut: DepartureStatus;
  dateChargement: string;
  dateDepartChine: string;
  dateArriveTamatave: string;
  dateArriveTana: string;
  dateReceptionColis: string;
  imageChargement: string[];
  imageSuiviMaritime: string[];
  imageReceptionColis: string[];
  colisAssocies: number[];
}