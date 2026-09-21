import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { achatService, DemandeAchatFormData, DemandeAchatAcheteurData } from '../services/achatService';
import { StatutDemandeAchat } from '../types';
import toast from 'react-hot-toast';

export interface AchatFilters {
  statut?: StatutDemandeAchat;
  cree_par_id?: string;
  assigne_a_id?: string;
  date_from?: string;
  date_to?: string;
}

export const achatKeys = {
  all: ['achats'] as const,
  list: (filters?: AchatFilters, page?: number) => [...achatKeys.all, 'list', filters, page] as const,
  counts: (filters?: Pick<AchatFilters, 'cree_par_id' | 'assigne_a_id'>) => [...achatKeys.all, 'counts', filters] as const,
  detail: (id: number) => [...achatKeys.all, 'detail', id] as const,
};

const PAGE_SIZE = 100;

export const useAchats = (filters?: AchatFilters, page: number = 1) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const {
    data: pageResult,
    isLoading: loading,
    error,
    refetch: refreshAchats,
  } = useQuery({
    queryKey: achatKeys.list(filters, page),
    queryFn: () => achatService.getAll(filters, { page, pageSize: PAGE_SIZE }),
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const {
    data: statsCounts = {},
  } = useQuery({
    queryKey: achatKeys.counts({ cree_par_id: filters?.cree_par_id, assigne_a_id: filters?.assigne_a_id }),
    queryFn: () => achatService.getCount({ cree_par_id: filters?.cree_par_id, assigne_a_id: filters?.assigne_a_id }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('demandes-achat-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandes_achat' },
        () => {
          queryClient.invalidateQueries({ queryKey: achatKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const createMutation = useMutation({
    mutationFn: (formData: DemandeAchatFormData) => achatService.create(formData),
    onSuccess: () => {
      toast.success('Demande d\'achat créée avec succès !');
      queryClient.invalidateQueries({ queryKey: achatKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateAcheteurMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: DemandeAchatAcheteurData }) =>
      achatService.updateAcheteur(id, updates),
    onSuccess: () => {
      toast.success('Demande mise à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: achatKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateStatutMutation = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: StatutDemandeAchat }) =>
      achatService.updateStatut(id, statut),
    onSuccess: () => {
      toast.success('Statut mis à jour !');
      queryClient.invalidateQueries({ queryKey: achatKeys.all });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => achatService.delete(id),
    onSuccess: () => {
      toast.success('Demande supprimée avec succès !');
      queryClient.invalidateQueries({ queryKey: achatKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    demandes: pageResult?.demandes ?? [],
    total: pageResult?.total ?? 0,
    totalPages: pageResult?.totalPages ?? 1,
    currentPage: page,
    pageSize: PAGE_SIZE,
    statsCounts,
    loading,
    error: error?.message || null,
    refreshAchats,
    createDemande: createMutation.mutateAsync,
    updateAcheteur: updateAcheteurMutation.mutateAsync,
    updateStatut: updateStatutMutation.mutateAsync,
    deleteDemande: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateAcheteurMutation.isPending || updateStatutMutation.isPending,
    isDeleting: deleteMutation.isPending,
    currentUserId: userId,
  };
};

export const useAchatDetail = (id: number | null) => {
  const queryClient = useQueryClient();

  const {
    data: demande,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: achatKeys.detail(id!),
    queryFn: () => achatService.getById(id!),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`demande-achat-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandes_achat', filter: `id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: achatKeys.detail(id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, id]);

  return {
    demande: demande ?? null,
    loading,
    error: error?.message || null,
    refetch,
  };
};
