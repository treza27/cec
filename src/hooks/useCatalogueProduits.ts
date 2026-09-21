import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogueService, CatalogueProduit, CatalogueProduitPhoto } from '../services/catalogueService';
import toast from 'react-hot-toast';

export const catalogueProduitsKeys = {
  all: ['catalogue_produits'] as const,
  list: (categorieId?: string) => [...catalogueProduitsKeys.all, 'list', categorieId ?? null] as const,
  public: (categorieId?: string) => [...catalogueProduitsKeys.all, 'public', categorieId ?? null] as const,
};

export function useCatalogueProduits(categorieId?: string) {
  return useQuery({
    queryKey: catalogueProduitsKeys.list(categorieId),
    queryFn: () => catalogueService.getProduits(categorieId),
  });
}

export function useCatalogueProduitsPublic(categorieId?: string) {
  return useQuery({
    queryKey: catalogueProduitsKeys.public(categorieId),
    queryFn: () => catalogueService.getProduitsPublic(categorieId),
  });
}

export function useCreateProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.createProduit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueProduitsKeys.all });
      toast.success('Produit créé');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<CatalogueProduit, 'id' | 'numero' | 'reference_produit' | 'created_at' | 'updated_at'>> }) =>
      catalogueService.updateProduit(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueProduitsKeys.all });
      toast.success('Produit mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogueService.deleteProduit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueProduitsKeys.all });
      toast.success('Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useAddProduitPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ produitId, file, ordre }: { produitId: string; file: File; ordre: number }) =>
      catalogueService.addPhoto(produitId, file, ordre),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueProduitsKeys.all });
    },
    onError: () => toast.error('Erreur lors de l\'upload de la photo'),
  });
}

export function useDeleteProduitPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photo: CatalogueProduitPhoto) => catalogueService.deletePhoto(photo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogueProduitsKeys.all });
      toast.success('Photo supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
