import { supabase } from './supabase';

export interface PackageImage {
  id: string;
  inventaire_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  image_type: 'general' | 'msds' | 'chargement' | 'suivi_maritime' | 'reception';
  created_at: string;
}

export class SupabaseImageService {
  private static readonly BUCKET_NAME = 'package-images';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Upload une image pour un colis
   */
  static async uploadPackageImage(
    inventaireId: number,
    file: File,
    imageType: PackageImage['image_type'] = 'general'
  ): Promise<{ data: PackageImage | null; error: string | null }> {
    try {
      // Validation du fichier
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { data: null, error: validation.error };
      }

      // Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `inventaire/${inventaireId}/${imageType}/${fileName}`;

      // Upload du fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { data: null, error: `Erreur d'upload: ${uploadError.message}` };
      }

      // Enregistrer les métadonnées en base
      const { data: imageData, error: dbError } = await supabase
        .from('package_images')
        .insert({
          inventaire_id: inventaireId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          image_type: imageType
        })
        .select()
        .single();

      if (dbError) {
        // Nettoyer le fichier uploadé en cas d'erreur DB
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        return { data: null, error: `Erreur base de données: ${dbError.message}` };
      }

      return { data: imageData, error: null };
    } catch (error) {
      return { data: null, error: `Erreur inattendue: ${error}` };
    }
  }

  /**
   * Récupère toutes les images d'un colis
   */
  static async getPackageImages(inventaireId: number): Promise<{
    data: PackageImage[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('package_images')
        .select('*')
        .eq('inventaire_id', inventaireId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: `Erreur inattendue: ${error}` };
    }
  }

  /**
   * Génère une URL signée pour afficher une image
   */
  static async getImageUrl(filePath: string, expiresIn: number = 3600): Promise<{
    data: string | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.signedUrl, error: null };
    } catch (error) {
      return { data: null, error: `Erreur inattendue: ${error}` };
    }
  }

  /**
   * Supprime une image (fichier + métadonnées)
   */
  static async deletePackageImage(imageId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      // Récupérer les infos de l'image
      const { data: imageData, error: fetchError } = await supabase
        .from('package_images')
        .select('file_path')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([imageData.file_path]);

      if (storageError) {
        console.warn('Erreur suppression storage:', storageError.message);
      }

      // Supprimer les métadonnées
      const { error: dbError } = await supabase
        .from('package_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        return { success: false, error: dbError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: `Erreur inattendue: ${error}` };
    }
  }

  /**
   * Upload multiple images pour un colis
   */
  static async uploadMultipleImages(
    inventaireId: number,
    files: File[],
    imageType: PackageImage['image_type'] = 'general'
  ): Promise<{
    data: PackageImage[];
    errors: string[];
  }> {
    const results: PackageImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const { data, error } = await this.uploadPackageImage(inventaireId, file, imageType);
      
      if (data) {
        results.push(data);
      } else if (error) {
        errors.push(`${file.name}: ${error}`);
      }
    }

    return { data: results, errors };
  }

  /**
   * Valide un fichier avant upload
   */
  private static validateFile(file: File): { isValid: boolean; error: string } {
    // Vérifier la taille
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Le fichier est trop volumineux (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`
      };
    }

    // Vérifier le type MIME
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Type de fichier non supporté. Types autorisés: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    return { isValid: true, error: '' };
  }

  /**
   * Obtient les statistiques d'usage du storage
   */
  static async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('package_images')
        .select('file_size');

      if (error) {
        return { totalImages: 0, totalSize: 0, error: error.message };
      }

      const totalImages = data.length;
      const totalSize = data.reduce((sum, img) => sum + img.file_size, 0);

      return { totalImages, totalSize, error: null };
    } catch (error) {
      return { totalImages: 0, totalSize: 0, error: `Erreur inattendue: ${error}` };
    }
  }
}

// Types utilitaires
export type ImageUploadResult = {
  data: PackageImage | null;
  error: string | null;
};

export type MultipleImageUploadResult = {
  data: PackageImage[];
  errors: string[];
};