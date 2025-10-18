import { supabase } from '../utils/supabase';
import { DepartItem, DepartureStatus } from '../types';
import { departureToPackageStatusMap } from '../utils/statusHelpers';

// Types pour les données Supabase
export interface SupabaseDepartureItem {
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
}

// Conversion Supabase -> App
export const convertFromSupabase = (supabaseItem: SupabaseDepartureItem): DepartItem => {
  return {
    id: supabaseItem.id,
    numBL: supabaseItem.num_bl,
    numTC: supabaseItem.num_tc || '',
    nbPalettesTotal: supabaseItem.nb_palettes_total || 0,
    nbCartonsTotal: supabaseItem.nb_cartons_total || 0,
    poidsTotal: supabaseItem.poids_total || 0,
    volumeTotal: supabaseItem.volume_total || 0,
    statut: (supabaseItem.statut as DepartureStatus) || 'preparation_depart',
    dateChargement: supabaseItem.date_chargement || '',
    dateDepartChine: supabaseItem.date_depart_chine || '',
    dateArriveTamatave: supabaseItem.date_arrivee_tamatave || '',
    dateArriveTana: supabaseItem.date_arrivee_tana || '',
    dateReceptionColis: supabaseItem.date_reception_colis || '',
    imageChargement: [],
    imageSuiviMaritime: [],
    imageReceptionColis: [],
    colisAssocies: supabaseItem.colis_associes || []
  };
};

// Conversion App -> Supabase
export const convertToSupabase = (item: Partial<DepartItem>) => {
  return {
    ...(item.numBL && { num_bl: item.numBL }),
    ...(item.numTC !== undefined && { num_tc: item.numTC || null }),
    ...(item.nbPalettesTotal !== undefined && { nb_palettes_total: Number(item.nbPalettesTotal) || null }),
    ...(item.nbCartonsTotal !== undefined && { nb_cartons_total: Number(item.nbCartonsTotal) || null }),
    ...(item.poidsTotal !== undefined && { poids_total: Number(item.poidsTotal) || null }),
    ...(item.volumeTotal !== undefined && { volume_total: Number(item.volumeTotal) || null }),
    ...(item.statut && { statut: item.statut }),
    ...(item.dateChargement !== undefined && { date_chargement: item.dateChargement || null }),
    ...(item.dateDepartChine !== undefined && { date_depart_chine: item.dateDepartChine || null }),
    ...(item.dateArriveTamatave !== undefined && { date_arrivee_tamatave: item.dateArriveTamatave || null }),
    ...(item.dateArriveTana !== undefined && { date_arrivee_tana: item.dateArriveTana || null }),
    ...(item.dateReceptionColis !== undefined && { date_reception_colis: item.dateReceptionColis || null }),
    ...(item.colisAssocies && { colis_associes: item.colisAssocies })
  };
};

