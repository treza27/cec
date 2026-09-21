import { supabase } from '../utils/supabase';
import { NoteInterne } from '../types';

const NOTES_SELECT = `
  *,
  auteur:employees!notes_internes_auteur_id_fkey(user_id, full_name, email, profile_picture_url)
`;

export const noteInterneService = {
  async getByDemandeId(demandeAchatId: number): Promise<NoteInterne[]> {
    const { data, error } = await supabase
      .from('notes_internes')
      .select(NOTES_SELECT)
      .eq('demande_achat_id', demandeAchatId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des notes: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      auteur: row.auteur ?? undefined,
    }));
  },

  async create(demandeAchatId: number, message: string): Promise<NoteInterne> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notes_internes')
      .insert({
        demande_achat_id: demandeAchatId,
        auteur_id: user.id,
        message: message.trim(),
      })
      .select(NOTES_SELECT)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de la note: ${error.message}`);
    }

    return {
      ...data,
      auteur: data.auteur ?? undefined,
    };
  },
};
