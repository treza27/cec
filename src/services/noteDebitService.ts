import { supabase } from '../utils/supabase';

export interface NoteDebitColisDetail {
  id: number;
  shippingMark: string;
  trackingNumber?: string;
  description: string;
  volumeTana: number;
  montantAriary: number;
  poidsTana?: number;
  nbCartons?: number;
  nbPalettes?: number;
}

export interface NoteDebit {
  id: number;
  depart_id: number;
  reference: string;
  prix_cbm_usd: number;
  taux_change: number;
  volume_total_tana: number;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  client_nom: string | null;
  client_pseudo: string | null;
  client_phone: string | null;
  colis_ids: number[];
  colis_details: NoteDebitColisDetail[];
  statut_paiement: 'impayee' | 'payee' | 'partielle';
  total_paye: number | null;
  apure_externe: boolean | null;
  note_externe: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NoteDebitCreateData {
  depart_id: number;
  prix_cbm_usd: number;
  taux_change: number;
  volume_total_tana: number;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  client_nom: string | null;
  client_pseudo: string | null;
  client_phone: string | null;
  colis_ids: number[];
  colis_details: NoteDebitColisDetail[];
  note_externe: string | null;
}

export interface NoteDebitUpdateData {
  prix_cbm_usd: number;
  taux_change: number;
  volume_total_tana: number;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  client_nom: string | null;
  client_pseudo: string | null;
  client_phone: string | null;
  colis_ids: number[];
  colis_details: NoteDebitColisDetail[];
  note_externe: string | null;
}

export const noteDebitService = {
  async getByDepartId(departId: number): Promise<NoteDebit[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('*')
      .eq('depart_id', departId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      ...row,
      colis_details: row.colis_details as NoteDebitColisDetail[],
    }));
  },

  async create(data: NoteDebitCreateData): Promise<NoteDebit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: inserted, error } = await supabase
      .from('notes_debit')
      .insert({
        depart_id: data.depart_id,
        prix_cbm_usd: data.prix_cbm_usd,
        taux_change: data.taux_change,
        volume_total_tana: data.volume_total_tana,
        montant_total_ariary: data.montant_total_ariary,
        frais_livraison_ariary: data.frais_livraison_ariary,
        client_nom: data.client_nom,
        client_pseudo: data.client_pseudo,
        client_phone: data.client_phone,
        colis_ids: data.colis_ids,
        colis_details: data.colis_details,
        note_externe: data.note_externe,
        created_by: user.id,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!inserted) throw new Error('Erreur lors de la création de la note de débit');

    return {
      ...inserted,
      colis_details: inserted.colis_details as NoteDebitColisDetail[],
    };
  },

  async getAll(): Promise<NoteDebit[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      ...row,
      colis_details: row.colis_details as NoteDebitColisDetail[],
    }));
  },

  async getByPseudo(pseudo: string): Promise<NoteDebit[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('*')
      .eq('client_pseudo', pseudo)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      ...row,
      colis_details: row.colis_details as NoteDebitColisDetail[],
    }));
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('notes_debit')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async update(id: number, data: NoteDebitUpdateData): Promise<NoteDebit> {
    const { data: updated, error } = await supabase
      .from('notes_debit')
      .update({
        prix_cbm_usd: data.prix_cbm_usd,
        taux_change: data.taux_change,
        volume_total_tana: data.volume_total_tana,
        montant_total_ariary: data.montant_total_ariary,
        frais_livraison_ariary: data.frais_livraison_ariary,
        client_nom: data.client_nom,
        client_pseudo: data.client_pseudo,
        client_phone: data.client_phone,
        colis_ids: data.colis_ids,
        colis_details: data.colis_details,
        note_externe: data.note_externe,
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error('Erreur lors de la modification de la note de débit');

    return {
      ...updated,
      colis_details: updated.colis_details as NoteDebitColisDetail[],
    };
  },
};
