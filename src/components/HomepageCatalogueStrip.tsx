import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import { useCatalogueProduitsPublic } from '../hooks/useCatalogueProduits';
import { catalogueService } from '../services/catalogueService';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const formatPrix = (v: number) => new Intl.NumberFormat('fr-MG').format(v) + ' Ar';

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mt-1" />
      </div>
    </div>
  );
}

interface Props {
  onNavigate?: (page: string) => void;
}

export default function HomepageCatalogueStrip({ onNavigate }: Props) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: produits, isLoading } = useCatalogueProduitsPublic();

  const displayed = useMemo(() => {
    if (!produits || produits.length === 0) return [];
    return shuffleArray(produits).slice(0, 20);
  }, [produits]);

  if (!isLoading && displayed.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const goToCatalogue = () => {
    if (onNavigate) onNavigate('catalogue');
    else navigate('/catalogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToProduit = (id: string) => {
    window.history.pushState({}, '', '/catalogue');
    navigate(`/catalogue/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-14 bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-2">
              Catalogue produits
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Produits disponibles a l'import
            </h2>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Decouvrez notre selection — directement depuis la Chine jusqu'a Madagascar.
            </p>
          </div>
          <button
            onClick={goToCatalogue}
            className="hidden sm:inline-flex items-center gap-2 flex-shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors duration-200"
          >
            Voir le catalogue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel */}
        <div className="relative group">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Precedent"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : displayed.map(produit => {
                  const photos = produit.catalogue_produit_photos ?? [];
                  const firstPhoto = photos.length > 0 ? catalogueService.getPhotoUrl(photos[0].file_path) : null;
                  const categorie = produit.catalogue_categories?.nom;

                  return (
                    <button
                      key={produit.id}
                      onClick={() => goToProduit(produit.id)}
                      className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group/card"
                    >
                      <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {firstPhoto ? (
                          <img
                            src={firstPhoto}
                            alt={produit.nom}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Tag className="w-10 h-10 text-gray-200" />
                        )}
                      </div>
                      <div className="p-3">
                        {categorie && (
                          <span className="inline-block text-[10px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1.5 max-w-full truncate">
                            {categorie}
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
                          {produit.nom}
                        </p>
                        <p className="text-sm font-bold text-blue-700">
                          {formatPrix(produit.prix_ariary)}
                        </p>
                      </div>
                    </button>
                  );
                })}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* CTA bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={goToCatalogue}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            Decouvrir tout notre catalogue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}