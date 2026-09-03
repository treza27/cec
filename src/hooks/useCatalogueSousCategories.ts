import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogueService, CatalogueSousCategorie } from '../services/catalogueService';
import toast from 'react-hot-toast';

export const catalogueSousCategoriesKeys = {
  all: ['catalogue_sous_categories'] as const,
  list: (categorieId?: string) => [...catalogueSousCategoriesKeys.all, 'list', categorieId ?? null] as const,
};

export function useCatalogueSousCategories(categorieId?: string) {
  return useQuery({
    queryKey: catalogueSousCategoriesKeys.list(categorieId),
    queryFn: () => catalogueService.getSousCategories(categorieId),
  });
}

export function useCreateSousCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.createSousCategorie,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueSousCategoriesKeys.all });
      toast.success('Sous-catégorie créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateSousCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<CatalogueSousCategorie, 'nom' | 'code' | 'ordre'>> }) =>
      catalogueService.updateSousCategorie(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueSousCategoriesKeys.all });
      toast.success('Sous-catégorie mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteSousCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.deleteSousCategorie,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueSousCategoriesKeys.all });
      toast.success('Sous-catégorie supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
