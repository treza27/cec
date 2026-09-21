import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientShippingMarkService, ClientShippingMark } from '../services/clientShippingMarkService';

// Clés de requête pour React Query
export const clientShippingMarkKeys = {
  all: ['client-shipping-marks'],
  byClient: (clientId: number) => [...clientShippingMarkKeys.all, 'client', clientId],
  allUnique: () => [...clientShippingMarkKeys.all, 'unique'],
};

// Hook pour gérer les shipping marks d'un client spécifique
export const useClientShippingMarks = (clientId: number) => {
  const queryClient = useQueryClient();

  // Récupérer les shipping marks d'un client
  const {
    data: shippingMarks = [],
    isLoading: loading,
    error,
    refetch: refreshShippingMarks
  } = useQuery({
    queryKey: clientShippingMarkKeys.byClient(clientId),
    queryFn: () => clientShippingMarkService.getByClientId(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour ajouter une shipping mark
  const addShippingMarkMutation = useMutation({
    mutationFn: (shippingMark: string) => 
      clientShippingMarkService.addToClient(clientId, shippingMark),
    onSuccess: (newMark) => {
      toast.success(`Shipping mark "${newMark.shipping_mark}" ajoutée avec succès !`);
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.byClient(clientId) });
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.allUnique() });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'ajout: ${error.message}`);
    }
  });

  // Mutation pour supprimer une shipping mark
  const removeShippingMarkMutation = useMutation({
    mutationFn: (shippingMarkId: number) => 
      clientShippingMarkService.removeFromClient(shippingMarkId),
    onSuccess: () => {
      toast.success('Shipping mark supprimée avec succès !');
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.byClient(clientId) });
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.allUnique() });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Mutation pour mettre à jour une shipping mark
  const updateShippingMarkMutation = useMutation({
    mutationFn: ({ shippingMarkId, newValue }: { shippingMarkId: number; newValue: string }) =>
      clientShippingMarkService.update(shippingMarkId, newValue),
    onSuccess: (updatedMark) => {
      toast.success(`Shipping mark mise à jour: "${updatedMark.shipping_mark}"`);
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.byClient(clientId) });
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.allUnique() });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  // Mutation pour remplacer toutes les shipping marks d'un client
  const replaceAllShippingMarksMutation = useMutation({
    mutationFn: (shippingMarks: string[]) =>
      clientShippingMarkService.replaceClientShippingMarks(clientId, shippingMarks),
    onSuccess: (newMarks) => {
      toast.success(`${newMarks.length} shipping marks mises à jour !`);
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.byClient(clientId) });
      queryClient.invalidateQueries({ queryKey: clientShippingMarkKeys.allUnique() });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  return {
    // Données
    shippingMarks,
    loading,
    error: error?.message || null,
    
    // Actions
    addShippingMark: addShippingMarkMutation.mutateAsync,
    removeShippingMark: removeShippingMarkMutation.mutateAsync,
    updateShippingMark: (shippingMarkId: number, newValue: string) =>
      updateShippingMarkMutation.mutateAsync({ shippingMarkId, newValue }),
    replaceAllShippingMarks: replaceAllShippingMarksMutation.mutateAsync,
    refreshShippingMarks,
    
    // États des mutations
    isAdding: addShippingMarkMutation.isPending,
    isRemoving: removeShippingMarkMutation.isPending,
    isUpdating: updateShippingMarkMutation.isPending,
    isReplacing: replaceAllShippingMarksMutation.isPending,
  };
};

// Hook pour récupérer toutes les shipping marks uniques
export const useAllShippingMarks = () => {
  return useQuery({
    queryKey: clientShippingMarkKeys.allUnique(),
    queryFn: clientShippingMarkService.getAllUniqueShippingMarks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour vérifier si une shipping mark existe
export const useShippingMarkExists = () => {
  return useMutation({
    mutationFn: ({ shippingMark, excludeId }: { shippingMark: string; excludeId?: number }) =>
      clientShippingMarkService.checkShippingMarkExists(shippingMark, excludeId),
  });
};