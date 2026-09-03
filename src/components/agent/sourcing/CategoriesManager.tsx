import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Layers, ImagePlus, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCatalogueCategories, useCreateCategorie, useUpdateCategorie, useDeleteCategorie, catalogueCategoriesKeys } from '../../../hooks/useCatalogueCategories';
import { useCatalogueSousCategories, useCreateSousCategorie, useUpdateSousCategorie, useDeleteSousCategorie } from '../../../hooks/useCatalogueSousCategories';
import { CatalogueCategorie, CatalogueSousCategorie, catalogueService } from '../../../services/catalogueService';
import toast from 'react-hot-toast';

// ─── Cover photo upload ───────────────────────────────────────────────────────

function CouvertureUpload({ categorie }: { categorie: CatalogueCategorie }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const coverUrl = categorie.photo_couverture
    ? catalogueService.getPhotoUrl(categorie.photo_couverture)
    : null;

  const refresh = () => qc.invalidateQueries({ queryKey: catalogueCategoriesKeys.all });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      await catalogueService.uploadCouvertureCategorie(categorie.id, file);
      await refresh();
      toast.success('Photo de couverture mise à jour');
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!categorie.photo_couverture) return;
    setDeleting(true);
    try {
      await catalogueService.deleteCouvertureCategorie(categorie.id, categorie.photo_couverture);
      await refresh();
      toast.success('Photo supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-3 ml-4 pl-4 border-l-2 border-amber-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Photo de couverture</p>
      <div className="flex items-center gap-3">
        <div className="w-20 h-14 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImagePlus className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {coverUrl ? 'Changer' : 'Ajouter une photo'}
          </button>
          {coverUrl && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Supprimer
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}

// ─── Sub-category inline manager ─────────────────────────────────────────────

function SousCategoriesSection({ categorie }: { categorie: CatalogueCategorie }) {
  const { data: sousCategories = [] } = useCatalogueSousCategories(categorie.id);
  const createMut = useCreateSousCategorie();
  const updateMut = useUpdateSousCategorie();
  const deleteMut = useDeleteSousCategorie();

  const [newNom, setNewNom] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCode, setEditCode] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newNom.trim()) return;
    await createMut.mutateAsync({
      categorie_id: categorie.id,
      nom: newNom.trim(),
      code: newCode.trim().toUpperCase() || undefined,
      ordre: sousCategories.length,
    });
    setNewNom('');
    setNewCode('');
  };

  const startEdit = (sc: CatalogueSousCategorie) => {
    setEditingId(sc.id);
    setEditNom(sc.nom);
    setEditCode(sc.code ?? '');
  };

  const saveEdit = async () => {
    if (!editingId || !editNom.trim()) return;
    await updateMut.mutateAsync({
      id: editingId,
      payload: { nom: editNom.trim(), code: editCode.trim().toUpperCase() || null },
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMut.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="mt-3 ml-4 pl-4 border-l-2 border-blue-100 space-y-2">
      {/* Existing sub-categories */}
      {sousCategories.map(sc => (
        <div key={sc.id} className="flex items-center gap-2 bg-blue-50/60 rounded-lg px-3 py-2 border border-blue-100">
          {editingId === sc.id ? (
            <>
              <input
                value={editNom}
                onChange={e => setEditNom(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom"
              />
              <input
                value={editCode}
                onChange={e => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
                maxLength={5}
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Code"
              />
              <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-800 flex-1">{sc.nom}</span>
              {sc.code && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">{sc.code}</span>
              )}
              <button onClick={() => startEdit(sc)} className="p-1 text-blue-400 hover:bg-blue-100 rounded transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
              {deleteConfirmId === sc.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600 font-medium">Sup. ?</span>
                  <button onClick={() => handleDelete(sc.id)} className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">Oui</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors">Non</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirmId(sc.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      {/* Add new sub-category */}
      <div className="flex gap-2 items-center">
        <input
          value={newNom}
          onChange={e => setNewNom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Nouvelle sous-catégorie *"
          className="flex-1 border border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <input
          value={newCode}
          onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Code"
          maxLength={5}
          className="w-20 border border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          onClick={handleCreate}
          disabled={!newNom.trim() || createMut.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CategoriesManager() {
  const { data: categories = [], isLoading } = useCatalogueCategories();
  const createMut = useCreateCategorie();
  const updateMut = useUpdateCategorie();
  const deleteMut = useDeleteCategorie();

  const [newNom, setNewNom] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newNom.trim() || !newCode.trim()) return;
    await createMut.mutateAsync({
      nom: newNom.trim(),
      code: newCode.trim().toUpperCase(),
      description: newDesc.trim() || undefined,
      ordre: categories.length,
    });
    setNewNom('');
    setNewCode('');
    setNewDesc('');
  };

  const startEdit = (cat: CatalogueCategorie) => {
    setEditingId(cat.id);
    setEditNom(cat.nom);
    setEditCode(cat.code ?? '');
    setEditDesc(cat.description ?? '');
  };

  const saveEdit = async () => {
    if (!editingId || !editNom.trim()) return;
    await updateMut.mutateAsync({
      id: editingId,
      payload: {
        nom: editNom.trim(),
        code: editCode.trim().toUpperCase() || null,
        description: editDesc.trim() || null,
      },
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMut.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Formulaire nouvelle catégorie */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Nouvelle catégorie</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nom de la catégorie *"
            className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newCode}
            onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Code (ex: SAN) *"
            maxLength={5}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optionnel)"
            className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newNom.trim() || !newCode.trim() || createMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Le code sert de préfixe pour les références produit (ex : SAN-001).</p>
      </div>

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Aucune catégorie créée</div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3">
                {editingId === cat.id ? (
                  <>
                    <input
                      value={editNom}
                      onChange={e => setEditNom(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom"
                    />
                    <input
                      value={editCode}
                      onChange={e => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
                      maxLength={5}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Code"
                    />
                    <input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Description"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0"
                    >
                      {expandedIds.has(cat.id)
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{cat.nom}</p>
                        {cat.code && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-mono font-semibold rounded">{cat.code}</span>
                        )}
                      </div>
                      {cat.description && <p className="text-xs text-gray-500 truncate">{cat.description}</p>}
                    </div>
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteConfirmId === cat.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600 font-medium">Confirmer ?</span>
                        <button onClick={() => handleDelete(cat.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">Oui</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors">Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(cat.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Sub-categories + cover photo (expanded) */}
              {expandedIds.has(cat.id) && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50/50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sous-catégories</p>
                    <SousCategoriesSection categorie={cat} />
                  </div>
                  <CouvertureUpload categorie={cat} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
