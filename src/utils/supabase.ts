import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      depart: {
        Row: {
          id: number;
          num_bl: string;
          num_tc: string | null;
          nb_palettes_total: number | null;
          nb_cartons_total: number | null;
          poids_total: number | null;
          volume_total: number | null;
          statut: string | null;
          date_chargement: string | null;
          date_depart_chine: string | null;
          date_arrivee_tamatave: string | null;
          date_arrivee_tana: string | null;
          date_reception_colis: string | null;
          colis_associes: number[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: never;
          num_bl: string;
          num_tc?: string | null;
          nb_palettes_total?: number | null;
          nb_cartons_total?: number | null;
          poids_total?: number | null;
          volume_total?: number | null;
          statut?: string | null;
          date_chargement?: string | null;
          date_depart_chine?: string | null;
          date_arrivee_tamatave?: string | null;
          date_arrivee_tana?: string | null;
          date_reception_colis?: string | null;
          colis_associes?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          num_bl?: string;
          num_tc?: string | null;
          nb_palettes_total?: number | null;
          nb_cartons_total?: number | null;
          poids_total?: number | null;
          volume_total?: number | null;
          statut?: string | null;
          date_chargement?: string | null;
          date_depart_chine?: string | null;
          date_arrivee_tamatave?: string | null;
          date_arrivee_tana?: string | null;
          date_reception_colis?: string | null;
          colis_associes?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      inventaire: {
        Row: {
          id: number;
          bl: string;
          date_entree: string;
          num_recu: string | null;
          entrepot: string | null;
          shipping_mark: string | null;
          description: string;
          nb_palettes: number | null;
          nb_cartons: number | null;
          poids: number;
          volume: number;
          nature: string | null;
          msds: boolean | null;
          statut: string | null;
          nb_palettes_tana: number | null;
          nb_cartons_tana: number | null;
          poids_tana: number | null;
          volume_tana: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          bl: string;
          date_entree?: string;
          num_recu?: string | null;
          entrepot?: string | null;
          shipping_mark?: string | null;
          description: string;
          nb_palettes?: number | null;
          nb_cartons?: number | null;
          poids: number;
          volume: number;
          nature?: string | null;
          msds?: boolean | null;
          statut?: string | null;
          nb_palettes_tana?: number | null;
          nb_cartons_tana?: number | null;
          poids_tana?: number | null;
          volume_tana?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          bl?: string;
          date_entree?: string;
          num_recu?: string | null;
          entrepot?: string | null;
          shipping_mark?: string | null;
          description?: string;
          nb_palettes?: number | null;
          nb_cartons?: number | null;
          poids?: number;
          volume?: number;
          nature?: string | null;
          msds?: boolean | null;
          statut?: string | null;
          nb_palettes_tana?: number | null;
          nb_cartons_tana?: number | null;
          poids_tana?: number | null;
          volume_tana?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      package_images: {
        Row: {
          id: string;
          inventaire_id: number;
          depart_id: number | null;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          image_type: string;
          uploaded_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          inventaire_id?: number | null;
          depart_id?: number | null;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          image_type: string;
          uploaded_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          inventaire_id?: number | null;
          depart_id?: number | null;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          image_type?: string;
          uploaded_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};