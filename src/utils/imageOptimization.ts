// Utilitaires pour l'optimisation des images

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Redimensionne et compresse une image
 */
export const optimizeImage = (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir en blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Erreur lors de l\'optimisation de l\'image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Vérifie si une image nécessite une optimisation
 */
export const needsOptimization = (file: File, maxSize: number = 2 * 1024 * 1024): boolean => {
  return file.size > maxSize;
};

/**
 * Optimise automatiquement une image si nécessaire
 */
export const autoOptimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (needsOptimization(file)) {
    return optimizeImage(file, options);
  }

  return file;
};