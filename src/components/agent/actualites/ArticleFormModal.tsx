import React, { useState, useEffect } from 'react';
import { X, Newspaper, Eye, EyeOff, Info, Search, Tag, ImageOff, CheckCircle } from 'lucide-react';
import { Article, CATEGORIES, articleService } from '../../../services/articleService';

function ImagePreview({ url }: { url: string }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    const img = new Image();
    img.onload = () => setStatus('ok');
    img.onerror = () => setStatus('error');
    img.src = url;
  }, [url]);

  if (status === 'error') {
    return (
      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
        <ImageOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-red-600">Image inaccessible</p>
          <p className="text-xs text-red-400 mt-0.5">L'URL ne renvoie pas une image valide. Vérifiez qu'il s'agit d'un lien direct vers un fichier image.</p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-gray-100 animate-pulse" />
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle className="w-3.5 h-3.5" />
        Image chargée avec succès
      </div>
      <div className="rounded-lg overflow-hidden aspect-video bg-gray-100">
        <img src={url} alt="Aperçu" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

interface ArticleFormModalProps {
  article?: Article;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const META_DESC_MAX = 160;
const META_DESC_IDEAL_MIN = 120;

function MetaDescCounter({ value }: { value: string }) {
  const len = value.length;
  let color = 'text-gray-400';
  if (len > 0 && len < META_DESC_IDEAL_MIN) color = 'text-amber-500';
  else if (len >= META_DESC_IDEAL_MIN && len <= META_DESC_MAX) color = 'text-emerald-600';
  else if (len > META_DESC_MAX) color = 'text-red-500';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {len}/{META_DESC_MAX}
    </span>
  );
}

function SerpPreview({ titre, slug, metaDesc, resume }: { titre: string; slug: string; metaDesc: string; resume: string }) {
  const displayTitle = titre || 'Titre de l\'article';
  const displaySlug = slug || 'titre-article';
  const displayDesc = metaDesc || resume || 'Description de l\'article apparaissant dans les résultats de recherche Google...';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
        <Search className="w-3 h-3" />
        Aperçu Google (SERP)
      </p>
      <p className="text-xs text-gray-400 truncate">
        continentalexpresscargo.com › article › {displaySlug}
      </p>
      <p className="text-blue-700 font-medium text-sm leading-snug line-clamp-1 hover:underline cursor-pointer">
        {displayTitle.length > 60 ? displayTitle.slice(0, 57) + '...' : displayTitle} | Continental Express Cargo
      </p>
      <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
        {displayDesc.length > 160 ? displayDesc.slice(0, 157) + '...' : displayDesc}
      </p>
    </div>
  );
}

export default function ArticleFormModal({ article, onSubmit, onClose, isSubmitting }: ArticleFormModalProps) {
  const isEdit = !!article;

  const [form, setForm] = useState({
    titre: article?.titre ?? '',
    resume: article?.resume ?? '',
    meta_description: article?.meta_description ?? '',
    mots_cles: article?.mots_cles ?? [],
    contenu: article?.contenu ?? '',
    image_url: article?.image_url ?? '',
    categorie: article?.categorie ?? 'Nouvelles CEC',
    auteur: article?.auteur ?? '',
    published: article?.published ?? false,
    date_publication: article?.date_publication
      ? article.date_publication.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  });

  const [slugPreview, setSlugPreview] = useState('');
  const [motCleInput, setMotCleInput] = useState('');

  useEffect(() => {
    if (!isEdit && form.titre) {
      setSlugPreview(articleService.generateSlug(form.titre));
    }
  }, [form.titre, isEdit]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMotsCles = (raw: string) => {
    const newKws = raw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k && !form.mots_cles.includes(k));
    if (newKws.length > 0) {
      handleChange('mots_cles', [...form.mots_cles, ...newKws]);
    }
    setMotCleInput('');
  };

  const removeMotCle = (kw: string) => {
    handleChange('mots_cles', form.mots_cles.filter((k) => k !== kw));
  };

  const handleMotCleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      addMotsCles(value);
    } else {
      setMotCleInput(value);
    }
  };

  const handleMotCleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMotsCles(motCleInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;

    const payload: any = {
      titre: form.titre.trim(),
      resume: form.resume.trim(),
      meta_description: form.meta_description.trim(),
      mots_cles: form.mots_cles,
      contenu: form.contenu.trim(),
      image_url: form.image_url.trim(),
      categorie: form.categorie,
      auteur: form.auteur.trim(),
      published: form.published,
      date_publication: new Date(form.date_publication).toISOString(),
    };

    onSubmit(payload);
  };

  const currentSlug = isEdit ? article!.slug : slugPreview;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <p className="text-xs text-gray-500">Remplissez les informations ci-dessous</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titre <span className="text-red-500">*</span>
                  <span className={`ml-2 text-xs font-normal ${form.titre.length > 60 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {form.titre.length}/60 caractères recommandés
                  </span>
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => handleChange('titre', e.target.value)}
                  placeholder="Ex: Comment bien préparer son importation depuis la Chine"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!isEdit && slugPreview && (
                  <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    URL: <span className="font-mono text-gray-500">/article/{slugPreview}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Résumé <span className="text-gray-400 font-normal">(affiché dans la liste)</span>
                </label>
                <textarea
                  value={form.resume}
                  onChange={(e) => handleChange('resume', e.target.value)}
                  placeholder="Un résumé accrocheur en 1-2 phrases..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    Meta description SEO
                  </label>
                  <MetaDescCounter value={form.meta_description} />
                </div>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  placeholder="Description affichée dans Google (150-160 caractères idéal). Si vide, le résumé sera utilisé."
                  rows={3}
                  maxLength={200}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    form.meta_description.length > META_DESC_MAX ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Idéal : entre 120 et 160 caractères. Si vide, le résumé sera utilisé automatiquement.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contenu de l'article
                </label>
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Utilisez <code className="bg-gray-100 px-1 rounded"># Titre</code> pour les titres, <code className="bg-gray-100 px-1 rounded">## Sous-titre</code> pour les sous-titres, et <code className="bg-gray-100 px-1 rounded">- item</code> pour les listes.
                </div>
                <textarea
                  value={form.contenu}
                  onChange={(e) => handleChange('contenu', e.target.value)}
                  placeholder="# Introduction&#10;&#10;Votre contenu ici...&#10;&#10;## Section 1&#10;&#10;Détails de la section..."
                  rows={14}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <SerpPreview
                titre={form.titre}
                slug={currentSlug}
                metaDesc={form.meta_description}
                resume={form.resume}
              />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                <button
                  type="button"
                  onClick={() => handleChange('published', !form.published)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                    form.published
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-amber-400 bg-amber-50 text-amber-700'
                  }`}
                >
                  {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {form.published ? 'Publié (visible)' : 'Brouillon (privé)'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select
                  value={form.categorie}
                  onChange={(e) => handleChange('categorie', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Auteur</label>
                <input
                  type="text"
                  value={form.auteur}
                  onChange={(e) => handleChange('auteur', e.target.value)}
                  placeholder="Nom de l'auteur"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de publication</label>
                <input
                  type="date"
                  value={form.date_publication}
                  onChange={(e) => handleChange('date_publication', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Mots-clés SEO
                </label>
                <div className="mb-2">
                  <input
                    type="text"
                    value={motCleInput}
                    onChange={handleMotCleChange}
                    onKeyDown={handleMotCleKeyDown}
                    placeholder="Ex: import Chine, fret maritime, Madagascar"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {form.mots_cles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.mots_cles.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeMotCle(kw)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-xs text-gray-400">Séparez les mots-clés par une virgule ou appuyez sur Entrée</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL de l'image de couverture
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://images.pexels.com/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">Copiez l'URL directe de l'image (doit se terminer par .jpg, .png, .webp...)</p>
                {form.image_url && (
                  <ImagePreview url={form.image_url} />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.titre.trim()}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
