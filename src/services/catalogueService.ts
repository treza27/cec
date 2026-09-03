import { supabase } from '../utils/supabase';
import { optimizeImage } from '../utils/imageOptimization';

export interface CatalogueCategorie {
  id: string;
  nom: string;
  description: string | null;
  code: string | null;
  ordre: number;
  photo_couverture: string | null;
  created_at: string;
}

export interface CatalogueSousCategorie {
  id: string;
  categorie_id: string;
  nom: string;
  code: string | null;
  ordre: number;
  created_at: string;
}

export interface CatalogueProduit {
  id: string;
  numero: number;
  reference_produit: string | null;
  categorie_id: string;
  sous_categorie_id: string | null;
  nom: string;
  description: string | null;
  code_fournisseur: string | null;
  prix_ariary: number;
  moq: number;
  prix_exw_rmb: number | null;
  prix_exw_usd: number | null;
  unite: string | null;
  quantite_par_unite: number | null;
  volume_par_unite: number | null;
  poids_par_unite: number | null;
  actif: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
  catalogue_categories?: CatalogueCategorie;
  catalogue_sous_categories?: CatalogueSousCategorie;
  catalogue_produit_photos?: CatalogueProduitPhoto[];
}

export interface CatalogueProduitPhoto {
  id: string;
  produit_id: string;
  file_path: string;
  ordre: number;
  created_at: string;
}

