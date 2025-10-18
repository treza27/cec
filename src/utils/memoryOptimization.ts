// Utilitaires pour l'optimisation mémoire

/**
 * Nettoie les URLs d'objets pour éviter les fuites mémoire
 */
export const cleanupObjectUrls = (urls: string[]) => {
  urls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

/**
 * Limite le nombre d'éléments dans un cache
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Déplacer à la fin (plus récent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer le plus ancien
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Gestionnaire de cache pour les images
 */
export const imageCache = new LRUCache<string, string>(50);

/**
 * Fonction pour nettoyer les listeners d'événements
 */
export const createCleanupFunction = (cleanupFunctions: (() => void)[]): (() => void) => {
  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Erreur lors du nettoyage:', error);
      }
    });
  };
};