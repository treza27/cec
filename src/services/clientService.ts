import { supabase } from '../utils/supabase';
import { clientShippingMarkService, ClientWithShippingMarks } from './clientShippingMarkService';

export interface ClientFormData {
  nom?: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone: string;
  statut_contact?: 'Prospect' | 'Client Argent' | 'Client Or' | 'Client Platine';
  shipping_marks: string[];
}

export interface ClientBasic {
  id: number;
  nom?: string;
  prenom: string;
  pseudo: string;
  entreprise?: string;
  quartier_ville?: string;
  telephone: string;
  created_at?: string;
  updated_at?: string;
}

export const clientService = {
  // Créer un nouveau client avec ses shipping marks
  async create(clientData: ClientFormData): Promise<ClientWithShippingMarks> {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        nom: clientData.nom || null,
        prenom: clientData.prenom,
        pseudo: clientData.pseudo,
        entreprise: clientData.entreprise || null,
        quartier_ville: clientData.quartier_ville || null,
        telephone: clientData.telephone,
        ...(clientData.statut_contact ? { statut_contact: clientData.statut_contact } : {})
      })
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur lors de la création du client: ${clientError.message}`);
    }

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
  },

  // Mettre à jour un client et ses shipping marks
  async update(clientId: number, clientData: Partial<ClientFormData>): Promise<ClientWithShippingMarks> {
    const clientUpdates: any = {};
    if (clientData.nom !== undefined) clientUpdates.nom = clientData.nom || null;
    if (clientData.prenom !== undefined) clientUpdates.prenom = clientData.prenom;
    if (clientData.pseudo !== undefined) clientUpdates.pseudo = clientData.pseudo;
    if (clientData.entreprise !== undefined) clientUpdates.entreprise = clientData.entreprise || null;
    if (clientData.quartier_ville !== undefined) clientUpdates.quartier_ville = clientData.quartier_ville || null;
    if (clientData.telephone !== undefined) clientUpdates.telephone = clientData.telephone;
    if (clientData.statut_contact !== undefined) clientUpdates.statut_contact = clientData.statut_contact;

    const { data: updatedClient, error: clientError } = await supabase
      .from('clients')
      .update(clientUpdates)
      .eq('id', clientId)
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur lors de la mise à jour du client: ${clientError.message}`);
    }

    let shippingMarks: any[] = [];
    if (clientData.shipping_marks !== undefined && Array.isArray(clientData.shipping_marks)) {
      shippingMarks = await clientShippingMarkService.replaceClientShippingMarks(
        clientId,
        clientData.shipping_marks
      );
    } else {
      shippingMarks = await clientShippingMarkService.getByClientId(clientId);
    }

    return {
      ...updatedClient,
      shipping_marks: shippingMarks
    };
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