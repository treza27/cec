import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { achatArticleService, AchatArticleFormData, AchatArticleUpdateData } from '../services/achatArticleService';

export const achatArticleKeys = {
  all: ['achat-articles'] as const,
  byDemande: (demandeId: number) => [...achatArticleKeys.all, 'demande', demandeId] as const,
};

export const useAchatArticles = (demandeId: number | null) => {
  const queryClient = useQueryClient();

  const {
    data: articles = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: achatArticleKeys.byDemande(demandeId!),
    queryFn: () => achatArticleService.getByDemandeId(demandeId!),
    enabled: !!demandeId,
    staleTime: 3 * 60 * 1000,
  });

  useEffect(() => {
    if (!demandeId) return;

    const channel = supabase
      .channel(`achat-articles-${demandeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'achat_articles', filter: `demande_achat_id=eq.${demandeId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: achatArticleKeys.byDemande(demandeId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, demandeId]);

  const createMutation = useMutation({
    mutationFn: (formData: AchatArticleFormData) => achatArticleService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achatArticleKeys.byDemande(demandeId!) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: AchatArticleUpdateData }) =>
      achatArticleService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achatArticleKeys.byDemande(demandeId!) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => achatArticleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achatArticleKeys.byDemande(demandeId!) });
    },
  });

  return {
    articles,
    loading,
    error: error?.message || null,
    refetch,
    createArticle: createMutation.mutateAsync,
    updateArticle: updateMutation.mutateAsync,
    deleteArticle: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
