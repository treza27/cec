import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogueService, CatalogueCategorie } from '../services/catalogueService';
import toast from 'react-hot-toast';

export const catalogueCategoriesKeys = {
  all: ['catalogue_categories'] as const,
  list: () => [...catalogueCategoriesKeys.all, 'list'] as const,
};

export function useCatalogueCategories() {
  return useQuery({
    queryKey: catalogueCategoriesKeys.list(),
    queryFn: catalogueService.getCategories,
  });
}

export function useCreateCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.createCategorie,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueCategoriesKeys.all });
      toast.success('Catégorie créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<CatalogueCategorie, 'nom' | 'description' | 'code' | 'ordre'>> }) =>
      catalogueService.updateCategorie(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueCategoriesKeys.all });
      toast.success('Catégorie mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteCategorie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.deleteCategorie,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueCategoriesKeys.all });
      toast.success('Catégorie supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
