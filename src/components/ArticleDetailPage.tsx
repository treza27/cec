import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Tag, User, Newspaper, TrendingUp, Lightbulb, BookOpen, Share2, Clock, Phone, ChevronRight, List } from 'lucide-react';
import { useArticleBySlug, usePublishedArticles } from '../hooks/useArticles';
import { Article } from '../services/articleService';
import LoadingSpinner from './LoadingSpinner';
import SEO from './SEO';

interface ArticleDetailPageProps {
  slug: string;
  onBack: () => void;
  onArticleSelect: (slug: string) => void;
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Conseils Import': {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
  },
  'Actualités marché': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  'Guides pratiques': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  'Nouvelles CEC': {
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
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

function estimateReadingTime(contenu: string): number {
  const words = contenu.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

function extractToc(contenu: string): TocEntry[] {
  const paragraphs = contenu.split(/\n\n+/).filter(Boolean);
  const entries: TocEntry[] = [];
  for (const para of paragraphs) {
    if (para.startsWith('# ')) {
      const text = para.slice(2).replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\3/g, '$2').trim();
      entries.push({ level: 2, text, id: slugifyHeading(text) });
    } else if (para.startsWith('## ')) {
      const text = para.slice(3).replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\3/g, '$2').trim();
      entries.push({ level: 3, text, id: slugifyHeading(text) });
    }
  }
  return entries;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-bold text-gray-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5] !== undefined) {
      parts.push(<code key={match.index} className="bg-gray-100 text-gray-800 text-sm px-1.5 py-0.5 rounded font-mono">{match[5]}</code>);
    } else if (match[6] && match[7]) {
      const isExternal = !match[7].startsWith('https://continentalexpresscargo.com');
      parts.push(
        <a
          key={match.index}
          href={match[7]}
          className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {match[6]}
        </a>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

function isOrderedList(para: string): boolean {
  return /^\d+\.\s/.test(para.split('\n')[0]);
}

function renderContent(contenu: string) {
  const paragraphs = contenu.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((para, i) => {
    if (para.startsWith('# ')) {
      const text = para.slice(2);
      const id = slugifyHeading(text.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\3/g, '$2').trim());
      return (
        <h2 key={i} id={id} className="text-2xl font-bold text-gray-900 mt-12 mb-5 leading-snug scroll-mt-6">
          {renderInline(text)}
        </h2>
      );
    }
    if (para.startsWith('## ')) {
      const text = para.slice(3);
      const id = slugifyHeading(text.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\3/g, '$2').trim());
      return (
        <h3 key={i} id={id} className="text-xl font-bold text-gray-900 mt-10 mb-4 leading-snug scroll-mt-6">
          {renderInline(text)}
        </h3>
      );
    }
    if (para.startsWith('### ')) {
      const text = para.slice(4);
      const id = slugifyHeading(text.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\3/g, '$2').trim());
      return (
        <h4 key={i} id={id} className="text-lg font-semibold text-gray-800 mt-8 mb-3 scroll-mt-6">
          {renderInline(text)}
        </h4>
      );
    }
    if (para.startsWith('- ') || para.startsWith('* ')) {
      const items = para.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="my-5 space-y-2.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-700 leading-relaxed text-[1.05rem]">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{renderInline(item.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (isOrderedList(para)) {
      const items = para.split('\n').filter(l => /^\d+\.\s/.test(l));
      return (
        <ol key={i} className="my-5 space-y-2.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-700 leading-relaxed text-[1.05rem]">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              <span>{renderInline(item.replace(/^\d+\.\s/, ''))}</span>
            </li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className="text-gray-700 leading-[1.85] text-[1.05rem] mb-5">
        {renderInline(para)}
      </p>
    );
  });
}

function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 3) return null;
  return (
    <nav aria-label="Table des matières" className="my-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
        <List className="w-4 h-4 text-gray-400" />
        Sommaire
      </div>
      <ol className="space-y-1.5">
        {entries.map((entry, i) => (
          <li key={i} className={entry.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${entry.id}`}
              className="flex items-start gap-1.5 text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 transition-colors leading-snug"
            >
              <span className="mt-0.5 text-gray-400 tabular-nums text-xs font-medium flex-shrink-0">
                {entry.level === 2 ? `${entries.filter((e, j) => j <= i && e.level === 2).length}.` : ''}
              </span>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Breadcrumb({ categorie, titre, onBack, onActualites }: { categorie: string; titre: string; onBack: () => void; onActualites: () => void }) {
  return (
    <nav aria-label="Fil d'ariane" className="pt-6 pb-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-400">
        <li>
          <button onClick={() => window.scrollTo(0, 0)} className="hover:text-gray-700 transition-colors">
            Accueil
          </button>
        </li>
        <li><ChevronRight className="w-3.5 h-3.5" /></li>
        <li>
          <button onClick={onActualites} className="hover:text-gray-700 transition-colors">
            Actualités
          </button>
        </li>
        <li><ChevronRight className="w-3.5 h-3.5" /></li>
        <li>
          <span className="text-gray-500">{categorie}</span>
        </li>
        <li><ChevronRight className="w-3.5 h-3.5" /></li>
        <li>
          <span className="text-gray-700 font-medium line-clamp-1">{titre}</span>
        </li>
      </ol>
    </nav>
  );
}

function RelatedCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const catConfig = CATEGORY_CONFIG[article.categorie] ?? { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: null };
  return (
    <button
      onClick={onSelect}
      className="w-full text-left group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {article.image_url && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={article.image_url}
            alt={article.titre}
            loading="lazy"
            width={400}
            height={225}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${catConfig.bg} ${catConfig.color}`}>
          {article.categorie}
        </span>
        <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-700 transition-colors duration-200 line-clamp-2 mb-1">
          {article.titre}
        </h4>
        <p className="text-xs text-gray-400">{formatDate(article.date_publication)}</p>
      </div>
    </button>
  );
}

export default function ArticleDetailPage({ slug, onBack, onArticleSelect }: ArticleDetailPageProps) {
  const { data: article, isLoading, error } = useArticleBySlug(slug);
  const { data: allArticles = [] } = usePublishedArticles();

  const related = allArticles
    .filter((a) => a.slug !== slug && a.categorie === article?.categorie)
    .slice(0, 3);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const toc = useMemo(() => {
    if (!article?.contenu) return [];
    return extractToc(article.contenu);
  }, [article?.contenu]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Chargement de l'article..." />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Article introuvable</h2>
          <p className="text-gray-400 mb-6">Cet article n'existe pas ou a été supprimé.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux actualités
          </button>
        </div>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[article.categorie] ?? { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: null };
  const readingTime = estimateReadingTime(article.contenu);

  const BASE_URL = 'https://continentalexpresscargo.com';
  const articleUrl = `${BASE_URL}/article/${article.slug}`;
  const wordCount = article.contenu ? article.contenu.trim().split(/\s+/).length : 0;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titre,
    description: article.meta_description || article.resume || article.titre,
    ...(article.mots_cles?.length ? { keywords: article.mots_cles.join(', ') } : {}),
    image: [
      {
        '@type': 'ImageObject',
        url: article.image_url || `${BASE_URL}/Logo.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    datePublished: article.date_publication,
    dateModified: article.updated_at || article.date_publication,
    wordCount,
    articleSection: article.categorie,
    author: article.auteur
      ? {
          '@type': 'Person',
          name: article.auteur,
          worksFor: { '@type': 'Organization', name: 'Continental Express Cargo' },
        }
      : { '@type': 'Organization', name: 'Continental Express Cargo', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Continental Express Cargo',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/Logo.jpg`, width: 600, height: 60 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    url: articleUrl,
    inLanguage: 'fr-FR',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Actualités', item: `${BASE_URL}/actualites` },
      { '@type': 'ListItem', position: 3, name: article.categorie, item: `${BASE_URL}/actualites?cat=${encodeURIComponent(article.categorie)}` },
      { '@type': 'ListItem', position: 4, name: article.titre, item: articleUrl },
    ],
  };

  return (
    <>
      <SEO
        title={article.titre}
        description={article.meta_description || article.resume || `${article.titre} — Continental Express Cargo, spécialiste du transport maritime Chine-Madagascar.`}
        canonical={`/article/${article.slug}`}
        ogImage={article.image_url || undefined}
        ogType="article"
        schema={[articleSchema, breadcrumbSchema]}
        articleMeta={{
          publishedTime: article.date_publication,
          modifiedTime: article.updated_at || article.date_publication,
          author: article.auteur || 'Continental Express Cargo',
          section: article.categorie,
          keywords: article.mots_cles?.length ? article.mots_cles : undefined,
        }}
      />

      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <Breadcrumb
            categorie={article.categorie}
            titre={article.titre}
            onBack={onBack}
            onActualites={onBack}
          />

          {/* Back navigation */}
          <div className="pt-2 pb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Retour aux actualités
            </button>
          </div>

          {/* Article header */}
          <header className="pb-8 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                {catConfig.icon}
                {article.categorie}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={article.date_publication}>{formatDate(article.date_publication)}</time>
              </span>
              {article.auteur && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {article.auteur}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} min de lecture
              </span>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: article.titre, text: article.resume, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                aria-label="Partager cet article"
              >
                <Share2 className="w-3.5 h-3.5" />
                Partager
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-950 leading-[1.2] tracking-tight mb-0">
              {article.titre}
            </h1>
          </header>

          {/* Hero image — fetchpriority high for LCP, explicit dimensions for CLS */}
          {article.image_url && !imageError && (
            <div className="mt-8 rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
              <img
                src={article.image_url}
                alt={article.titre}
                width={800}
                height={450}
                fetchPriority="high"
                className="w-full h-auto object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Resume / chapô */}
          {article.resume && (
            <div className="mt-8 pl-5 border-l-2 border-gray-200">
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                {article.resume}
              </p>
            </div>
          )}

          {/* Table of contents */}
          <TableOfContents entries={toc} />

          {/* Article body */}
          <article className="mt-8 pb-12">
            {article.contenu ? renderContent(article.contenu) : (
              <p className="text-gray-400 italic">Contenu de l'article non disponible.</p>
            )}
          </article>

          {/* Article footer */}
          <div className="pb-12 border-t border-gray-100 pt-8">
            <p className="text-sm italic text-gray-400">
              Article rédigé par l'équipe{article.auteur ? ` de ${article.auteur}` : ''} Continental Express Cargo — Experts en transit maritime et logistique à Madagascar.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux actualités
                </button>
              </div>
              <a
                href="tel:+261340725292"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
              >
                <Phone className="w-3.5 h-3.5" />
                +261 34 07 252 92
              </a>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 py-14">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Articles similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((a) => (
                  <RelatedCard key={a.id} article={a} onSelect={() => onArticleSelect(a.slug)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
