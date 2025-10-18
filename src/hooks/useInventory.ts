import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryService } from '../services/inventoryService';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabase';
import { convertFromSupabase } from '../services/inventoryService';
import { useEffect, useState } from 'react';

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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: (data) => {
      // Optimisation : trier côté client
      return data.sort((a, b) => b.id - a.id);
    },
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    console.log('🔄 Configuration de la synchronisation temps réel pour l\'inventaire');
    
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
          console.log('📦 Changement détecté dans l\'inventaire:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              // Nouvel item ajouté
              const newItem = convertFromSupabase(payload.new as any);
              queryClient.setQueryData<InventoryItem[]>(inventoryKeys.lists(userId), (old = []) => {
                // Vérifier si l'item existe déjà pour éviter les doublons
                const exists = old.some(item => item.id === newItem.id);
                if (!exists) {
                  toast.success(`Nouveau colis ajouté: ${newItem.shippingMark || newItem.description}`);
                  return [newItem, ...old];
                }
                return old;
              });
              break;
              
            case 'UPDATE':
              // Item mis à jour
              const updatedItem = convertFromSupabase(payload.new as any);
              queryClient.setQueryData<InventoryItem[]>(inventoryKeys.lists(userId), (old = []) => {
                const updated = old.map(item => 
                  item.id === updatedItem.id ? updatedItem : item
                );
                toast.success(`Colis mis à jour: ${updatedItem.shippingMark || updatedItem.description}`);
                return updated;
              });
              break;
              
            case 'DELETE':
              // Item supprimé
              const deletedId = payload.old.id;
              queryClient.setQueryData<InventoryItem[]>(inventoryKeys.lists(userId), (old = []) => {
                const filtered = old.filter(item => item.id !== deletedId);
                toast.success(`Colis supprimé`);
                return filtered;
              });
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de la synchronisation:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur de synchronisation temps réel pour l\'inventaire');
        }
      });

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🔌 Déconnexion de la synchronisation temps réel');
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  // Mutation pour ajouter un item
  const addItemMutation = useMutation({
    mutationFn: (item: Omit<InventoryItem, 'id'>) => inventoryService.create(item),
    onSuccess: (newItem) => {
      // Le toast sera affiché par la synchronisation temps réel
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'ajout: ${error.message}`);
      console.error('Erreur lors de l\'ajout:', error);
    }
  });

  // Mutation pour mettre à jour un item
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InventoryItem> }) =>
      inventoryService.update(id, updates),
    onSuccess: (updatedItem) => {
      // Le toast sera affiché par la synchronisation temps réel
      // Invalider et refetch la liste
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
      // Le toast sera affiché par la synchronisation temps réel
      // Invalider et refetch la liste
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
      // Le toast sera affiché par la synchronisation temps réel
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
    addItem: addItemMutation.mutateAsync,
    updateItem: (id: number, updates: Partial<InventoryItem>) =>
      updateItemMutation.mutateAsync({ id, updates }),
    deleteItem: deleteItemMutation.mutateAsync,
    updateStatus: (ids: number[], status: string) =>
      updateStatusMutation.mutateAsync({ ids, status }),
    updateMeasuredValues: (id: number, measuredValues: any) =>
      updateMeasuredValuesMutation.mutateAsync({ id, measuredValues }),
    archiveItem: archiveItemMutation.mutateAsync,
    refreshItems,
    
    // États des mutations
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
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