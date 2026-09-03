import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { clientShippingMarkService, ClientWithShippingMarks } from '../services/clientShippingMarkService';

// Réexporter le type depuis le service
export type Client = ClientWithShippingMarks;

export const useClients = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID utilisateur actuel
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const {
    data: clientsWithMarks = [],
    isLoading: loading,
    error,
    refetch: refreshClients
  } = useQuery({
    queryKey: ['clients', userId],
    queryFn: clientShippingMarkService.getAllClientsWithShippingMarks,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    select: (data) => {
      // Optimisation : trier côté client pour éviter les re-renders
      return data.sort((a, b) => {
        const aValue = a.nom ?? '';
        const bValue = b.nom ?? '';
        return aValue.localeCompare(bValue);
      });
    },
  });

  // Extraire toutes les shipping marks uniques de tous les clients
  const shippingMarks = clientsWithMarks
    .flatMap(client => client.shipping_marks.map(mark => mark.shipping_mark))
    .filter((mark, index, array) => mark && array.indexOf(mark) === index)
    .sort();

  // Extraire tous les pseudos uniques de tous les clients
  const pseudos = clientsWithMarks
    .map(client => client.pseudo)
    .filter((pseudo, index, array) => pseudo && array.indexOf(pseudo) === index)
    .sort();

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients', userId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_shipping_marks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return {
    clients: clientsWithMarks,
    shippingMarks,
    pseudos,
    loading,
    error: error?.message || null,
    refreshClients,
  };
};