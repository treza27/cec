import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeService, Employee, EmployeeFormData } from '../services/employeeService';
import { supabase } from '../utils/supabase';
import { uploadAvatar, deleteAvatar } from '../utils/avatarService';
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
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('employee-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: employeeKeys.profile(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      queryClient.setQueryData(employeeKeys.profile(userId), updatedProfile);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  });

  // Mutation pour uploader la photo de profil
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');
      return uploadAvatar(file, user.id);
    },
    onSuccess: (publicUrl) => {
      toast.success('Photo de profil mise à jour !');
      queryClient.setQueryData(employeeKeys.profile(userId), (old: Employee | null | undefined) => {
        if (!old) return old;
        return { ...old, profile_picture_url: publicUrl };
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation pour supprimer la photo de profil
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');
      return deleteAvatar(user.id);
    },
    onSuccess: () => {
      toast.success('Photo de profil supprimée.');
      queryClient.setQueryData(employeeKeys.profile(userId), (old: Employee | null | undefined) => {
        if (!old) return old;
        return { ...old, profile_picture_url: null };
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Fonction pour créer un profil par défaut si il n'existe pas
  const createDefaultProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const defaultProfile: EmployeeFormData = {
        full_name: user.user_metadata?.full_name || 'Agent Continental Express',
        email: user.email || 'agent@cec-cargo.mg',
        telephone: '+261 34 12 345 67',
        role: 'acheteur',
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
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    createDefaultProfile,
    refreshProfile,

    // États des mutations
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isDeletingAvatar: deleteAvatarMutation.isPending,
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