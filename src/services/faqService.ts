import { supabase } from '../utils/supabase';
import { FaqItem } from '../types';

export const faqService = {
  // Récupérer tous les éléments FAQ actifs
  async getAll(): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération de la FAQ: ${error.message}`);
    }

    return data || [];
  },

  // Récupérer tous les éléments FAQ (y compris inactifs) - pour l'administration
  async getAllIncludingInactive(): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération de la FAQ complète: ${error.message}`);
    }

    return data || [];
  },

  // Récupérer les éléments FAQ par catégorie
  async getByCategory(category: string): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération de la FAQ pour la catégorie ${category}: ${error.message}`);
    }

    return data || [];
  },

  // Récupérer toutes les catégories uniques
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('category')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`);
    }

    // Extraire les catégories uniques
    const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
    return uniqueCategories.sort();
  },

  // Créer un nouvel élément FAQ (pour l'administration)
  async create(faqData: Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>): Promise<FaqItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .insert(faqData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'élément FAQ: ${error.message}`);
    }

    return data;
  },

  // Mettre à jour un élément FAQ (pour l'administration)
  async update(id: number, updates: Partial<Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>>): Promise<FaqItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de l'élément FAQ: ${error.message}`);
    }

    return data;
  },

  // Supprimer un élément FAQ (désactiver plutôt que supprimer)
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('faq_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression de l'élément FAQ: ${error.message}`);
    }
  },

  // Rechercher dans les questions et réponses
  async search(query: string, language: 'fr' | 'en' = 'fr'): Promise<FaqItem[]> {
    const questionField = language === 'fr' ? 'question_fr' : 'question_en';
    const answerField = language === 'fr' ? 'answer_fr' : 'answer_en';

    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .or(`${questionField}.ilike.%${query}%,${answerField}.ilike.%${query}%`)
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la recherche dans la FAQ: ${error.message}`);
    }

    return data || [];
  }
};