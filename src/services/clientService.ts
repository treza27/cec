import { supabase } from '../utils/supabase';
import { clientShippingMarkService, ClientWithShippingMarks } from './clientShippingMarkService';

export interface ClientFormData {
  nom: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone?: string;
  shipping_marks: string[];
}

export interface ClientBasic {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone?: string;
  created_at?: string;
  updated_at?: string;
}

export const clientService = {
  // Créer un nouveau client avec ses shipping marks
  async create(clientData: ClientFormData): Promise<ClientWithShippingMarks> {
    try {
      // Créer le client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          nom: clientData.nom,
          prenom: clientData.prenom,
          pseudo: clientData.pseudo,
          entreprise: clientData.entreprise || null,
          quartier_ville: clientData.quartier_ville || null,
          telephone: clientData.telephone || null
        })
        .select()
        .single();

      if (clientError) {
        throw new Error(`Erreur lors de la création du client: ${clientError.message}`);
      }

      // Ajouter les shipping marks
      let shippingMarks: any[] = [];
      if (clientData.shipping_marks && clientData.shipping_marks.length > 0) {
        shippingMarks = await clientShippingMarkService.replaceClientShippingMarks(
          newClient.id, 
          clientData.shipping_marks
        );
      }

      return {
        ...newClient,
        shipping_marks: shippingMarks
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création du client: ${error}`);
    }
  },

  // Mettre à jour un client et ses shipping marks
  async update(clientId: number, clientData: Partial<ClientFormData>): Promise<ClientWithShippingMarks> {
    try {
      console.log('🔄 Mise à jour du client:', { clientId, clientData });
      
      // Mettre à jour les informations du client
      const clientUpdates: any = {};
      if (clientData.nom !== undefined) clientUpdates.nom = clientData.nom;
      if (clientData.prenom !== undefined) clientUpdates.prenom = clientData.prenom;
      if (clientData.pseudo !== undefined) clientUpdates.pseudo = clientData.pseudo;
      if (clientData.entreprise !== undefined) clientUpdates.entreprise = clientData.entreprise || null;
      if (clientData.quartier_ville !== undefined) clientUpdates.quartier_ville = clientData.quartier_ville || null;
      if (clientData.telephone !== undefined) clientUpdates.telephone = clientData.telephone || null;

      console.log('📝 Données à mettre à jour:', clientUpdates);

      const { data: updatedClient, error: clientError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientId)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Erreur mise à jour client:', clientError);
        throw new Error(`Erreur lors de la mise à jour du client: ${clientError.message}`);
      }

      console.log('✅ Client mis à jour:', updatedClient);

      // Mettre à jour les shipping marks si fournies
      let shippingMarks: any[] = [];
      if (clientData.shipping_marks !== undefined && Array.isArray(clientData.shipping_marks)) {
        console.log('🏷️ Mise à jour des shipping marks:', clientData.shipping_marks);
        shippingMarks = await clientShippingMarkService.replaceClientShippingMarks(
          clientId, 
          clientData.shipping_marks
        );
      } else {
        console.log('🏷️ Pas de shipping marks dans les données de mise à jour, conservation des existantes');
        // Récupérer les shipping marks existantes
        shippingMarks = await clientShippingMarkService.getByClientId(clientId);
      }

      const result = {
        ...updatedClient,
        shipping_marks: shippingMarks
      };
      
      console.log('✅ Résultat final de la mise à jour:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur générale mise à jour client:', error);
      throw new Error(`Erreur lors de la mise à jour du client: ${error}`);
    }
  },

  // Supprimer un client (et toutes ses shipping marks)
  async delete(clientId: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      throw new Error(`Erreur lors de la suppression du client: ${error.message}`);
    }
    // Les shipping marks seront automatiquement supprimées grâce à la contrainte CASCADE
  },

  // Récupérer un client par ID avec ses shipping marks
  async getById(clientId: number): Promise<ClientWithShippingMarks | null> {
    return clientShippingMarkService.getClientWithShippingMarks(clientId);
  },

  // Récupérer tous les clients avec leurs shipping marks
  async getAll(): Promise<ClientWithShippingMarks[]> {
    return clientShippingMarkService.getAllClientsWithShippingMarks();
  }
};