import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteDebitService, NoteDebitCreateData, NoteDebitUpdateData } from '../services/noteDebitService';
import toast from 'react-hot-toast';

export const noteDebitKeys = {
  all: ['notes_debit'] as const,
  byDepart: (departId: number) => [...noteDebitKeys.all, 'depart', departId] as const,
};

export const useNotesDebit = (departId: number) => {
  const queryClient = useQueryClient();

  const {
    data: notesDebit = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: noteDebitKeys.byDepart(departId),
    queryFn: () => noteDebitService.getByDepartId(departId),
    enabled: departId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: NoteDebitCreateData) => noteDebitService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteDebitKeys.byDepart(departId) });
      toast.success('Note de Débit générée avec succès !');
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => noteDebitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteDebitKeys.byDepart(departId) });
      queryClient.invalidateQueries({ queryKey: noteDebitKeys.all });
      toast.success('Note de Débit supprimée.');
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: NoteDebitUpdateData }) => noteDebitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteDebitKeys.byDepart(departId) });
      queryClient.invalidateQueries({ queryKey: noteDebitKeys.all });
      toast.success('Note de Débit modifiée avec succès !');
    },
    onError: (err: Error) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  return {
    notesDebit,
    loading,
    error,
    refetch,
    createNote: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteNote: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateNote: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useAllNotesDebit = () => {
  const queryClient = useQueryClient();

  const {
    data: allNotesDebit = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: noteDebitKeys.all,
    queryFn: () => noteDebitService.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  return {
    allNotesDebit,
    loading,
    error,
    refetch,
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: noteDebitKeys.all }),
  };
};
