import { supabase } from '../utils/supabase';
import { AchatArticle } from '../types';

export interface AchatArticleFormData {
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
  ordre?: number;
}

export interface AchatArticleUpdateData {
  nom_article?: string;
  reference?: string | null;
  description?: string | null;
  lien_achat?: string | null;
  tracking?: string | null;
  photo_url?: string | null;
  prix_unitaire_rmb?: number | null;
  frais_port_locaux_rmb?: number | null;
  quantite?: number;
  poids_estime?: number | null;
  volume_cbm?: number | null;
  ordre?: number;
}

export const achatArticleService = {
  async getByDemandeId(demandeId: number): Promise<AchatArticle[]> {
    const { data, error } = await supabase
      .from('achat_articles')
      .select('*')
      .eq('demande_achat_id', demandeId)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erreur chargement articles: ${error.message}`);
    return data || [];
  },

  async create(formData: AchatArticleFormData): Promise<AchatArticle> {
    const { data, error } = await supabase
      .from('achat_articles')
      .insert({
        demande_achat_id: formData.demande_achat_id,
        nom_article: formData.nom_article,
        reference: formData.reference || null,
        description: formData.description || null,
        lien_achat: formData.lien_achat || null,
        tracking: formData.tracking || null,
        photo_url: formData.photo_url || null,
        prix_unitaire_rmb: formData.prix_unitaire_rmb ?? null,
        frais_port_locaux_rmb: formData.frais_port_locaux_rmb ?? null,
        quantite: formData.quantite,
        poids_estime: formData.poids_estime ?? null,
        volume_cbm: formData.volume_cbm ?? null,
        ordre: formData.ordre ?? 0,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Erreur création article: ${error.message}`);
    return data;
  },

  async update(id: number, updates: AchatArticleUpdateData): Promise<AchatArticle> {
    const { data, error } = await supabase
      .from('achat_articles')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Erreur mise à jour article: ${error.message}`);
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('achat_articles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erreur suppression article: ${error.message}`);
  },

  async uploadPhoto(file: File, demandeId: number, articleId?: number): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${articleId || 'new'}.${fileExt}`;
    const filePath = `articles/${demandeId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('achat-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Erreur upload photo: ${uploadError.message}`);

    const { data } = supabase.storage
      .from('achat-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
