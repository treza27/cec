import { supabase } from '../utils/supabase';

export interface BonLivraisonColisDetail {
  id: number;
  shippingMark: string;
  trackingNumber?: string;
  description: string;
  nbPalettesTana: number;
  nbCartonsTana: number;
  poidsTana: number;
  volumeTana: number;
  nbCartonsLivres: number;
  poidsLivre: number;
  volumeLivre: number;
}

export interface BonLivraison {
  id: number;
  depart_id: number;
  reference: string;
  client_nom: string | null;
  client_pseudo: string | null;
  colis_ids: number[];
  colis_details: BonLivraisonColisDetail[];
  volume_total_livre: number;
  poids_total_livre: number;
  nb_cartons_total_livre: number;
  is_partial: boolean;
  created_by: string | null;
  created_at: string;
}

export interface BonLivraisonCreateData {
  depart_id: number;
  client_nom: string | null;
  client_pseudo: string | null;
  colis_ids: number[];
  colis_details: BonLivraisonColisDetail[];
  volume_total_livre: number;
  poids_total_livre: number;
  nb_cartons_total_livre: number;
  is_partial: boolean;
  update_status_to_livre?: boolean;
}

function generateReference(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const timestamp = Date.now().toString().slice(-5);
  return `BL${year}${timestamp}`;
}

async function enrichWithTracking(bons: BonLivraison[]): Promise<BonLivraison[]> {
  const needsEnrichment = bons.some((bon) =>
    bon.colis_details.some((d) => !d.trackingNumber && d.id)
  );

  if (!needsEnrichment) return bons;

  const allIds = Array.from(
    new Set(bons.flatMap((bon) => bon.colis_details.map((d) => d.id).filter(Boolean)))
  );

  if (allIds.length === 0) return bons;

  const { data: inventaire } = await supabase
    .from('inventaire')
    .select('id, tracking_number')
    .in('id', allIds);

  if (!inventaire || inventaire.length === 0) return bons;

  const trackingMap = new Map<number, string>(
    inventaire
      .filter((row) => row.tracking_number)
      .map((row) => [row.id as number, row.tracking_number as string])
  );

  return bons.map((bon) => ({
    ...bon,
    colis_details: bon.colis_details.map((d) => ({
      ...d,
      trackingNumber: d.trackingNumber || trackingMap.get(d.id) || '',
    })),
  }));
}

export const bonLivraisonService = {
  async getByDepartId(departId: number): Promise<BonLivraison[]> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .select('*')
      .eq('depart_id', departId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const bons: BonLivraison[] = (data || []).map((row) => ({
      ...row,
      colis_details: row.colis_details as BonLivraisonColisDetail[],
    }));

    return enrichWithTracking(bons);
  },

  async create(data: BonLivraisonCreateData): Promise<BonLivraison> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const reference = generateReference();

    const { data: inserted, error } = await supabase
      .from('bons_livraison')
      .insert({
        depart_id: data.depart_id,
        reference,
        client_nom: data.client_nom,
        client_pseudo: data.client_pseudo,
        colis_ids: data.colis_ids,
        colis_details: data.colis_details,
        volume_total_livre: data.volume_total_livre,
        poids_total_livre: data.poids_total_livre,
        nb_cartons_total_livre: data.nb_cartons_total_livre,
        is_partial: data.is_partial,
        created_by: user.id,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!inserted) throw new Error('Erreur lors de la création du bon de livraison');

    return {
      ...inserted,
      colis_details: inserted.colis_details as BonLivraisonColisDetail[],
    };
  },

  async getByPseudo(pseudo: string): Promise<BonLivraison[]> {
    const { data, error } = await supabase
      .from('bons_livraison')
      .select('*')
      .eq('client_pseudo', pseudo)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const bons: BonLivraison[] = (data || []).map((row) => ({
      ...row,
      colis_details: row.colis_details as BonLivraisonColisDetail[],
    }));

    return enrichWithTracking(bons);
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('bons_livraison')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
