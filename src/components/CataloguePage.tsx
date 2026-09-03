import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, MessageCircle, Tag, Package, ShieldCheck, Layers, Truck, Grid2x2 as Grid2X2 } from 'lucide-react';
import { useCatalogueCategories } from '../hooks/useCatalogueCategories';
import { useCatalogueSousCategories } from '../hooks/useCatalogueSousCategories';
import { useCatalogueProduitsPublic } from '../hooks/useCatalogueProduits';
import { CatalogueProduit, CatalogueCategorie, catalogueService } from '../services/catalogueService';
import SEO from './SEO';

interface Props {
  onNavigate?: (page: string) => void;
}

const formatPrix = (v: number) => new Intl.NumberFormat('fr-MG').format(v) + ' Ar';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Photo gallery ────────────────────────────────────────────────────────────

function ProductGallery({ photos }: { photos: { file_path: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex(i => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setActiveIndex(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="h-60 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
        <Tag className="w-14 h-14" />
      </div>
    );
  }

  const prev = () => setActiveIndex(i => (i - 1 + photos.length) % photos.length);
  const next = () => setActiveIndex(i => (i + 1) % photos.length);
  const activeUrl = catalogueService.getPhotoUrl(photos[activeIndex].file_path);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div
          className="relative h-60 lg:h-72 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 select-none cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <img src={activeUrl} alt="" className="w-full h-full object-contain" />
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors z-10">
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors z-10">
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded-full z-10">
                {activeIndex + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === activeIndex ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'}`}>
                <img src={catalogueService.getPhotoUrl(p.file_path)} alt="" className="w-full h-full object-contain bg-gray-50" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={activeUrl} alt="" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full">
                {activeIndex + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Product detail page ──────────────────────────────────────────────────────

function ProduitDetailPage({
  produit,
  onBack,
  allProduits,
  onSelectProduit,
}: {
  produit: CatalogueProduit;
  onBack: () => void;
  allProduits: CatalogueProduit[];
  onSelectProduit: (p: CatalogueProduit) => void;
}) {
  const photos = produit.catalogue_produit_photos ?? [];
  const categorie = produit.catalogue_categories?.nom;
  const sousCategorie = produit.catalogue_sous_categories?.nom;
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis interesse par le produit : ${produit.nom} (${formatPrix(produit.prix_ariary)}). Pouvez-vous me donner plus d'informations ?`
  );
  const whatsappUrl = `https://wa.me/261340725292?text=${whatsappMsg}`;
  const uniteLabel = produit.unite ?? '';
  const hasConditionnement = uniteLabel || produit.quantite_par_unite != null;

  const similaires = useMemo(
    () => allProduits.filter(p => p.id !== produit.id && p.categorie_id === produit.categorie_id).slice(0, 20),
    [allProduits, produit.id, produit.categorie_id]
  );

  const autresCategories = useMemo(
    () => shuffleArray(allProduits.filter(p => p.id !== produit.id && p.categorie_id !== produit.categorie_id)).slice(0, 20),
    [allProduits, produit.id, produit.categorie_id]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-gray-500 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
            Catalogue
          </button>
          {categorie && (<><span className="text-gray-300 flex-shrink-0">/</span><span className="text-gray-500 flex-shrink-0">{categorie}</span></>)}
          {sousCategorie && (<><span className="text-gray-300 flex-shrink-0">/</span><span className="text-gray-500 flex-shrink-0">{sousCategorie}</span></>)}
          <span className="text-gray-300 flex-shrink-0">/</span>
          <span className="text-gray-800 font-medium truncate">{produit.nom}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="lg:sticky lg:top-40">
            <ProductGallery photos={photos} />
          </div>
          <div className="space-y-4">
            <div>
              {categorie && (
                <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-0.5">
                  {categorie}
                  {sousCategorie && <span className="text-blue-400 font-normal"> · {sousCategorie}</span>}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{produit.nom}</h1>
            </div>
            <div className="border-t border-gray-200" />
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Prix rendu Antananarivo</p>
                <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full whitespace-nowrap">Prix direct importateur</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight break-all">
                {formatPrix(produit.prix_ariary)}
                {produit.unite && <span className="text-base font-normal text-blue-300 ml-2">/ {produit.unite}</span>}
              </p>
              <p className="text-xs text-blue-300 mt-1">Prix indicatif, hors frais de livraison locale</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-2 bg-amber-50 rounded-xl border border-amber-200 p-2.5 min-w-0">
                <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0"><Package className="w-3.5 h-3.5 text-amber-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-0.5">Qte min.</p>
                  <p className="text-lg font-bold text-amber-900 leading-tight">
                    {produit.moq}
                    <span className="text-xs font-normal text-amber-700 ml-1 block sm:inline">{uniteLabel || 'unite'}{produit.moq > 1 ? 's' : ''}</span>
                  </p>
                  {produit.quantite_par_unite != null && (
                    <p className="text-xs font-semibold text-amber-800 mt-1 pt-1 border-t border-amber-200 break-words">
                      Tot. : <span className="font-bold text-green-700">{produit.moq * produit.quantite_par_unite} pcs</span>
                    </p>
                  )}
                </div>
              </div>
              {hasConditionnement && (
                <div className="flex items-start gap-2 bg-white rounded-xl border border-gray-200 p-2.5 min-w-0">
                  <div className="p-1.5 bg-gray-100 rounded-lg flex-shrink-0"><Layers className="w-3.5 h-3.5 text-gray-600" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Condit.</p>
                    {uniteLabel && <p className="text-xs font-semibold text-gray-800 truncate">Unite : <span className="text-blue-700">{uniteLabel}</span></p>}
                    {produit.quantite_par_unite != null && <p className="text-xs font-semibold text-gray-800">Qte : <span className="text-blue-700">{produit.quantite_par_unite} pcs</span></p>}
                    {produit.poids_par_unite != null && <p className="text-xs font-semibold text-gray-800">Poids : <span className="text-blue-700">{produit.poids_par_unite} kg</span></p>}
                  </div>
                </div>
              )}
            </div>
            {produit.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">A propos de ce produit</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{produit.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                Produit selectionne et verifie
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                Expedie depuis la Chine
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg hover:shadow-xl">
                <MessageCircle className="w-5 h-5" />
                Contacter sur WhatsApp pour commander
              </a>
              <button onClick={onBack} className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Retour au catalogue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white mt-8">
        <ProduitsSimiilairesCarousel
          titre="Autres produits dans cette categorie"
          produits={similaires}
          onSelect={p => {
            onSelectProduit(p);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
        <ProduitsSimiilairesCarousel
          titre="Vous aimerez aussi"
          sousTitre="Produits d'autres categories"
          produits={autresCategories}
          onSelect={p => {
            onSelectProduit(p);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      </div>
    </div>
  );
}

function ProduitCard({ produit, onClick }: { produit: CatalogueProduit; onClick: () => void }) {
  const photos = produit.catalogue_produit_photos ?? [];
  const firstPhoto = photos[0];

  return (
    <button onClick={onClick} className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full h-full flex flex-col">
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative flex-shrink-0">
        {firstPhoto ? (
          <img src={catalogueService.getPhotoUrl(firstPhoto.file_path)} alt={produit.nom} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200"><Tag className="w-10 h-10" /></div>
        )}
        {photos.length > 1 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">{photos.length} photos</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-blue-600 font-medium mb-0.5">
          {produit.catalogue_categories?.nom}
          {produit.catalogue_sous_categories?.nom && <span className="text-gray-400"> / {produit.catalogue_sous_categories.nom}</span>}
        </p>
        <h3 className="text-xs font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug flex-1">{produit.nom}</h3>
        <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 mb-2">
          <p className="text-xs text-blue-500 font-medium leading-none mb-0.5">Prix rendu Tana</p>
          <p className="text-sm font-bold text-blue-800">{formatPrix(produit.prix_ariary)}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-xs flex-wrap">
          <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            Min. {produit.moq}{produit.unite ? ' ' + produit.unite : ''}
          </span>
          {produit.unite && produit.quantite_par_unite != null && (
            <span className="text-gray-500 text-xs whitespace-nowrap">{produit.quantite_par_unite} / {produit.unite}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Similaires carousel ─────────────────────────────────────────────────────

function ProduitsSimiilairesCarousel({
  titre,
  sousTitre,
  produits,
  onSelect,
}: {
  titre: string;
  sousTitre?: string;
  produits: CatalogueProduit[];
  onSelect: (p: CatalogueProduit) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  if (produits.length === 0) return null;

  return (
    <div className="border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">{titre}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{sousTitre ?? `${produits.length} produit${produits.length > 1 ? 's' : ''}`}</p>
          </div>
          <div className="hidden sm:flex gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label="Precedent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap sm:overflow-x-auto sm:snap-x sm:snap-mandatory sm:pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {produits.map(p => (
            <div key={p.id} className="sm:flex-shrink-0 sm:w-[180px] sm:snap-start">
              <button
                onClick={() => onSelect(p)}
                className="group w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden relative flex-shrink-0">
                  {p.catalogue_produit_photos?.[0] ? (
                    <img
                      src={catalogueService.getPhotoUrl(p.catalogue_produit_photos[0].file_path)}
                      alt={p.nom}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <Tag className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{p.nom}</p>
                  <p className="text-xs font-bold text-blue-700">{formatPrix(p.prix_ariary)}</p>
                  <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 w-fit">
                    Min. {p.moq}{p.unite ? ' ' + p.unite : ''}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Category card (homepage grid) ───────────────────────────────────────────

function CategorieCard({
  categorie,
  produits,
  onClick,
}: {
  categorie: CatalogueCategorie;
  produits: CatalogueProduit[];
  onClick: () => void;
}) {
  const count = produits.filter(p => p.categorie_id === categorie.id).length;

  const coverUrl = useMemo(() => {
    if (categorie.photo_couverture) {
      return catalogueService.getPhotoUrl(categorie.photo_couverture);
    }
    const firstProduit = produits.find(
      p => p.categorie_id === categorie.id && (p.catalogue_produit_photos?.length ?? 0) > 0
    );
    if (firstProduit?.catalogue_produit_photos?.[0]) {
      return catalogueService.getPhotoUrl(firstProduit.catalogue_produit_photos[0].file_path);
    }
    return null;
  }, [categorie, produits]);

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={categorie.nom}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Grid2X2 className="w-12 h-12 text-blue-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          {count} produit{count > 1 ? 's' : ''}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{categorie.nom}</h3>
          {categorie.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{categorie.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
      </div>
    </button>
  );
}

// ─── Main catalogue page ──────────────────────────────────────────────────────

export default function CataloguePage({ onNavigate }: Props) {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { data: categories = [], isLoading: loadingCats } = useCatalogueCategories();
  const { data: produits = [], isLoading: loadingProduits } = useCatalogueProduitsPublic();

  const [search, setSearch] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [selectedSousCategorie, setSelectedSousCategorie] = useState<string>('');
  const [shuffledProduits, setShuffledProduits] = useState<typeof produits>([]);

  useEffect(() => {
    if (produits.length > 0 && shuffledProduits.length === 0) {
      setShuffledProduits(shuffleArray(produits));
    }
  }, [produits, shuffledProduits.length]);

  const { data: sousCategories = [] } = useCatalogueSousCategories(selectedCategorie || undefined);

  const selectedProduit = useMemo(() => {
    if (!slug || produits.length === 0) return null;
    return produits.find(p => p.id === slug) ?? null;
  }, [slug, produits]);

  useEffect(() => {
    setSelectedSousCategorie('');
  }, [selectedCategorie]);

  const filtered = useMemo(() => {
    const source = shuffledProduits.length > 0 ? shuffledProduits : produits;
    return source.filter(p => {
      const matchCat = !selectedCategorie || p.categorie_id === selectedCategorie;
      const matchSousCat = !selectedSousCategorie || p.sous_categorie_id === selectedSousCategorie;
      const q = search.toLowerCase();
      const matchSearch = !q || p.nom.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      return matchCat && matchSousCat && matchSearch;
    });
  }, [shuffledProduits, produits, selectedCategorie, selectedSousCategorie, search]);

  const isLoading = loadingCats || loadingProduits;
  const showCategoryGrid = !search && !selectedCategorie;

  if (selectedProduit) {
    return (
      <>
        <SEO
          title={`${selectedProduit.nom} — Continental Express Cargo`}
          description={selectedProduit.description ?? `${selectedProduit.nom} — Prix rendu Tana : ${formatPrix(selectedProduit.prix_ariary)}`}
          canonical={`/catalogue/${selectedProduit.id}`}
        />
        <ProduitDetailPage
          produit={selectedProduit}
          allProduits={shuffledProduits.length > 0 ? shuffledProduits : produits}
          onSelectProduit={p => {
            navigate(`/catalogue/${p.id}`);
          }}
          onBack={() => {
            navigate('/catalogue');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      </>
    );
  }

  return (
    <>
      <SEO
        title="Catalogue produits — Continental Express Cargo"
        description="Consultez notre catalogue de produits importes de Chine. Prix rendu Antananarivo en Ariary, quantites minimum, photos."
        canonical="/catalogue"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-6 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Notre Catalogue</h1>
          <p className="text-blue-200 text-sm mb-4 max-w-2xl mx-auto">
            Produits selectionnes en Chine, livres a Antananarivo. Prix indicatifs rendu Tana.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter bar — visible only when browsing a specific category or a search is active */}
      {!showCategoryGrid && categories.length > 0 && (
        <section className="border-b border-gray-200 bg-white sticky top-[88px] z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => { setSelectedCategorie(''); setSearch(''); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategorie ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                Toutes les categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategorie(cat.id === selectedCategorie ? '' : cat.id); setSearch(''); }}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategorie === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>

            {selectedCategorie && sousCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mt-2 border-t border-gray-100 pt-2">
                <button
                  onClick={() => setSelectedSousCategorie('')}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${!selectedSousCategorie ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  <Layers className="w-3 h-3" />
                  Tout afficher
                </button>
                {sousCategories.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedSousCategorie(sc.id === selectedSousCategorie ? '' : sc.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedSousCategorie === sc.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Layers className="w-3 h-3" />
                    {sc.nom}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main content area */}
      <section className="py-8 bg-gray-50 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showCategoryGrid ? (
            /* ── Category grid ───────────────────────────────────── */
            categories.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucune categorie disponible</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Nos categories</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Selectionnez une categorie pour explorer les produits</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {categories.map(cat => (
                    <CategorieCard
                      key={cat.id}
                      categorie={cat}
                      produits={produits}
                      onClick={() => {
                        setSelectedCategorie(cat.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  ))}
                </div>
              </>
            )
          ) : (
            /* ── Product grid ────────────────────────────────────── */
            filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun produit trouve</p>
                {search && (
                  <button onClick={() => setSearch('')} className="mt-3 text-sm text-blue-600 hover:underline">
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4">{filtered.length} produit{filtered.length > 1 ? 's' : ''}</p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map(p => (
                    <div key={p.id}>
                      <ProduitCard
                        produit={p}
                        onClick={() => {
                          navigate(`/catalogue/${p.id}`);
                          window.scrollTo({ top: 0, behavior: 'instant' });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-12 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">Vous avez trouve ce qu'il vous faut ?</h2>
          <p className="text-blue-200 mb-6">Contactez-nous sur WhatsApp pour passer votre commande ou obtenir un devis.</p>
          <a
            href="https://wa.me/261340725292"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Contacter sur WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
