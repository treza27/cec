import { supabase } from '../utils/supabase';
import { DeliveryReceipt, InventoryItem } from '../types';

export interface DeliveryReceiptUpload {
  depart_id: number;
  client_id: number;
  pseudo: string;
  colis_ids: number[];
  shipping_marks: string[];
  file: File;
}

export const deliveryReceiptService = {
  // Uploader un bon de livraison PDF
  async uploadDeliveryReceipt(uploadData: DeliveryReceiptUpload): Promise<DeliveryReceipt> {
    if (uploadData.file.type !== 'application/pdf') {
      throw new Error('Seuls les fichiers PDF sont autorisés pour les bons de livraison');
    }

    if (uploadData.file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier PDF est trop volumineux (max 10MB)');
    }

    const timestamp = Date.now();
    const fileName = `bon_livraison_${uploadData.depart_id}_${uploadData.client_id}_${timestamp}.pdf`;
    const filePath = `delivery_receipts/${uploadData.depart_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('package-images')
      .upload(filePath, uploadData.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Erreur d'upload: ${uploadError.message}`);
    }

    const { data: receiptData, error: dbError } = await supabase
      .from('package_images')
      .insert({
        depart_id: uploadData.depart_id,
        client_id: uploadData.client_id,
        file_name: uploadData.file.name,
        file_path: filePath,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
        image_type: 'delivery_receipt'
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from('package-images').remove([filePath]);
      throw new Error(`Erreur base de données: ${dbError.message}`);
    }

    return {
      id: receiptData.id,
      depart_id: uploadData.depart_id,
      client_id: uploadData.client_id,
      file_name: receiptData.file_name,
      file_path: receiptData.file_path,
      file_size: receiptData.file_size,
      created_at: receiptData.created_at,
      colis_ids: uploadData.colis_ids,
      pseudo: uploadData.pseudo,
      shipping_marks: uploadData.shipping_marks
    };
  },

  // Récupérer tous les bons de livraison d'un départ
  async getDeliveryReceiptsByDepart(departId: number): Promise<DeliveryReceipt[]> {
    const { data, error } = await supabase
      .from('package_images')
      .select(`
        *,
        clients(pseudo)
      `)
      .eq('depart_id', departId)
      .eq('image_type', 'delivery_receipt')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des bons de livraison: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      depart_id: item.depart_id,
      client_id: item.client_id,
      file_name: item.file_name,
      file_path: item.file_path,
      file_size: item.file_size,
      created_at: item.created_at,
      colis_ids: [],
      pseudo: item.clients ? item.clients.pseudo : 'Client inconnu',
      shipping_marks: []
    }));
  },

  // Récupérer tous les bons de livraison d'un client
  async getDeliveryReceiptsByClient(clientId: number): Promise<DeliveryReceipt[]> {
    const { data, error } = await supabase
      .from('package_images')
      .select(`
        *,
        depart(num_bl, date_arrivee_tana)
      `)
      .eq('client_id', clientId)
      .eq('image_type', 'delivery_receipt')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des bons de livraison: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      depart_id: item.depart_id,
      client_id: item.client_id,
      file_name: item.file_name,
      file_path: item.file_path,
      file_size: item.file_size,
      created_at: item.created_at,
      colis_ids: [],
      pseudo: '',
      shipping_marks: []
    }));
  },

  // Générer une URL signée pour télécharger un bon de livraison
  async getDeliveryReceiptUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('package-images')
      .createSignedUrl(filePath, 3600);

    if (error) {
      throw new Error(`Erreur lors de la génération de l'URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  // Supprimer un bon de livraison
  async deleteDeliveryReceipt(receiptId: string): Promise<void> {
    const { data: receiptData, error: fetchError } = await supabase
      .from('package_images')
      .select('file_path')
      .eq('id', receiptId)
      .single();

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération du bon de livraison: ${fetchError.message}`);
    }

    const { error: storageError } = await supabase.storage
      .from('package-images')
      .remove([receiptData.file_path]);

    if (storageError) {
      console.warn('Erreur suppression storage:', storageError.message);
    }

    const { error: dbError } = await supabase
      .from('package_images')
      .delete()
      .eq('id', receiptId);

    if (dbError) {
      throw new Error(`Erreur lors de la suppression: ${dbError.message}`);
    }
  },

  // Grouper les colis d'un départ par client
  async getClientDeliveryGroups(departId: number, inventoryItems: InventoryItem[]): Promise<any[]> {
    const { data: departData, error: departError } = await supabase
      .from('depart')
      .select('colis_associes')
      .eq('id', departId)
      .single();

    if (departError) {
      throw new Error(`Erreur lors de la récupération du départ: ${departError.message}`);
    }

    const colisIds = departData.colis_associes || [];
    const associatedColis = inventoryItems.filter(item => colisIds.includes(item.id));

    const shippingMarks = associatedColis
      .map(colis => colis.shippingMark)
      .filter(mark => mark && mark.trim() !== '');

    if (shippingMarks.length === 0) {
      return [];
    }

    const { data: clientsData, error: clientsError } = await supabase
      .from('client_shipping_marks')
      .select(`
        client_id,
        shipping_mark,
        clients(id, pseudo)
      `)
      .in('shipping_mark', shippingMarks)
      .eq('is_active', true);

    if (clientsError) {
      throw new Error(`Erreur lors de la récupération des clients: ${clientsError.message}`);
    }

    const clientGroups: { [key: number]: any } = {};

    clientsData?.forEach(item => {
      const clientId = item.client_id;
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = {
          client_id: clientId,
          pseudo: item.clients.pseudo,
          shipping_marks: [],
          colis: [],
          delivery_receipts: []
        };
      }
      clientGroups[clientId].shipping_marks.push(item.shipping_mark);
    });

    associatedColis.forEach(colis => {
      const clientData = clientsData?.find(c => c.shipping_mark === colis.shippingMark);
      if (clientData) {
        const clientId = clientData.client_id;
        if (clientGroups[clientId]) {
          clientGroups[clientId].colis.push(colis);
        }
      }
    });

    const { data: receiptsData, error: receiptsError } = await supabase
      .from('package_images')
      .select('*')
      .eq('depart_id', departId)
      .eq('image_type', 'delivery_receipt');

    if (!receiptsError && receiptsData) {
      receiptsData.forEach(receipt => {
        if (receipt.client_id && clientGroups[receipt.client_id]) {
          clientGroups[receipt.client_id].delivery_receipts.push({
            id: receipt.id,
            depart_id: receipt.depart_id,
            client_id: receipt.client_id,
            file_name: receipt.file_name,
            file_path: receipt.file_path,
            file_size: receipt.file_size,
            created_at: receipt.created_at,
            colis_ids: [],
            pseudo: clientGroups[receipt.client_id].pseudo,
            shipping_marks: clientGroups[receipt.client_id].shipping_marks
          });
        }
      });
    }

    return Object.values(clientGroups);
  }
};