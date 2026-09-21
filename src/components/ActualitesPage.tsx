import React, { useState, useMemo } from 'react';
import {
  Calendar, ArrowRight, Search, BookOpen, TrendingUp, Lightbulb,
  Newspaper, Star, Clock, X, ChevronRight, Users, Tag,
} from 'lucide-react';
import { usePublishedArticles } from '../hooks/useArticles';
import { Article, CATEGORIES } from '../services/articleService';
import SEO from './SEO';

interface ActualitesPageProps {
  onArticleSelect: (slug: string) => void;
}

const CATEGORY_CONFIG: Record<string, {
  color: string; bg: string; border: string;
  activeBg: string; activeText: string; icon: React.ReactNode; accent: string;
}> = {
  'Conseils Import': {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    accent: 'bg-blue-600',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
  },
  'Actualités marché': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    accent: 'bg-emerald-600',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  'Guides pratiques': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    accent: 'bg-amber-500',
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  'Nouvelles CEC': {
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    activeBg: 'bg-rose-600',
    activeText: 'text-white',
    accent: 'bg-rose-600',
    icon: <Newspaper className="w-3.5 h-3.5" />,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function estimateReadTime(contenu: string): number {
  const words = contenu ? contenu.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function CategoryBadge({ categorie, size = 'sm' }: { categorie: string; size?: 'sm' | 'md' }) {
  const config = CATEGORY_CONFIG[categorie] ?? {
    color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200',
    activeBg: '', activeText: '', accent: 'bg-gray-500', icon: null,
  };
  const padding = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-semibold ${config.bg} ${config.color} border ${config.border}`}>
      {config.icon}
      {categorie}
    </span>
  );
}

function ReadTimeBadge({ contenu }: { contenu: string }) {
  const minutes = estimateReadTime(contenu);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <Clock className="w-3.5 h-3.5" />
      {minutes} min de lecture
    </span>
  );
}

function FeaturedArticleCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const config = CATEGORY_CONFIG[article.categorie];
  return (
    <article>
      <button
        onClick={onSelect}
        className="w-full text-left group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row min-h-[420px]"
      >
        <div className="lg:w-[55%] relative overflow-hidden bg-gray-100 min-h-[280px] lg:min-h-0">
          {article.image_url ? (
            <>
              <img
                src={article.image_url}
                alt={`${article.titre} — ${article.categorie} | Continental Express Cargo`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 lg:to-white/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Newspaper className="w-20 h-20 text-blue-300/50" />
            </div>
          )}
          <div className="absolute top-5 left-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg">
              <Star className="w-3 h-3 fill-current" /> À la une
            </span>
          </div>
        </div>

        <div className="lg:w-[45%] p-8 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <CategoryBadge categorie={article.categorie} size="md" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-700 transition-colors duration-300">
              {article.titre}
            </h2>
            {article.resume && (
              <p className="text-gray-500 leading-relaxed mb-6 line-clamp-4 text-base">
                {article.resume}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.date_publication)}</span>
              </div>
              <div className="flex items-center gap-3">
                {article.auteur && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {article.auteur}
                  </span>
                )}
                <ReadTimeBadge contenu={article.contenu} />
              </div>
            </div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${config?.accent ?? 'bg-blue-600'} text-white group-hover:w-12 group-hover:h-12 transition-all duration-300 shadow-md`}>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {config && (
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${config.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        )}
      </button>
    </article>
  );
}

function SecondaryArticleCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const config = CATEGORY_CONFIG[article.categorie];
  return (
    <article>
      <button
        onClick={onSelect}
        className="w-full h-full text-left group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={`${article.titre} — ${article.categorie} | Continental Express Cargo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 ${config?.activeBg ?? 'bg-gray-400'} opacity-10`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-3">
            <CategoryBadge categorie={article.categorie} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-700 transition-colors duration-200 line-clamp-2 flex-1">
            {article.titre}
          </h3>
          {article.resume && (
            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{article.resume}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateShort(article.date_publication)}
              </span>
              <ReadTimeBadge contenu={article.contenu} />
            </div>
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${config?.color ?? 'text-blue-600'} group-hover:gap-2.5 transition-all duration-200`}>
              Lire <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
        {config && (
          <div className={`h-1 ${config.accent} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        )}
      </button>
    </article>
  );
}

function CompactArticleCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const config = CATEGORY_CONFIG[article.categorie];
  return (
    <article>
      <button
        onClick={onSelect}
        className="w-full text-left group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={`${article.titre} | Continental Express Cargo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${config?.bg ?? 'bg-gray-50'}`}>
              <Newspaper className={`w-8 h-8 ${config?.color ?? 'text-gray-300'} opacity-40`} />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2">
            <CategoryBadge categorie={article.categorie} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors duration-200 line-clamp-2 flex-1">
            {article.titre}
          </h3>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDateShort(article.date_publication)}
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 ${config?.color ?? 'text-gray-400'} group-hover:translate-x-0.5 transition-transform`} />
          </div>
        </div>
        {config && (
          <div className={`h-0.5 ${config.accent} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
        )}
      </button>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-1/3" />
        <div className="h-5 bg-gray-100 rounded w-full" />
        <div className="h-5 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-4" />
      </div>
    </div>
  );
}

const POPULAR_TAGS = [
  'Fret maritime', 'Douane Madagascar', 'Importation Chine', 'FCL / LCL',
  'Dédouanement', 'Port de Tamatave', 'Délai livraison', 'Emballage export',
];

