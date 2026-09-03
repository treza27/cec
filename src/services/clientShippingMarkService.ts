import { supabase } from '../utils/supabase';

export interface ClientShippingMark {
  id: number;
  client_id: number;
  shipping_mark: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientWithShippingMarks {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone?: string;
  created_at?: string;
  updated_at?: string;
  statut_contact?: 'Prospect' | 'Client';
  shipping_marks: ClientShippingMark[];
}

export const clientShippingMarkService = {
  // Récupérer toutes les shipping marks d'un client
  async getByClientId(clientId: number): Promise<ClientShippingMark[]> {
    const { data, error } = await supabase
      .from('client_shipping_marks')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des shipping marks: ${error.message}`);
    }

    return data || [];
  },

  // Ajouter une shipping mark à un client
  async addToClient(clientId: number, shippingMark: string): Promise<ClientShippingMark> {
    const { data, error } = await supabase
      .from('client_shipping_marks')
      .insert({
        client_id: clientId,
        shipping_mark: shippingMark.trim(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'ajout de la shipping mark: ${error.message}`);
    }

    return data;
  },

  // Supprimer une shipping mark d'un client
  async removeFromClient(shippingMarkId: number): Promise<void> {
    const { error } = await supabase
      .from('client_shipping_marks')
      .update({ is_active: false })
      .eq('id', shippingMarkId);

    if (error) {
      throw new Error(`Erreur lors de la suppression de la shipping mark: ${error.message}`);
    }
  },

  // Mettre à jour une shipping mark
  async update(shippingMarkId: number, newShippingMark: string): Promise<ClientShippingMark> {
    const { data, error } = await supabase
      .from('client_shipping_marks')
      .update({ 
        shipping_mark: newShippingMark.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', shippingMarkId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de la shipping mark: ${error.message}`);
    }

    return data;
  },

  // Récupérer toutes les shipping marks uniques (pour les dropdowns)
  async getAllUniqueShippingMarks(): Promise<string[]> {
    const { data, error } = await supabase
      .from('client_shipping_marks')
      .select('shipping_mark')
      .eq('is_active', true)
      .order('shipping_mark', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des shipping marks: ${error.message}`);
    }

    // Extraire les valeurs uniques
    const uniqueMarks = [...new Set(data.map(item => item.shipping_mark))];
    return uniqueMarks;
  },

  // Vérifier si une shipping mark existe déjà
  async checkShippingMarkExists(shippingMark: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('client_shipping_marks')
      .select('id')
      .eq('shipping_mark', shippingMark.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la vérification de la shipping mark: ${error.message}`);
    }

    return (data || []).length > 0;
  },

  // Récupérer un client avec toutes ses shipping marks
  async getClientWithShippingMarks(clientId: number): Promise<ClientWithShippingMarks | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_shipping_marks!inner(
          id,
          client_id,
          shipping_mark,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('id', clientId)
      .eq('client_shipping_marks.is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Client non trouvé
      }
      throw new Error(`Erreur lors de la récupération du client: ${error.message}`);
    }

    return {
      ...data,
      shipping_marks: data.client_shipping_marks || []
    };
  },

  // Récupérer tous les clients avec leurs shipping marks
  async getAllClientsWithShippingMarks(): Promise<ClientWithShippingMarks[]> {
    console.log('🔍 Récupération de tous les clients avec shipping marks...');
    
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_shipping_marks(
          id,
          client_id,
          shipping_mark,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('client_shipping_marks.is_active', true)
      .order('nom', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des clients:', error);
      throw new Error(`Erreur lors de la récupération des clients: ${error.message}`);
    }

    const result = (data || []).map(client => ({
      ...client,
      shipping_marks: (client.client_shipping_marks || []).filter((mark: any) => mark.is_active)
    }));
    
    console.log('✅ Clients récupérés:', result.length);
    console.log('📋 Détails des clients:', result);
    
    return result;
  },

  // Remplacer toutes les shipping marks d'un client
  async replaceClientShippingMarks(clientId: number, shippingMarks: string[]): Promise<ClientShippingMark[]> {
    // Récupérer toutes les shipping marks existantes pour ce client (actives et inactives)
    const { data: existingMarks, error: fetchError } = await supabase
      .from('client_shipping_marks')
      .select('*')
      .eq('client_id', clientId);

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des shipping marks existantes: ${fetchError.message}`);
    }

    const existingMarksMap = new Map(
      (existingMarks || []).map(mark => [mark.shipping_mark, mark])
    );

    const newMarksSet = new Set(shippingMarks.map(mark => mark.trim()));
    const updatedMarks: ClientShippingMark[] = [];

    // Traiter les nouvelles shipping marks
    for (const newMark of newMarksSet) {
      const existingMark = existingMarksMap.get(newMark);
      
      if (existingMark) {
        // La shipping mark existe déjà, la réactiver si nécessaire
        if (!existingMark.is_active) {
          const { data, error } = await supabase
            .from('client_shipping_marks')
            .update({ 
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMark.id)
            .select()
            .single();

          if (error) {
            throw new Error(`Erreur lors de la réactivation de la shipping mark: ${error.message}`);
          }
          updatedMarks.push(data);
        } else {
          // Déjà active, pas besoin de mise à jour
          updatedMarks.push(existingMark);
        }
      } else {
        // Nouvelle shipping mark, l'insérer
        const { data, error } = await supabase
          .from('client_shipping_marks')
          .insert({
            client_id: clientId,
            shipping_mark: newMark,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Erreur lors de l'ajout de la nouvelle shipping mark: ${error.message}`);
        }
        updatedMarks.push(data);
      }
    }

    // Désactiver les shipping marks qui ne sont plus dans la nouvelle liste
    for (const [markText, existingMark] of existingMarksMap) {
      if (!newMarksSet.has(markText) && existingMark.is_active) {
        await supabase
          .from('client_shipping_marks')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMark.id);
      }
    }

    return updatedMarks;
  }
};