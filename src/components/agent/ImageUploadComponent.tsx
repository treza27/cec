import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { SupabaseImageService, PackageImage } from '../../utils/supabaseImageUtils';

interface ImageUploadComponentProps {
  inventaireId: number;
  imageType?: 'general' | 'msds' | 'chargement' | 'suivi_maritime' | 'reception';
  existingImages?: PackageImage[];
  onImagesChange?: (images: PackageImage[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUploadComponent({
  inventaireId,
  imageType = 'general',
  existingImages = [],
  onImagesChange,
  maxImages = 10,
  className = ''
}: ImageUploadComponentProps) {
  const [images, setImages] = useState<PackageImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const { data: uploadedImages, errors: uploadErrors } = await SupabaseImageService.uploadMultipleImages(
        inventaireId,
        files,
        imageType
      );

      if (uploadErrors.length > 0) {
        setErrors(uploadErrors);
      }

      if (uploadedImages.length > 0) {
        const newImages = [...images, ...uploadedImages];
        setImages(newImages);
        onImagesChange?.(newImages);
      }
    } catch (error) {
      setErrors([`Erreur d'upload: ${error}`]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { success, error } = await SupabaseImageService.deletePackageImage(imageId);
      
      if (success) {
        const newImages = images.filter(img => img.id !== imageId);
        setImages(newImages);
        onImagesChange?.(newImages);
      } else {
        setErrors([error || 'Erreur lors de la suppression']);
      }
    } catch (error) {
      setErrors([`Erreur de suppression: ${error}`]);
    }
  };

  const handlePreviewImage = async (image: PackageImage) => {
    try {
      const { data: signedUrl, error } = await SupabaseImageService.getImageUrl(image.file_path);
      
      if (signedUrl) {
        setPreviewImage(signedUrl);
      } else {
        setErrors([error || 'Impossible de charger l\'image']);
      }
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
      general: 'Général',
      msds: 'MSDS',
      chargement: 'Chargement',
      suivi_maritime: 'Suivi Maritime',
      reception: 'Réception'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= maxImages}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Upload en cours...' : 'Cliquer pour sélectionner'}
            </button>
            <p className="text-sm text-gray-500 mt-1">
              ou glisser-déposer vos images ici
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PNG, JPG, WebP, GIF jusqu'à 10MB • {images.length}/{maxImages} images
          </p>
        </div>
      </div>

      {/* Messages d'erreur */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Images {getImageTypeLabel(imageType)} ({images.length})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((image) => (
              <div key={image.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.file_size)} • {image.mime_type}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Supprimer l'image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreviewImage(image)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Voir</span>
                  </button>
                  
                  <div className="flex items-center space-x-1 text-green-600 text-xs">
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
    </div>
  );
}