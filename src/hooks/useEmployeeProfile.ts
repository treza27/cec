import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeService, Employee, EmployeeFormData } from '../services/employeeService';
import { supabase } from '../utils/supabase';
import { useEffect, useState } from 'react';

// Clés de requête pour React Query
export const employeeKeys = {
  all: ['employees'] as const,
  profile: (userId?: string | null) => [...employeeKeys.all, 'profile', userId] as const,
  byUserId: (userId: string) => [...employeeKeys.all, 'user', userId] as const,
};

export const useEmployeeProfile = () => {
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

  // Récupérer le profil de l'employé connecté
  const {
    data: profileData,
    isLoading: loading,
    error,
    refetch: refreshProfile
  } = useQuery({
    queryKey: employeeKeys.profile(userId),
    queryFn: employeeService.getCurrentProfile,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    console.log('🔄 Configuration de la synchronisation temps réel pour le profil employé');
    
    // Vérifier si l'utilisateur est connecté avant de configurer la synchronisation
    const checkUserAndSetupSync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('👤 Utilisateur non connecté, synchronisation temps réel ignorée');
        return;
      }

    const channel = supabase
      .channel('employee-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('👤 Changement détecté dans le profil employé:', payload);

          // Invalider et refetch les données du profil
          queryClient.invalidateQueries({ queryKey: employeeKeys.profile(user.id) });
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de la synchronisation profil employé:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Synchronisation temps réel activée pour le profil employé');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Erreur de synchronisation temps réel pour le profil employé - Vérifiez les politiques RLS');
        }
      });

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🔌 Déconnexion de la synchronisation temps réel du profil employé');
      supabase.removeChannel(channel);
    };
    };

    checkUserAndSetupSync();
  }, [queryClient, userId]);

  // Mutation pour créer un profil
  const createProfileMutation = useMutation({
    mutationFn: (profileData: EmployeeFormData) => employeeService.createProfile(profileData),
    onSuccess: (newProfile) => {
      toast.success('Profil créé avec succès !');
      // Mettre à jour le cache
      queryClient.setQueryData(employeeKeys.profile(userId), newProfile);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du profil: ${error.message}`);
      console.error('Erreur lors de la création du profil:', error);
    }
  });

  // Mutation pour mettre à jour un profil
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<EmployeeFormData>) => employeeService.updateProfile(updates),
    onSuccess: (updatedProfile) => {
      toast.success('Profil mis à jour avec succès !');
      // Mettre à jour le cache
      queryClient.setQueryData(employeeKeys.profile(userId), updatedProfile);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  });

  // Fonction pour créer un profil par défaut si il n'existe pas
  const createDefaultProfile = async () => {
    try {
      // Exclure le département des données à mettre à jour
      const { departement, ...updateData } = editData;
      await updateProfile(updateData);
      if (!user) return;

      const defaultProfile: EmployeeFormData = {
        full_name: user.user_metadata?.full_name || 'Agent Continental Express',
        email: user.email || 'agent@cec-cargo.mg',
        telephone: '+261 34 12 345 67',
        role: 'Agent Logistique',
        departement: 'Logistique Maritime'
      };

      await createProfileMutation.mutateAsync(defaultProfile);
    } catch (error) {
      console.error('Erreur lors de la création du profil par défaut:', error);
    }
  };

  return {
    // Données
    profileData,
    loading,
    profileLoading: loading,
    error: error?.message || null,
    
    // Actions
    createProfile: createProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    createDefaultProfile,
    refreshProfile,
    
    // États des mutations
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
  };
};

// Hook pour récupérer tous les employés (pour les admins)
export const useAllEmployees = () => {
  return useQuery({
    queryKey: [...employeeKeys.all, 'all'],
    queryFn: employeeService.getAllEmployees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer un employé par ID utilisateur
export const useEmployeeByUserId = (userId: string) => {
  return useQuery({
    queryKey: employeeKeys.byUserId(userId),
    queryFn: () => employeeService.getProfileByUserId(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};