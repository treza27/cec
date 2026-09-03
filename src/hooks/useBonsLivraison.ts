import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bonLivraisonService, BonLivraisonCreateData } from '../services/bonLivraisonService';
import toast from 'react-hot-toast';

export const bonLivraisonKeys = {
  all: ['bons_livraison'] as const,
  byDepart: (departId: number) => [...bonLivraisonKeys.all, 'depart', departId] as const,
};

export const useBonsLivraison = (departId: number) => {
  const queryClient = useQueryClient();

  const {
    data: bonsLivraison = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: bonLivraisonKeys.byDepart(departId),
    queryFn: () => bonLivraisonService.getByDepartId(departId),
    enabled: departId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: BonLivraisonCreateData) => bonLivraisonService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonLivraisonKeys.byDepart(departId) });
      toast.success('Bon de livraison généré avec succès !');
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bonLivraisonService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonLivraisonKeys.byDepart(departId) });
      toast.success('Bon de livraison supprimé.');
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  return {
    bonsLivraison,
    loading,
    error,
    refetch,
    createBon: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteBon: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