// Categories
const getCategories = async (): Promise<CatalogueCategorie[]> => {
  const { data, error } = await supabase
    .from('catalogue_categories')
    .select('*')
    .order('ordre', { ascending: true })
    .order('nom', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

const createCategorie = async (payload: { nom: string; description?: string; code?: string; ordre?: number }): Promise<CatalogueCategorie> => {
  const { data, error } = await supabase
    .from('catalogue_categories')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateCategorie = async (id: string, payload: Partial<Pick<CatalogueCategorie, 'nom' | 'description' | 'code' | 'ordre'>>): Promise<CatalogueCategorie> => {
  const { data, error } = await supabase
    .from('catalogue_categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteCategorie = async (id: string): Promise<void> => {
  const { error } = await supabase.from('catalogue_categories').delete().eq('id', id);
  if (error) throw error;
};

// Sous-catégories
const getSousCategories = async (categorieId?: string): Promise<CatalogueSousCategorie[]> => {
  let query = supabase
    .from('catalogue_sous_categories')
    .select('*')
    .order('ordre', { ascending: true })
    .order('nom', { ascending: true });
  if (categorieId) query = query.eq('categorie_id', categorieId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createSousCategorie = async (payload: { categorie_id: string; nom: string; code?: string; ordre?: number }): Promise<CatalogueSousCategorie> => {
  const { data, error } = await supabase
    .from('catalogue_sous_categories')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateSousCategorie = async (id: string, payload: Partial<Pick<CatalogueSousCategorie, 'nom' | 'code' | 'ordre'>>): Promise<CatalogueSousCategorie> => {
  const { data, error } = await supabase
    .from('catalogue_sous_categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteSousCategorie = async (id: string): Promise<void> => {
  const { error } = await supabase.from('catalogue_sous_categories').delete().eq('id', id);
  if (error) throw error;
};

// Produits
const getProduits = async (categorieId?: string): Promise<CatalogueProduit[]> => {
  let query = supabase
    .from('catalogue_produits')
    .select('*, catalogue_categories(*), catalogue_sous_categories(*), catalogue_produit_photos(*)')
    .order('numero', { ascending: true });
  if (categorieId) query = query.eq('categorie_id', categorieId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(p => ({
    ...p,
    catalogue_produit_photos: (p.catalogue_produit_photos ?? []).sort((a: CatalogueProduitPhoto, b: CatalogueProduitPhoto) => a.ordre - b.ordre),
  }));
};

const getProduitsPublic = async (categorieId?: string): Promise<CatalogueProduit[]> => {
  let query = supabase
    .from('catalogue_produits')
    .select('*, catalogue_categories(*), catalogue_sous_categories(*), catalogue_produit_photos(*)')
    .eq('actif', true)
    .order('numero', { ascending: true });
  if (categorieId) query = query.eq('categorie_id', categorieId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(p => ({
    ...p,
    catalogue_produit_photos: (p.catalogue_produit_photos ?? []).sort((a: CatalogueProduitPhoto, b: CatalogueProduitPhoto) => a.ordre - b.ordre),
  }));
};

const createProduit = async (payload: {
  categorie_id: string;
  sous_categorie_id?: string;
  nom: string;
  description?: string;
  code_fournisseur?: string;
  prix_ariary: number;
  moq: number;
  prix_exw_rmb?: number;
  prix_exw_usd?: number;
  unite?: string;
  quantite_par_unite?: number;
  volume_par_unite?: number;
  poids_par_unite?: number;
  actif?: boolean;
  ordre?: number;
}): Promise<CatalogueProduit> => {
  const { data, error } = await supabase
    .from('catalogue_produits')
    .insert(payload)
    .select('*, catalogue_categories(*), catalogue_sous_categories(*), catalogue_produit_photos(*)')
    .single();
  if (error) throw error;
  return data;
};

const updateProduit = async (id: string, payload: Partial<Omit<CatalogueProduit, 'id' | 'numero' | 'reference_produit' | 'created_at' | 'updated_at'>>): Promise<CatalogueProduit> => {
  const { data, error } = await supabase
    .from('catalogue_produits')
    .update(payload)
    .eq('id', id)
    .select('*, catalogue_categories(*), catalogue_sous_categories(*), catalogue_produit_photos(*)')
    .single();
  if (error) throw error;
  return data;
};

const deleteProduit = async (id: string): Promise<void> => {
  const { error } = await supabase.from('catalogue_produits').delete().eq('id', id);
  if (error) throw error;
};

// Photos
const addPhoto = async (produitId: string, file: File, ordre: number): Promise<CatalogueProduitPhoto> => {
  const optimized = await optimizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82, format: 'webp' });
  const fileName = `${produitId}/${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from('catalogue-photos')
    .upload(fileName, optimized, { upsert: false, contentType: 'image/webp' });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('catalogue_produit_photos')
    .insert({ produit_id: produitId, file_path: fileName, ordre })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deletePhoto = async (photo: CatalogueProduitPhoto): Promise<void> => {
  await supabase.storage.from('catalogue-photos').remove([photo.file_path]);
  const { error } = await supabase.from('catalogue_produit_photos').delete().eq('id', photo.id);
  if (error) throw error;
};

const getPhotoUrl = (filePath: string): string => {
  const { data } = supabase.storage.from('catalogue-photos').getPublicUrl(filePath);
  return data.publicUrl;
};

const uploadCouvertureCategorie = async (categorieId: string, file: File): Promise<CatalogueCategorie> => {
  const optimized = await optimizeImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.82, format: 'webp' });
  const filePath = `categories/${categorieId}/couverture.webp`;
  const { error: uploadError } = await supabase.storage
    .from('catalogue-photos')
    .upload(filePath, optimized, { upsert: true, contentType: 'image/webp' });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from('catalogue_categories')
    .update({ photo_couverture: filePath })
    .eq('id', categorieId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteCouvertureCategorie = async (categorieId: string, filePath: string): Promise<CatalogueCategorie> => {
  await supabase.storage.from('catalogue-photos').remove([filePath]);
  const { data, error } = await supabase
    .from('catalogue_categories')
    .update({ photo_couverture: null })
    .eq('id', categorieId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const catalogueService = {
  getCategories,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  uploadCouvertureCategorie,
  deleteCouvertureCategorie,
  getSousCategories,
  createSousCategorie,
  updateSousCategorie,
  deleteSousCategorie,
  getProduits,
  getProduitsPublic,
  createProduit,
  updateProduit,
  deleteProduit,
  addPhoto,
  deletePhoto,
  getPhotoUrl,
};
