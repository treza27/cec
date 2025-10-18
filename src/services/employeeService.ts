import { supabase } from '../utils/supabase';

export interface Employee {
  user_id: string;
  full_name: string | null;
  email: string | null;
  telephone: string | null;
  role: string | null;
  departement: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  full_name: string;
  email: string;
  telephone: string;
  role: string;
  departement: string;
}

export const employeeService = {
  // Récupérer le profil de l'employé connecté
  async getCurrentProfile(): Promise<Employee | null> {
    try {
      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer le profil employé
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw new Error(`Erreur lors de la récupération du profil: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du profil: ${error}`);
    }
  },

  // Créer un nouveau profil employé
  async createProfile(profileData: EmployeeFormData): Promise<Employee> {
    try {
      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('employees')
        .insert({
          user_id: user.id,
          full_name: profileData.full_name,
          email: profileData.email,
          telephone: profileData.telephone,
          role: profileData.role,
          departement: profileData.departement
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du profil: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la création du profil: ${error}`);
    }
  },

  // Mettre à jour le profil employé
  async updateProfile(profileData: Partial<EmployeeFormData>): Promise<Employee> {
    try {
      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('employees')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du profil: ${error}`);
    }
  },

  // Récupérer le profil par ID utilisateur (pour les admins)
  async getProfileByUserId(userId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Erreur lors de la récupération du profil: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du profil: ${error}`);
    }
  },

  // Récupérer tous les employés (pour les admins)
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors de la récupération des employés: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des employés: ${error}`);
    }
  }
};