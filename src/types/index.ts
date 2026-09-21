export interface Package {
  id: string;
  trackingCode: string;
  pseudo: string;
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
  statut_contact?: 'Prospect' | 'Client Argent' | 'Client Or' | 'Client Platine';
  shipping_marks: ClientShippingMark[];
}

export type StatutDemandeAchat =
  | 'Nouveau'
  | 'En cours d\'analyse'
  | 'Action requise'
  | 'Devis Prêt'
  | 'Rejeté'
  | 'Payé'
  | 'Acheté';

export interface DemandeAchat {
  id: number;
  client_id: number;
  nom_article: string;
  photo_url?: string | null;
  lien_exemple?: string | null;
  quantite: number;
  remarques?: string | null;
  lien_achat_final?: string | null;
  prix_unitaire_rmb?: number | null;
  frais_port_locaux_rmb?: number | null;
  taux_change_achete?: number | null;
  taux_change_vendu?: number | null;
  poids_estime?: number | null;
  volume_cbm?: number | null;
  statut: StatutDemandeAchat;
  cree_par_id: string;
  assigne_a_id?: string | null;
  date_creation: string;
  date_traitement?: string | null;
  date_validation?: string | null;
  created_at: string;
  updated_at: string;
  client?: ClientWithShippingMarks;
  cree_par?: { user_id: string; full_name: string | null; email: string | null; profile_picture_url: string | null };
  assigne_a?: { user_id: string; full_name: string | null; email: string | null; profile_picture_url: string | null } | null;
  achat_articles?: { id: number; prix_unitaire_rmb: number | null; frais_port_locaux_rmb: number | null; quantite: number; tracking?: string | null }[];
}

export interface AchatArticle {
  id: number;
  demande_achat_id: number;
  nom_article: string;
  reference?: string | null;
  description?: string | null;
  lien_achat?: string | null;
  tracking?: string | null;
  photo_url?: string | null;
  prix_unitaire_rmb?: number | null;
  frais_port_locaux_rmb?: number | null;
  quantite: number;
  poids_estime?: number | null;
  volume_cbm?: number | null;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export interface NoteInterne {
  id: number;
  demande_achat_id: number;
  auteur_id: string;
  message: string;
  created_at: string;
  auteur?: { user_id: string; full_name: string | null; email: string | null; profile_picture_url: string | null };
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
  pseudo: string;
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

export interface CompanySettings {
  id: number;
  nom_entreprise: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string | null;
  num_stat: string | null;
  num_nif: string | null;
  num_rcs: string | null;
  logo_url: string | null;
  conditions_paiement: string | null;
  mentions_legales: string | null;
  signature_devis: string | null;
  upload_code: string;
  sourcing_fret_usd_cbm: number | null;
  sourcing_taux_usd_ar: number | null;
  sourcing_taux_rmb_ar: number | null;
  sourcing_taux_rmb_usd: number | null;
  sourcing_marge_1: number | null;
  sourcing_marge_2: number | null;
  sourcing_marge_3: number | null;
  created_at: string;
  updated_at: string;
}

export type PhotoTag = 'reception_marchandise' | 'constat_anomalie' | 'chargement_conteneur' | 'inventaire_depot';

export interface PhotoUpload {
  id: string;
  storage_path: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  folder_date: string;
  uploaded_at: string;
  tag: PhotoTag | null;
  label?: string | null;
  description?: string | null;
}

export interface ClientDeliveryGroup {
  client_id: number;
  pseudo: string;
  shipping_marks: string[];
  colis: InventoryItem[];
  delivery_receipts: DeliveryReceipt[];
}

export interface InventoryItem {
  id: number;
  bl: string;
  dateEntree: string;
  entrepot: string;
  pseudo?: string;
  shippingMark: string;
  description: string;
  nbPalettes: string;
  nbCartons: string;
  poids: string;
  volume: string;
  images: File[];
  statut: string;
  trackingNumber?: string;
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
  date_mise_disposition?: string;
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