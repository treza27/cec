import { supabase } from '../utils/supabase';
import { CatalogueCategorie } from './catalogueService';

export interface CatalogueFournisseur {
  id: string;
  numero: string | null;
  code_fournisseur: string | null;
  categorie_id: string | null;
  nom_usine: string;
  contact: string | null;
  telephone_wechat: string | null;
  ville: string | null;
  adresse: string | null;
  created_at: string;
  updated_at: string;
  catalogue_categories?: CatalogueCategorie;
}

const getFournisseurs = async (): Promise<CatalogueFournisseur[]> => {
  const { data, error } = await supabase
    .from('catalogue_fournisseurs')
    .select('*, catalogue_categories(*)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

const createFournisseur = async (payload: {
  categorie_id?: string | null;
  nom_usine: string;
  contact?: string;
  telephone_wechat?: string;
  ville?: string;
  adresse?: string;
}): Promise<CatalogueFournisseur> => {
  const { data, error } = await supabase
    .from('catalogue_fournisseurs')
    .insert(payload)
    .select('*, catalogue_categories(*)')
    .single();
  if (error) throw error;
  return data;
};

const updateFournisseur = async (
  id: string,
  payload: Partial<Omit<CatalogueFournisseur, 'id' | 'numero' | 'code_fournisseur' | 'created_at' | 'updated_at' | 'catalogue_categories'>>
): Promise<CatalogueFournisseur> => {
  const { data, error } = await supabase
    .from('catalogue_fournisseurs')
    .update(payload)
    .eq('id', id)
    .select('*, catalogue_categories(*)')
    .single();
  if (error) throw error;
  return data;
};

const deleteFournisseur = async (id: string): Promise<void> => {
  const { error } = await supabase.from('catalogue_fournisseurs').delete().eq('id', id);
  if (error) throw error;
};

export const fournisseurService = {
  getFournisseurs,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
};
