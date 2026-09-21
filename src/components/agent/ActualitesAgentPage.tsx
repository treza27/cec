import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, Search, Newspaper, X, AlertTriangle } from 'lucide-react';
import {
  useArticles,
  useCreateArticle,
  useUpdateArticle,
  useTogglePublished,
  useDeleteArticle,
} from '../../hooks/useArticles';
import { Article } from '../../services/articleService';
import { useEmployeeProfileContext } from '../../contexts/EmployeeProfileContext';
import ArticleFormModal from './actualites/ArticleFormModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORY_COLORS: Record<string, string> = {
  'Conseils Import': 'bg-blue-100 text-blue-700',
  'Actualités marché': 'bg-emerald-100 text-emerald-700',
  'Guides pratiques': 'bg-amber-100 text-amber-700',
  'Nouvelles CEC': 'bg-rose-100 text-rose-700',
};

function ArticleDeleteModal({ article, onConfirm, onCancel, isDeleting }: {
  article: Article;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900">Supprimer l'article</h3>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            Êtes-vous sûr de vouloir supprimer l'article :
          </p>
          <p className="font-semibold text-gray-900 mb-6">"{article.titre}"</p>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            Cette action est <strong>irréversible</strong>. L'article sera définitivement supprimé du site.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActualitesAgentPage() {
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';

  const { data: articles = [], isLoading } = useArticles();
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const toggleMutation = useTogglePublished();
  const deleteMutation = useDeleteArticle();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  const filtered = articles.filter((a) => {
    const matchSearch = !search.trim() || a.titre.toLowerCase().includes(search.toLowerCase()) || a.categorie.toLowerCase().includes(search.toLowerCase());
    const matchPublished =
      filterPublished === 'all' ||
      (filterPublished === 'published' && a.published) ||
      (filterPublished === 'draft' && !a.published);
    return matchSearch && matchPublished;
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingArticle) return;
    updateMutation.mutate(
      { id: editingArticle.id, payload: data },
      { onSuccess: () => setEditingArticle(null) }
    );
  };

  const handleDelete = () => {
    if (!deletingArticle) return;
    deleteMutation.mutate(deletingArticle.id, {
      onSuccess: () => setDeletingArticle(null),
    });
  };

  const publishedCount = articles.filter((a) => a.published).length;
  const draftCount = articles.filter((a) => !a.published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actualités & Blog</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les articles publiés sur le site public</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
          <p className="text-sm text-gray-500 mt-1">Articles au total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-2xl font-bold text-emerald-600">{publishedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Publiés</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-2xl font-bold text-amber-500">{draftCount}</p>
          <p className="text-sm text-gray-500 mt-1">Brouillons</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterPublished(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterPublished === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : 'Brouillons'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun article trouvé</p>
          {articles.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Créer le premier article
            </button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Titre</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Newspaper className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-xs">{article.titre}</p>
                        {article.auteur && (
                          <p className="text-xs text-gray-400 mt-0.5">{article.auteur}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[article.categorie] ?? 'bg-gray-100 text-gray-600'}`}>
                      {article.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.date_publication)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleMutation.mutate({ id: article.id, published: !article.published })}
                      disabled={toggleMutation.isPending}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        article.published
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {article.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {article.published ? 'Publié' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingArticle(article)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ArticleFormModal
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {editingArticle && (
        <ArticleFormModal
          article={editingArticle}
          onSubmit={handleUpdate}
          onClose={() => setEditingArticle(null)}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {deletingArticle && (
        <ArticleDeleteModal
          article={deletingArticle}
          onConfirm={handleDelete}
          onCancel={() => setDeletingArticle(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
