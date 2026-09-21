import { supabase } from '../utils/supabase';

export interface Article {
  id: string;
  titre: string;
  slug: string;
  resume: string;
  meta_description: string;
  mots_cles: string[];
  contenu: string;
  image_url: string;
  categorie: string;
  auteur: string;
  published: boolean;
  created_by: string | null;
  date_publication: string;
  created_at: string;
  updated_at: string;
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdate = Partial<Omit<Article, 'id' | 'created_at' | 'created_by'>>;

export const CATEGORIES = [
  'Conseils Import',
  'Actualités marché',
  'Guides pratiques',
  'Nouvelles CEC',
] as const;

function generateSlug(titre: string): string {
  return titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    let query = supabase.from('articles').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const articleService = {
  async getAll(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('date_publication', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPublished(categorie?: string): Promise<Article[]> {
    let query = supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('date_publication', { ascending: false });
    if (categorie) query = query.eq('categorie', categorie);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload: Omit<ArticleInsert, 'slug' | 'created_by'>): Promise<Article> {
    const baseSlug = generateSlug(payload.titre);
    const slug = await ensureUniqueSlug(baseSlug);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('articles')
      .insert({ ...payload, slug, created_by: user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: ArticleUpdate): Promise<Article> {
    let updatePayload = { ...payload };
    if (payload.titre) {
      const baseSlug = generateSlug(payload.titre);
      updatePayload.slug = await ensureUniqueSlug(baseSlug, id);
    }
    const { data, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async togglePublished(id: string, published: boolean): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .update({ published })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  },

  generateSlug,
};

export { articleService };
