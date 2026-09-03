import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articleService, Article, ArticleUpdate } from '../services/articleService';
import toast from 'react-hot-toast';

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  published: (categorie?: string) => [...articleKeys.all, 'published', categorie] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
  slug: (slug: string) => [...articleKeys.all, 'slug', slug] as const,
};

export function useArticles() {
  return useQuery({
    queryKey: articleKeys.lists(),
    queryFn: articleService.getAll,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublishedArticles(categorie?: string) {
  return useQuery({
    queryKey: articleKeys.published(categorie),
    queryFn: () => articleService.getPublished(categorie),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: articleKeys.slug(slug),
    queryFn: () => articleService.getBySlug(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      toast.success('Article créé avec succès');
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Erreur lors de la création');
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ArticleUpdate }) =>
      articleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      toast.success('Article mis à jour');
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Erreur lors de la mise à jour');
    },
  });
}

export function useTogglePublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      articleService.togglePublished(id, published),
    onSuccess: (_, { published }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      toast.success(published ? 'Article publié' : 'Article dépublié');
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Erreur');
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      toast.success('Article supprimé');
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Erreur lors de la suppression');
    },
  });
}
