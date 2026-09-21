import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deliveryReceiptService, DeliveryReceiptUpload } from '../services/deliveryReceiptService';
import { DeliveryReceipt } from '../types';

// Clés de requête pour React Query
export const deliveryReceiptKeys = {
  all: ['delivery-receipts'] as const,
  byDepart: (departId: number) => [...deliveryReceiptKeys.all, 'depart', departId] as const,
  byClient: (clientId: number) => [...deliveryReceiptKeys.all, 'client', clientId] as const,
  clientGroups: (departId: number) => [...deliveryReceiptKeys.all, 'client-groups', departId] as const,
};

// Hook pour gérer les bons de livraison d'un départ
export const useDeliveryReceipts = (departId: number) => {
  const queryClient = useQueryClient();

  // Récupérer les bons de livraison d'un départ
  const {
    data: receipts = [],
    isLoading: loading,
    error,
    refetch: refreshReceipts
  } = useQuery({
    queryKey: deliveryReceiptKeys.byDepart(departId),
    queryFn: () => deliveryReceiptService.getDeliveryReceiptsByDepart(departId),
    enabled: !!departId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour uploader un bon de livraison
  const uploadReceiptMutation = useMutation({
    mutationFn: (uploadData: DeliveryReceiptUpload) => 
      deliveryReceiptService.uploadDeliveryReceipt(uploadData),
    onSuccess: (newReceipt) => {
      toast.success(`Bon de livraison uploadé pour ${newReceipt.client_name}`);
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: deliveryReceiptKeys.byDepart(departId) });
      queryClient.invalidateQueries({ queryKey: deliveryReceiptKeys.clientGroups(departId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'upload: ${error.message}`);
    }
  });

  // Mutation pour supprimer un bon de livraison
  const deleteReceiptMutation = useMutation({
    mutationFn: (receiptId: string) => 
      deliveryReceiptService.deleteDeliveryReceipt(receiptId),
    onSuccess: () => {
      toast.success('Bon de livraison supprimé');
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: deliveryReceiptKeys.byDepart(departId) });
      queryClient.invalidateQueries({ queryKey: deliveryReceiptKeys.clientGroups(departId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  return {
    // Données
    receipts,
    loading,
    error: error?.message || null,
    
    // Actions
    uploadReceipt: uploadReceiptMutation.mutateAsync,
    deleteReceipt: deleteReceiptMutation.mutateAsync,
    refreshReceipts,
    
    // États des mutations
    isUploading: uploadReceiptMutation.isPending,
    isDeleting: deleteReceiptMutation.isPending,
  };
};

// Hook pour récupérer les groupes de clients d'un départ
export const useClientDeliveryGroups = (departId: number, inventoryItems: any[]) => {
  return useQuery({
    queryKey: deliveryReceiptKeys.clientGroups(departId),
    queryFn: () => deliveryReceiptService.getClientDeliveryGroups(departId, inventoryItems),
    enabled: !!departId && inventoryItems.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer les bons de livraison d'un client
export const useClientDeliveryReceipts = (clientId: number) => {
  return useQuery({
    queryKey: deliveryReceiptKeys.byClient(clientId),
    queryFn: () => deliveryReceiptService.getDeliveryReceiptsByClient(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};