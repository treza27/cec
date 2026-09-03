import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { departureService } from '../services/departureService';
import { DepartItem } from '../types';
import { supabase } from '../utils/supabase';
import { useEffect, useState } from 'react';
import { inventoryKeys } from './useInventory';

// Clés de requête pour React Query
export const departureKeys = {
  all: ['departures'] as const,
  lists: (userId?: string | null) => [...departureKeys.all, 'list', userId] as const,
  list: (filters: string, userId?: string | null) => [...departureKeys.lists(userId), { filters }] as const,
  details: () => [...departureKeys.all, 'detail'] as const,
  detail: (id: number) => [...departureKeys.details(), id] as const,
  allDepartures: (userId?: string | null) => [...departureKeys.all, 'all-including-archived', userId] as const,
  archived: (userId?: string | null) => [...departureKeys.all, 'archived', userId] as const,
};

export const useDepartures = () => {
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

  // Récupérer tous les départs
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch: refreshItems
  } = useQuery({
    queryKey: departureKeys.lists(userId),
    queryFn: () => departureService.getAll().then(items =>
      items.filter(item => item.statut !== 'archive')
    ),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    const channel = supabase
      .channel('departures-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'depart' },
        () => {
          queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'package_images', filter: 'depart_id=not.is.null' },
        () => {
          queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
  // Mutation pour ajouter un départ
  const addItemMutation = useMutation({
    mutationFn: (item: Omit<DepartItem, 'id'>) => departureService.create(item),
    onSuccess: (newItem) => {
      toast.success('Départ créé avec succès !');
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });

      // Mise à jour optimiste
      queryClient.setQueryData<DepartItem[]>(departureKeys.lists(userId), (old = []) => [
        newItem,
        ...old
      ]);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du départ: ${error.message}`);
      console.error('Erreur lors de l\'ajout du départ:', error);
    }
  });

  // Mutation pour mettre à jour un départ
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<DepartItem> }) =>
      departureService.update(id, updates),
    onSuccess: (updatedItem) => {
      toast.success('Départ mis à jour avec succès !');
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });

      // Mettre à jour l'item spécifique dans le cache
      queryClient.setQueryData<DepartItem[]>(departureKeys.lists(userId), (old = []) =>
        old.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du départ: ${error.message}`);
      console.error('Erreur lors de la mise à jour du départ:', error);
    }
  });

  // Mutation pour supprimer un départ
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => departureService.delete(id),
    onSuccess: (_, deletedId) => {
      toast.success('Départ supprimé avec succès !');
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });

      // Retirer l'item du cache
      queryClient.setQueryData<DepartItem[]>(departureKeys.lists(userId), (old = []) =>
        old.filter(item => item.id !== deletedId)
      );
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression du départ: ${error.message}`);
      console.error('Erreur lors de la suppression du départ:', error);
    }
  });

  // Mutation pour archiver un départ
  const archiveItemMutation = useMutation({
    mutationFn: (id: number) => departureService.archive(id),
    onSuccess: (archivedItem) => {
      toast.success(`Départ #${archivedItem.id} archivé avec succès !`);
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });

      // Retirer l'item du cache des départs actifs
      queryClient.setQueryData<DepartItem[]>(departureKeys.lists(userId), (old = []) =>
        old.filter(item => item.id !== archivedItem.id)
      );
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'archivage du départ: ${error.message}`);
      console.error('Erreur lors de l\'archivage du départ:', error);
    }
  });
  return {
    // Données
    items,
    loading,
    error: error?.message || null,
    
    // Actions
    addItem: addItemMutation.mutateAsync,
    updateItem: (id: number, updates: Partial<DepartItem>) =>
      updateItemMutation.mutateAsync({ id, updates }),
    deleteItem: deleteItemMutation.mutateAsync,
    archiveItem: archiveItemMutation.mutateAsync,
    refreshItems,
    
    // États des mutations
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isArchiving: archiveItemMutation.isPending,
  };
};

// Hook pour récupérer un départ spécifique
export const useDepartureItem = (id: number) => {
  return useQuery({
    queryKey: departureKeys.detail(id),
    queryFn: () => departureService.getById(id),
    enabled: !!id,
  });
};

// Hook pour récupérer les départs archivés
export const useArchivedDepartures = () => {
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

  const {
    data: archivedItems = [],
    isLoading: loading,
    error,
    refetch: refreshArchivedItems
  } = useQuery({
    queryKey: departureKeys.archived(userId),
    queryFn: departureService.getAllArchived,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation pour désarchiver un départ
  const unarchiveItemMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus?: string }) => 
      departureService.unarchive(id, newStatus),
    onSuccess: (unarchivedItem) => {
      console.log('✅ Mutation désarchivage réussie:', unarchivedItem);
      toast.success(`Départ #${unarchivedItem.id} désarchivé avec succès !`);
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: departureKeys.archived(userId) });
      queryClient.invalidateQueries({ queryKey: departureKeys.lists(userId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(userId) });
    },
    onError: (error) => {
      console.error('❌ Erreur mutation désarchivage:', error);
      toast.error(`Erreur lors du désarchivage: ${error.message}`);
      // Ne pas relancer l'erreur pour éviter les problèmes de session
    }
  });

  return {
    // Données
    archivedItems,
    loading,
    error: error?.message || null,
    
    // Actions
    unarchiveItem: (id: number, newStatus?: any) => 
      unarchiveItemMutation.mutateAsync({ id, newStatus }),
    refreshArchivedItems,
    
    // États des mutations
    isUnarchiving: unarchiveItemMutation.isPending,
  };
};

// Hook pour récupérer tous les départs (y compris archivés)
export const useAllDepartures = () => {
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

  const {
    data: allDepartures = [],
    isLoading: loading,
    error,
    refetch: refreshAllDepartures
  } = useQuery({
    queryKey: departureKeys.allDepartures(userId),
    queryFn: departureService.getAllIncludingArchived,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    const channel = supabase
      .channel('all-departures-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'depart' },
        () => {
          queryClient.invalidateQueries({ queryKey: departureKeys.allDepartures(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return {
    // Données
    allDepartures,
    loading,
    error: error?.message || null,
    
    // Actions
    refreshAllDepartures,
  };
}