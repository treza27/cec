import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { noteInterneService } from '../services/noteInterneService';
import toast from 'react-hot-toast';

export const notesKeys = {
  byDemande: (demandeId: number) => ['notes-internes', demandeId] as const,
};

export const useNotesInternes = (demandeAchatId: number | null) => {
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: notesKeys.byDemande(demandeAchatId!),
    queryFn: () => noteInterneService.getByDemandeId(demandeAchatId!),
    enabled: !!demandeAchatId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!demandeAchatId) return;

    const channel = supabase
      .channel(`notes-internes-${demandeAchatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes_internes',
          filter: `demande_achat_id=eq.${demandeAchatId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: notesKeys.byDemande(demandeAchatId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, demandeAchatId]);

  const createNoteMutation = useMutation({
    mutationFn: (message: string) => noteInterneService.create(demandeAchatId!, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.byDemande(demandeAchatId!) });
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'envoi du message: ${error.message}`);
    },
  });

  return {
    notes,
    loading,
    error: error?.message || null,
    refetch,
    createNote: createNoteMutation.mutateAsync,
    isSending: createNoteMutation.isPending,
  };
};
