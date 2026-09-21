// Utilitaires pour optimiser les performances

// Fonction pour précharger les images critiques
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Fonction pour précharger plusieurs images
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(preloadImage));
  } catch (error) {
    console.warn('Erreur lors du préchargement des images:', error);
  }
};

// Fonction pour optimiser les requêtes avec cache
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join('-');
};

// Fonction pour throttler les événements
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Fonction pour optimiser les re-renders avec memo
export const areEqual = (prevProps: any, nextProps: any): boolean => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};