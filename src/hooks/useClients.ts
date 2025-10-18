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
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: (data) => {
      // Optimisation : trier côté client pour éviter les re-renders
      return data.sort((a, b) => a.nom.localeCompare(b.nom));
    },
  });

  // Extraire toutes les shipping marks uniques de tous les clients
  const shippingMarks = clientsWithMarks
    .flatMap(client => client.shipping_marks.map(mark => mark.shipping_mark))
    .filter((mark, index, array) => mark && array.indexOf(mark) === index)
    .sort();

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    console.log('🔄 Configuration de la synchronisation temps réel pour les clients');
    console.log('📊 Clients actuels dans le cache:', clientsWithMarks);
    
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('👥 Changement détecté dans les clients:', payload);
          console.log('📝 Type d\'événement:', payload.eventType);
          console.log('📄 Données:', payload.new || payload.old);
          
          // Invalider et refetch les données
          queryClient.invalidateQueries({ queryKey: ['clients', userId] });
          console.log('🔄 Cache invalidé pour les clients');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_shipping_marks'
        },
        (payload) => {
          console.log('🏷️ Changement détecté dans les shipping marks:', payload);
          console.log('📝 Type d\'événement:', payload.eventType);
          console.log('📄 Données:', payload.new || payload.old);
          
          // Invalider et refetch les données des clients
          queryClient.invalidateQueries({ queryKey: ['clients', userId] });
          console.log('🔄 Cache invalidé pour les clients (shipping marks)');
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de la synchronisation clients:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur de synchronisation temps réel pour les clients');
        }
      });

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🔌 Déconnexion de la synchronisation temps réel des clients');
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId, clientsWithMarks.length]);

  return {
    clients: clientsWithMarks,
    shippingMarks,
    loading,
    error: error?.message || null,
    refreshClients,
  };
};