export default function ActualitesPage({ onArticleSelect }: ActualitesPageProps) {
  const [activeCategorie, setActiveCategorie] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data: articles = [], isLoading, error } = usePublishedArticles(activeCategorie);

  const filtered = useMemo(() => articles.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.titre.toLowerCase().includes(q) ||
      a.resume.toLowerCase().includes(q) ||
      a.auteur.toLowerCase().includes(q) ||
      a.mots_cles?.some((k) => k.toLowerCase().includes(q))
    );
  }), [articles, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      counts[a.categorie] = (counts[a.categorie] ?? 0) + 1;
    });
    return counts;
  }, [articles]);

  const featured = filtered[0];
  const secondaryPair = filtered.slice(1, 3);
  const rest = filtered.slice(3);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Continental Express Cargo',
    description: 'Conseils import, actualités marché et guides pratiques pour le transport Chine-Madagascar.',
    url: 'https://continentalexpresscargo.com/actualites',
    publisher: {
      '@type': 'Organization',
      name: 'Continental Express Cargo',
      logo: { '@type': 'ImageObject', url: 'https://continentalexpresscargo.com/Logo.jpg' },
    },
    blogPost: filtered.slice(0, 10).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.titre,
      description: a.meta_description || a.resume,
      url: `https://continentalexpresscargo.com/actualites/${a.slug}`,
      datePublished: a.date_publication,
      dateModified: a.updated_at,
      author: { '@type': 'Person', name: a.auteur || 'Equipe CEC' },
      image: a.image_url || 'https://continentalexpresscargo.com/Logo.jpg',
      keywords: a.mots_cles?.join(', '),
    })),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Articles — Continental Express Cargo',
    itemListElement: filtered.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://continentalexpresscargo.com/actualites/${a.slug}`,
      name: a.titre,
    })),
  };

  return (
    <>
      <SEO
        title="Actualités — Conseils import et actualités marché Chine-Madagascar"
        description="Restez informé : conseils import, réglementations douanières, tendances du fret maritime Chine-Madagascar et guides pratiques pour réussir vos importations."
        canonical="/actualites"
        ogType="website"
        schema={[blogSchema, itemListSchema]}
      />

      <section className="min-h-screen bg-gray-50">
        <div className="relative bg-white border-b border-gray-100 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full opacity-60" />
            <div className="absolute top-8 right-1/4 w-48 h-48 bg-emerald-50 rounded-full opacity-40" />
            <div className="absolute -bottom-12 left-1/3 w-64 h-64 bg-amber-50 rounded-full opacity-30" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Newspaper className="w-4 h-4" />
                Blog & Actualités
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-5 leading-tight">
                Restez informés sur le<br />
                <span className="text-blue-600">transport Chine-Madagascar</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-500 leading-relaxed max-w-2xl">
                Conseils pratiques, actualités du marché et nouveautés CEC pour réussir vos importations depuis la Chine.
              </p>
              <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span><strong className="text-gray-800">{articles.length}</strong> articles publiés</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span><strong className="text-gray-800">4</strong> catégories</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Mis à jour régulièrement</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategorie(undefined)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategorie === undefined
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                Tous
                <span className={`ml-1.5 text-xs ${activeCategorie === undefined ? 'text-gray-300' : 'text-gray-400'}`}>
                  ({articles.length})
                </span>
              </button>
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isActive = activeCategorie === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategorie(cat === activeCategorie ? undefined : cat)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                      isActive
                        ? `${cfg?.activeBg} ${cfg?.activeText} border-transparent shadow-sm`
                        : `bg-white ${cfg?.color} ${cfg?.border} hover:${cfg?.bg}`
                    }`}
                  >
                    {cfg?.icon}
                    {cat}
                    {categoryCounts[cat] !== undefined && (
                      <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                        ({categoryCounts[cat]})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher un article..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-10">
            <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mr-1">
              <Tag className="w-3.5 h-3.5" /> Sujets populaires :
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 text-xs rounded-full hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150"
              >
                {tag}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="space-y-10">
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse flex flex-col lg:flex-row min-h-[420px]">
                <div className="lg:w-[55%] bg-gray-100 min-h-[280px] lg:min-h-0" />
                <div className="lg:w-[45%] p-10 space-y-4">
                  <div className="h-5 bg-gray-100 rounded-full w-1/4" />
                  <div className="h-8 bg-gray-100 rounded w-full" />
                  <div className="h-8 bg-gray-100 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-full mt-4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-red-500">Impossible de charger les articles. Veuillez réessayer.</p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Newspaper className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun article trouvé</h3>
              <p className="text-gray-400 mb-6">
                {search
                  ? `Aucun résultat pour "${search}". Essayez d'autres mots-clés.`
                  : 'Aucun article publié dans cette catégorie pour le moment.'}
              </p>
              {(search || activeCategorie) && (
                <button
                  onClick={() => { setSearch(''); setActiveCategorie(undefined); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <X className="w-4 h-4" /> Voir tous les articles
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="space-y-8">
              {featured && (
                <FeaturedArticleCard
                  article={featured}
                  onSelect={() => onArticleSelect(featured.slug)}
                />
              )}

              {secondaryPair.length > 0 && (
                <div className={`grid gap-6 ${secondaryPair.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {secondaryPair.map((article) => (
                    <SecondaryArticleCard
                      key={article.id}
                      article={article}
                      onSelect={() => onArticleSelect(article.slug)}
                    />
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Autres articles</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((article) => (
                      <CompactArticleCard
                        key={article.id}
                        article={article}
                        onSelect={() => onArticleSelect(article.slug)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!isLoading && !error && articles.length > 0 && (
            <div className="mt-16 mb-4 rounded-2xl bg-white border border-blue-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Vous importez depuis la Chine ?</h3>
                  <p className="text-gray-500 text-sm">Consultez nos guides pratiques pour optimiser vos importations et éviter les erreurs courantes.</p>
                </div>
              </div>
              <button
                onClick={() => { setActiveCategorie('Guides pratiques'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Voir les guides <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
