import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Eye, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface DepartImageUploadProps {
  departId: number;
  imageType: 'chargement' | 'suivi_maritime' | 'reception';
  onImagesChange?: (imageCount: number) => void;
  maxImages?: number;
  className?: string;
}

interface UploadedImage {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  image_type: string;
  created_at: string;
}

export default function DepartImageUpload({
  departId,
  imageType,
  onImagesChange,
  maxImages = 10,
  className = ''
}: DepartImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Déterminer si on est en mode compact
  const isCompactMode = className.includes('compact-mode');

  // Charger les images existantes
  useEffect(() => {
    if (departId && departId > 0) {
      loadExistingImages();
    }
  }, [departId, imageType]);

  const loadExistingImages = async () => {
    try {
      console.log(`📸 Chargement des images pour départ ${departId}, type: ${imageType}`);
      const { data, error } = await supabase
        .from('package_images')
        .select('*')
        .eq('depart_id', departId)
        .eq('image_type', imageType)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des images:', error);
        setErrors([`Erreur de chargement: ${error.message}`]);
        return;
      }

      console.log(`📸 Images chargées:`, data);
      setImages(data || []);
      onImagesChange?.(data?.length || 0);
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setErrors([`Erreur inattendue: ${error}`]);
    }
  };

  const validateFile = (file: File): { isValid: boolean; error: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `Le fichier ${file.name} est trop volumineux (max 10MB)`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Type de fichier non supporté pour ${file.name}. Types autorisés: JPG, PNG, WebP, GIF`
      };
    }

    return { isValid: true, error: '' };
  };

  const uploadImage = async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validation du fichier
      const validation = validateFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `departs/${departId}/${imageType}/${fileName}`;

      // Upload du fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('package-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { success: false, error: `Erreur d'upload: ${uploadError.message}` };
      }

      // Enregistrer les métadonnées en base
      const { data: imageData, error: dbError } = await supabase
        .from('package_images')
        .insert({
          depart_id: departId,
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
        await supabase.storage.from('package-images').remove([filePath]);
        return { success: false, error: `Erreur base de données: ${dbError.message}` };
      }

      console.log('✅ Image uploadée avec succès:', imageData);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      return { success: false, error: `Erreur inattendue: ${error}` };
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Vérifier la limite d'images
    if (images.length + files.length > maxImages) {
      setErrors([`Maximum ${maxImages} images autorisées`]);
      return;
    }

    setUploading(true);
    setErrors([]);

    const uploadErrors: string[] = [];
    let successCount = 0;

    for (const file of files) {
      const result = await uploadImage(file);
      if (result.success) {
        successCount++;
      } else {
        uploadErrors.push(result.error || `Erreur pour ${file.name}`);
      }
    }

    if (uploadErrors.length > 0) {
      setErrors(uploadErrors);
    }

    if (successCount > 0) {
      // Recharger les images
      await loadExistingImages();
      console.log(`✅ ${successCount} image(s) uploadée(s) avec succès`);
      
      // Notifier le parent du changement
      onImagesChange?.(images.length + successCount);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string, filePath: string) => {
    try {
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('package-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Erreur suppression storage:', storageError.message);
      }

      // Supprimer les métadonnées
      const { error: dbError } = await supabase
        .from('package_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        setErrors([`Erreur lors de la suppression: ${dbError.message}`]);
        return;
      }

      // Recharger les images
      await loadExistingImages();
      console.log('🗑️ Image supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur suppression image:', error);
      setErrors([`Erreur de suppression: ${error}`]);
    }
  };

  const handlePreviewImage = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('package-images')
        .createSignedUrl(filePath, 3600); // 1 heure

      if (error) {
        setErrors([`Impossible de charger l'image: ${error.message}`]);
        return;
      }

      setPreviewImage(data.signedUrl);
    } catch (error) {
      setErrors([`Erreur de prévisualisation: ${error}`]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageTypeLabel = (type: string): string => {
    const labels = {
      chargement: 'Chargement',
      suivi_maritime: 'Suivi Maritime',
      reception: 'Réception'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <>
      <div className={`border-2 border-dashed border-gray-300 rounded-lg ${isCompactMode ? 'p-1' : 'p-4'} text-center hover:border-blue-400 transition-colors`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages || !departId || departId <= 0}
        />
        
        <div className={isCompactMode ? 'space-y-0.5' : 'space-y-2'}>
          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= maxImages || !departId || departId <= 0}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {!departId || departId <= 0 
                ? 'Sauvegardez d\'abord le départ' 
                : uploading 
                  ? 'Upload en cours...' 
                  : 'Cliquer pour sélectionner'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              ou glisser-déposer vos images ici
            </p>
          </div>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP, GIF jusqu'à 10MB • {images.length}/{maxImages} images
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-red-700">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des images */}
      {images.length > 0 && (
        <div className={isCompactMode ? 'space-y-1' : 'space-y-2'}>
          <h4 className="text-xs font-medium text-gray-700 flex items-center space-x-2">
            <ImageIcon className="w-3 h-3" />
            <span>Images {getImageTypeLabel(imageType)} ({images.length})</span>
          </h4>
          
          <div className="grid grid-cols-1 gap-2">
            {images.map((image) => (
              <div key={image.id} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${isCompactMode ? 'p-1' : 'p-2'}`}>
                <div className={`flex items-start justify-between ${isCompactMode ? 'mb-0.5' : 'mb-1'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {image.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.file_size)} • {new Date(image.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteImage(image.id, image.file_path)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Supprimer l'image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className={`flex items-center ${isCompactMode ? 'space-x-1' : 'space-x-2'}`}>
                  <button
                    onClick={() => handlePreviewImage(image.file_path)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Voir</span>
                  </button>
                  
                  <div className={`flex items-center text-green-600 text-xs ${isCompactMode ? 'space-x-0.5' : 'space-x-1'}`}>
                    <CheckCircle className="w-3 h-3" />
                    <span>Uploadé</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Prévisualisation</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              <img
                src={previewImage}
                alt="Prévisualisation"
                className="max-w-full max-h-96 object-contain mx-auto"
              />
            </div>
            
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button
                onClick={() => setPreviewImage(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}