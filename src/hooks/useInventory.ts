import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryService, PAGE_SIZE } from '../services/inventoryService';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabase';
import { convertFromSupabase } from '../services/inventoryService';
import { useEffect, useState } from 'react';

export { PAGE_SIZE };

// Clés de requête pour React Query
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: (userId?: string | null) => [...inventoryKeys.all, 'list', userId] as const,
  list: (filters: string, userId?: string | null) => [...inventoryKeys.lists(userId), { filters }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
};

export const useInventory = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID utilisateur actuel
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Récupérer tous les items
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch: refreshItems
  } = useQuery({
    queryKey: inventoryKeys.lists(userId),
    queryFn: inventoryService.getAll,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    select: (data) => {
      // Optimisation : trier côté client
      return data.sort((a, b) => b.id - a.id);
    },
  });

  // Synchronisation en temps réel avec Supabase (optimisée)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventaire'
        },
        (payload) => {
          // Invalider les requêtes au lieu de manipuler directement le cache
          // Plus léger et évite les problèmes de synchronisation
          queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  // Mutation pour mettre à jour un item
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InventoryItem> }) =>
      inventoryService.update(id, updates),
    onSuccess: (updatedItem) => {
      toast.success('Colis mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      console.error('Erreur lors de la mise à jour:', error);
    }
  });

  // Mutation pour supprimer un item
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => inventoryService.delete(id),
    onSuccess: (_, deletedId) => {
      toast.success('Colis supprimé avec succès !');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error('Erreur lors de la suppression:', error);
    }
  });

  // Mutation pour supprimer plusieurs items
  const deleteMultipleItemsMutation = useMutation({
    mutationFn: (ids: number[]) => inventoryService.deleteMultiple(ids),
    onSuccess: (_, deletedIds) => {
      toast.success(`${deletedIds.length} colis supprimés avec succès !`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error('Erreur lors de la suppression:', error);
    }
  });

  // Mutation pour mettre à jour le statut de plusieurs items
  const updateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      inventoryService.updateStatus(ids, status),
    onSuccess: (_, { ids, status }) => {
      toast.success(`Statut mis à jour pour ${ids.length} colis`);
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du statut: ${error.message}`);
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  });

  // Mutation pour mettre à jour les valeurs mesurées
  const updateMeasuredValuesMutation = useMutation({
    mutationFn: ({ id, measuredValues }: {
      id: number;
      measuredValues: {
        nbPalettesTana?: string;
        nbCartonsTana?: string;
        poidsTana?: string;
        volumeTana?: string;
      }
    }) => inventoryService.updateMeasuredValues(id, measuredValues),
    onSuccess: () => {
      toast.success('Valeurs mesurées mises à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour des valeurs mesurées: ${error.message}`);
      console.error('Erreur lors de la mise à jour des valeurs mesurées:', error);
    }
  });

  // Mutation pour archiver un colis
  const archiveItemMutation = useMutation({
    mutationFn: (id: number) => inventoryService.archive(id),
    onSuccess: (archivedItem) => {
      toast.success(`Colis #${archivedItem.id} archivé avec succès !`);
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'archivage: ${error.message}`);
      console.error('Erreur lors de l\'archivage:', error);
    }
  });

  return {
    // Données
    items,
    loading,
    error: error?.message || null,

    // Actions
    updateItem: (id: number, updates: Partial<InventoryItem>) =>
      updateItemMutation.mutateAsync({ id, updates }),
    deleteItem: deleteItemMutation.mutateAsync,
    deleteMultipleItems: deleteMultipleItemsMutation.mutateAsync,
    updateStatus: (ids: number[], status: string) =>
      updateStatusMutation.mutateAsync({ ids, status }),
    updateMeasuredValues: (id: number, measuredValues: any) =>
      updateMeasuredValuesMutation.mutateAsync({ id, measuredValues }),
    archiveItem: archiveItemMutation.mutateAsync,
    refreshItems,

    // États des mutations
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isDeletingMultiple: deleteMultipleItemsMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingMeasuredValues: updateMeasuredValuesMutation.isPending,
    isArchiving: archiveItemMutation.isPending,
  };
};

// Hook pour récupérer tous les items (y compris archivés)
export const useAllInventoryItems = () => {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'all-including-archived'],
    queryFn: inventoryService.getAllIncludingArchived,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer un item spécifique
export const useInventoryItem = (id: number) => {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
  });
};

// Hook paginé pour l'inventaire
export const useInventoryPage = (page: number, search: string) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const queryKey = [...inventoryKeys.all, 'page', page, search, userId];

  const query = useQuery({
    queryKey,
    queryFn: () => inventoryService.getPage(page, search),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`inventory-page-${page}-${search}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventaire' }, () => {
        queryClient.invalidateQueries({ queryKey: [...inventoryKeys.all, 'page'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, userId, page, search]);

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    totalPages: Math.ceil((query.data?.total ?? 0) / PAGE_SIZE),
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
  };
};