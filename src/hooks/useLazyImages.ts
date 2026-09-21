import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

interface LazyImageOptions {
  enabled?: boolean;
  threshold?: number;
}

export function useLazyImages(itemIds: number[], options: LazyImageOptions = {}) {
  const { enabled = true, threshold = 0.1 } = options;
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: any[] }>({});
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = parseInt(entry.target.getAttribute('data-item-id') || '0');
          if (entry.isIntersecting && itemId) {
            setVisibleItems((prev) => new Set(prev).add(itemId));
          }
        });
      },
      { threshold }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [enabled, threshold]);

  useEffect(() => {
    const loadImages = async () => {
      const itemsToLoad = Array.from(visibleItems).filter(
        (id) => !loadedImages[id]
      );

      if (itemsToLoad.length === 0) return;

      const imagePromises = itemsToLoad.map(async (itemId) => {
        try {
          const { data, error } = await supabase
            .from('package_images')
            .select('id, file_path, file_name, file_size, created_at')
            .eq('inventaire_id', itemId)
            .eq('image_type', 'general')
            .order('created_at', { ascending: true })
            .limit(1);

          if (!error && data) {
            return { itemId, images: data };
          }
        } catch (error) {
          console.error(`Erreur chargement images item ${itemId}:`, error);
        }
        return { itemId, images: [] };
      });

      const results = await Promise.all(imagePromises);
      const newImages: { [key: number]: any[] } = {};
      results.forEach(({ itemId, images }) => {
        newImages[itemId] = images;
      });

      setLoadedImages((prev) => ({ ...prev, ...newImages }));
    };

    loadImages();
  }, [visibleItems]);

  const observe = (element: HTMLElement | null, itemId: number) => {
    if (!element || !observerRef.current) return;
    element.setAttribute('data-item-id', itemId.toString());
    observerRef.current.observe(element);
  };

  const unobserve = (element: HTMLElement | null) => {
    if (!element || !observerRef.current) return;
    observerRef.current.unobserve(element);
  };

  return {
    loadedImages,
    observe,
    unobserve,
  };
}
