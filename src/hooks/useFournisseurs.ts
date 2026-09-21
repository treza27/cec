import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fournisseurService, CatalogueFournisseur } from '../services/fournisseurService';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['catalogue_fournisseurs'] as const,
  list: () => [...KEYS.all, 'list'] as const,
};

export function useFournisseurs() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: fournisseurService.getFournisseurs,
  });
}

export function useCreateFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fournisseurService.createFournisseur,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Fournisseur ajouté');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<CatalogueFournisseur, 'id' | 'numero' | 'code_fournisseur' | 'created_at' | 'updated_at' | 'catalogue_categories'>> }) =>
      fournisseurService.updateFournisseur(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Fournisseur mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fournisseurService.deleteFournisseur,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Fournisseur supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