// Services API
export const departureService = {
  // Récupérer tous les départs
  async getAll(): Promise<DepartItem[]> {
    const { data, error } = await supabase
      .from('depart')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des départs: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Récupérer un départ par ID
  async getById(id: number): Promise<DepartItem | null> {
    const { data, error } = await supabase
      .from('depart')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la récupération du départ ${id}: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return convertFromSupabase(data);
  },

  // Créer un nouveau départ
  async create(item: Omit<DepartItem, 'id'>): Promise<DepartItem> {
    const supabaseData = convertToSupabase(item);
    
    const { data, error } = await supabase
      .from('depart')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du départ: ${error.message}`);
    }

    // Assigner automatiquement le numéro BL aux colis associés
    if (item.colisAssocies && item.colisAssocies.length > 0) {
      const { error: updateError } = await supabase
        .from('inventaire')
        .update({ bl: item.numBL })
        .in('id', item.colisAssocies);

      if (updateError) {
        console.warn('Erreur lors de l\'assignation du BL aux colis:', updateError.message);
      }
    }

    return convertFromSupabase(data);
  },

  // Mettre à jour un départ
  async update(id: number, updates: Partial<DepartItem>): Promise<DepartItem> {
    const supabaseData = convertToSupabase(updates);
    
    const { data, error } = await supabase
      .from('depart')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du départ ${id}: ${error.message}`);
    }

    // Si les colis associés ou le numéro BL ont changé, mettre à jour les BL des colis
    if (updates.colisAssocies || updates.numBL) {
      const updatedDepart = convertFromSupabase(data);
      
      // D'abord, retirer le BL des anciens colis (si on change les colis associés)
      if (updates.colisAssocies) {
        const { error: clearError } = await supabase
          .from('inventaire')
          .update({ bl: '' })
          .eq('bl', updatedDepart.numBL);

        if (clearError) {
          console.warn('Erreur lors du nettoyage des anciens BL:', clearError.message);
        }
      }
      
      // Assigner le BL aux nouveaux colis associés
      if (updatedDepart.colisAssocies && updatedDepart.colisAssocies.length > 0) {
        const { error: updateError } = await supabase
          .from('inventaire')
          .update({ bl: updatedDepart.numBL })
          .in('id', updatedDepart.colisAssocies);

        if (updateError) {
          console.warn('Erreur lors de l\'assignation du BL aux colis:', updateError.message);
        }
      }
    }

    return convertFromSupabase(data);
  },

  // Supprimer un départ
  async delete(id: number): Promise<void> {
    // Récupérer les informations du départ avant suppression
    const { data: departData } = await supabase
      .from('depart')
      .select('num_bl, colis_associes')
      .eq('id', id)
      .single();

    // Retirer le BL des colis associés avant de supprimer le départ
    if (departData?.num_bl) {
      const { error: clearError } = await supabase
        .from('inventaire')
        .update({ bl: '' })
        .eq('bl', departData.num_bl);

      if (clearError) {
        console.warn('Erreur lors du nettoyage des BL des colis:', clearError.message);
      }
    }

    const { error } = await supabase
      .from('depart')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression du départ ${id}: ${error.message}`);
    }
  },

  // Archiver un départ et ses colis associés
  async archive(id: number): Promise<DepartItem> {
    // Récupérer les informations du départ
    const { data: departData, error: fetchError } = await supabase
      .from('depart')
      .select('colis_associes')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération du départ ${id}: ${fetchError.message}`);
    }

    // Archiver le départ
    const { data: updatedDepart, error: departError } = await supabase
      .from('depart')
      .update({ statut: 'archive' })
      .eq('id', id)
      .select()
      .single();

    if (departError) {
      throw new Error(`Erreur lors de l'archivage du départ ${id}: ${departError.message}`);
    }

    // Archiver tous les colis associés
    if (departData.colis_associes && departData.colis_associes.length > 0) {
      const { error: colisError } = await supabase
        .from('inventaire')
        .update({ statut: 'archive' })
        .in('id', departData.colis_associes);

      if (colisError) {
        console.warn('Erreur lors de l\'archivage des colis associés:', colisError.message);
      }
    }

    return convertFromSupabase(updatedDepart);
  },

  // Récupérer tous les départs archivés
  async getAllArchived(): Promise<DepartItem[]> {
    const { data, error } = await supabase
      .from('depart')
      .select('*')
      .eq('statut', 'archive')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des départs archivés: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Récupérer tous les départs (y compris archivés)
  async getAllIncludingArchived(): Promise<DepartItem[]> {
    const { data, error } = await supabase
      .from('depart')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération de tous les départs: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Désarchiver un départ (remettre au statut précédent)
  async unarchive(id: number, newStatus: DepartureStatus = 'decharge_trie'): Promise<DepartItem> {
    try {
      console.log('🔄 Début désarchivage départ:', { id, newStatus });
      
      // Récupérer les informations du départ
      const { data: departData, error: fetchError } = await supabase
        .from('depart')
        .select('colis_associes, num_bl')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération départ:', fetchError);
        throw new Error(`Erreur lors de la récupération du départ ${id}: ${fetchError.message}`);
      }

      console.log('📦 Départ trouvé:', departData);

      // Désarchiver le départ
      const { data: updatedDepart, error: departError } = await supabase
        .from('depart')
        .update({ 
          statut: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (departError) {
        console.error('❌ Erreur désarchivage départ:', departError);
        throw new Error(`Erreur lors du désarchivage du départ ${id}: ${departError.message}`);
      }

      console.log('✅ Départ désarchivé:', updatedDepart);

      // Désarchiver tous les colis associés
      if (departData.colis_associes && departData.colis_associes.length > 0) {
        const packageStatus = departureToPackageStatusMap[newStatus];
        console.log('🔄 Désarchivage des colis associés:', {
          colisIds: departData.colis_associes,
          nouveauStatut: packageStatus
        });
        
        const { error: colisError } = await supabase
          .from('inventaire')
          .update({ 
            statut: packageStatus,
            updated_at: new Date().toISOString()
          })
          .in('id', departData.colis_associes);

        if (colisError) {
          console.warn('⚠️ Erreur lors du désarchivage des colis associés:', colisError.message);
          // Ne pas faire échouer toute l'opération pour cette erreur
        } else {
          console.log('✅ Colis associés désarchivés avec succès');
        }
      }

      return convertFromSupabase(updatedDepart);
    } catch (error) {
      console.error('❌ Erreur générale désarchivage:', error);
      throw error;
    }
  }
};