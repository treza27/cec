import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { faqService } from '../services/faqService';
import { FaqItem } from '../types';
import { supabase } from '../utils/supabase';
import { useEffect } from 'react';

// Clés de requête pour React Query
export const faqKeys = {
  all: ['faq'] as const,
  lists: () => [...faqKeys.all, 'list'] as const,
  categories: () => [...faqKeys.all, 'categories'] as const,
  byCategory: (category: string) => [...faqKeys.lists(), 'category', category] as const,
  search: (query: string, language: string) => [...faqKeys.all, 'search', query, language] as const,
};

// Hook principal pour récupérer les éléments FAQ
export const useFaqItems = () => {
  const queryClient = useQueryClient();

  // Récupérer tous les éléments FAQ actifs
  const {
    data: faqItems = [],
    isLoading: loading,
    error,
    refetch: refreshFaqItems
  } = useQuery({
    queryKey: faqKeys.lists(),
    queryFn: faqService.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes (FAQ change rarement)
    refetchOnWindowFocus: false,
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    console.log('🔄 Configuration de la synchronisation temps réel pour la FAQ');
    
    const channel = supabase
      .channel('faq-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faq_items'
        },
        (payload) => {
          console.log('❓ Changement détecté dans la FAQ:', payload);
          
          // Invalider le cache pour recharger les données
          queryClient.invalidateQueries({ queryKey: faqKeys.lists() });
          queryClient.invalidateQueries({ queryKey: faqKeys.categories() });
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de la synchronisation FAQ:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur de synchronisation temps réel pour la FAQ');
        }
      });

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🔌 Déconnexion de la synchronisation temps réel de la FAQ');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    // Données
    faqItems,
    loading,
    error: error?.message || null,
    
    // Actions
    refreshFaqItems,
  };
};

// Hook pour récupérer les catégories FAQ
export const useFaqCategories = () => {
  return useQuery({
    queryKey: faqKeys.categories(),
    queryFn: faqService.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour récupérer les éléments FAQ par catégorie
export const useFaqByCategory = (category: string) => {
  return useQuery({
    queryKey: faqKeys.byCategory(category),
    queryFn: () => faqService.getByCategory(category),
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour la recherche dans la FAQ
export const useFaqSearch = (query: string, language: 'fr' | 'en' = 'fr') => {
  return useQuery({
    queryKey: faqKeys.search(query, language),
    queryFn: () => faqService.search(query, language),
    enabled: query.length >= 2, // Recherche seulement si au moins 2 caractères
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour l'administration de la FAQ (pour les agents)
export const useFaqAdmin = () => {
  const queryClient = useQueryClient();

  // Récupérer tous les éléments FAQ (y compris inactifs)
  const {
    data: allFaqItems = [],
    isLoading: loading,
    error,
    refetch: refreshAllFaqItems
  } = useQuery({
    queryKey: [...faqKeys.all, 'admin'],
    queryFn: faqService.getAllIncludingInactive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour créer un élément FAQ
  const createFaqMutation = useMutation({
    mutationFn: (faqData: Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>) => 
      faqService.create(faqData),
    onSuccess: (newFaq) => {
      toast.success('Élément FAQ créé avec succès !');
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    }
  });

  // Mutation pour mettre à jour un élément FAQ
  const updateFaqMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<FaqItem, 'id' | 'created_at' | 'updated_at'>> }) =>
      faqService.update(id, updates),
    onSuccess: (updatedFaq) => {
      toast.success('Élément FAQ mis à jour avec succès !');
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  // Mutation pour supprimer (désactiver) un élément FAQ
  const deleteFaqMutation = useMutation({
    mutationFn: (id: number) => faqService.delete(id),
    onSuccess: () => {
      toast.success('Élément FAQ supprimé avec succès !');
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  return {
    // Données
    allFaqItems,
    loading,
    error: error?.message || null,
    
    // Actions
    createFaq: createFaqMutation.mutateAsync,
    updateFaq: (id: number, updates: any) => updateFaqMutation.mutateAsync({ id, updates }),
    deleteFaq: deleteFaqMutation.mutateAsync,
    refreshAllFaqItems,
    
    // États des mutations
    isCreating: createFaqMutation.isPending,
    isUpdating: updateFaqMutation.isPending,
    isDeleting: deleteFaqMutation.isPending,
  };
};