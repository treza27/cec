import { supabase } from '../utils/supabase';
import { DemandeAchat, StatutDemandeAchat } from '../types';

export interface DemandeAchatFormData {
  client_id: number;
  nom_article: string;
  photo_url?: string | null;
  lien_exemple?: string | null;
  quantite: number;
  remarques?: string | null;
}

export interface DemandeAchatAcheteurData {
  lien_achat_final?: string | null;
  taux_change_achete?: number | null;
  taux_change_vendu?: number | null;
  frais_port_locaux_rmb?: number | null;
  statut?: StatutDemandeAchat;
  assigne_a_id?: string | null;
}

const DEMANDES_SELECT = `
  *,
  client:clients(id, nom, prenom, pseudo, entreprise, telephone, statut_contact),
  cree_par:employees!demandes_achat_cree_par_id_fkey_employees(user_id, full_name, email, profile_picture_url),
  assigne_a:employees!demandes_achat_assigne_a_id_fkey_employees(user_id, full_name, email, profile_picture_url),
  achat_articles(id, prix_unitaire_rmb, frais_port_locaux_rmb, quantite, tracking)
`;

const mapRow = (row: any): DemandeAchat => ({
  ...row,
  client: row.client ?? undefined,
  cree_par: row.cree_par ?? undefined,
  assigne_a: row.assigne_a ?? null,
});

export interface AchatPaginationParams {
  page?: number;
  pageSize?: number;
}

export interface AchatPageResult {
  demandes: DemandeAchat[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const achatService = {
  async getAll(
    filters?: {
      statut?: StatutDemandeAchat;
      cree_par_id?: string;
      assigne_a_id?: string;
      date_from?: string;
      date_to?: string;
    },
    pagination?: AchatPaginationParams
  ): Promise<AchatPageResult> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 30;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('demandes_achat')
      .select(DEMANDES_SELECT, { count: 'exact' })
      .order('date_creation', { ascending: false })
      .range(from, to);

    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters?.cree_par_id) {
      query = query.eq('cree_par_id', filters.cree_par_id);
    }
    if (filters?.assigne_a_id) {
      query = query.eq('assigne_a_id', filters.assigne_a_id);
    }
    if (filters?.date_from) {
      query = query.gte('date_creation', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date_creation', filters.date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des demandes: ${error.message}`);
    }

    const total = count ?? 0;
    return {
      demandes: (data || []).map(mapRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getCount(filters?: {
    statut?: StatutDemandeAchat;
    cree_par_id?: string;
    assigne_a_id?: string;
  }): Promise<Record<string, number>> {
    let query = supabase
      .from('demandes_achat')
      .select('statut');

    if (filters?.cree_par_id) {
      query = query.eq('cree_par_id', filters.cree_par_id);
    }
    if (filters?.assigne_a_id) {
      query = query.eq('assigne_a_id', filters.assigne_a_id);
    }

    const { data, error } = await query;
    if (error) return {};

    const counts: Record<string, number> = {};
    (data || []).forEach((row: { statut: string }) => {
      counts[row.statut] = (counts[row.statut] || 0) + 1;
    });
    return counts;
  },

  async getById(id: number): Promise<DemandeAchat | null> {
    const { data, error } = await supabase
      .from('demandes_achat')
      .select(DEMANDES_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la demande: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  },

  async create(formData: DemandeAchatFormData): Promise<DemandeAchat> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: inserted, error: insertError } = await supabase
      .from('demandes_achat')
      .insert({
        client_id: formData.client_id,
        nom_article: formData.nom_article,
        photo_url: formData.photo_url || null,
        lien_exemple: formData.lien_exemple || null,
        quantite: formData.quantite,
        remarques: formData.remarques || null,
        statut: 'Nouveau',
        cree_par_id: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Erreur lors de la création de la demande: ${insertError.message}`);
    }

    const { data, error } = await supabase
      .from('demandes_achat')
      .select(DEMANDES_SELECT)
      .eq('id', inserted.id)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la demande: ${error.message}`);
    }

    return mapRow(data);
  },

  async updateAcheteur(id: number, updates: DemandeAchatAcheteurData): Promise<DemandeAchat> {
    const { error: updateError } = await supabase
      .from('demandes_achat')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour de la demande: ${updateError.message}`);
    }

    const { data, error } = await supabase
      .from('demandes_achat')
      .select(DEMANDES_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération de la demande: ${error.message}`);
    }

    return mapRow(data);
  },

  async updateStatut(id: number, statut: StatutDemandeAchat, isAdmin = false): Promise<DemandeAchat> {
    if (statut === 'Payé' && !isAdmin) {
      const { count, error } = await supabase
        .from('mouvements_caisse')
        .select('id', { count: 'exact', head: true })
        .eq('demande_achat_id', id)
        .eq('type_mouvement', 'entree_client')
        .eq('est_annule', false);

      if (error) throw new Error(`Erreur lors de la vérification du règlement: ${error.message}`);
      if (!count || count === 0) {
        throw new Error("Impossible de passer en 'Payé' : aucun règlement achat client n'est associé à ce devis.");
      }
    }
    return achatService.updateAcheteur(id, { statut });
  },

  async assignTo(id: number, employeeUserId: string | null): Promise<DemandeAchat> {
    return achatService.updateAcheteur(id, { assigne_a_id: employeeUserId });
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('demandes_achat')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression de la demande: ${error.message}`);
    }
  },

  async uploadPhoto(file: File, demandeId?: number): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${demandeId || 'new'}.${fileExt}`;
    const filePath = `articles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('achat-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload de la photo: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('achat-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
