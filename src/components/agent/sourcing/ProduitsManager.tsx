import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Image, Eye, EyeOff, Search, LayoutGrid, List, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useCatalogueProduits, useDeleteProduit, useUpdateProduit } from '../../../hooks/useCatalogueProduits';
import { useCatalogueCategories } from '../../../hooks/useCatalogueCategories';
import { CatalogueProduit, catalogueService } from '../../../services/catalogueService';
import ProduitFormModal from './ProduitFormModal';

type ViewMode = 'grid' | 'table';
type SortKey = 'nom' | 'prix_ariary' | 'moq' | 'numero';
type SortDir = 'asc' | 'desc';

const STORAGE_KEY = 'sourcing_produits_view';

function getSavedView(): ViewMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'table' ? 'table' : 'grid';
  } catch {
    return 'grid';
  }
}

export default function ProduitsManager() {
  const { data: categories = [] } = useCatalogueCategories();
  const { data: produits = [], isLoading } = useCatalogueProduits();
  const deleteMut = useDeleteProduit();
  const updateMut = useUpdateProduit();

  const [modalProduit, setModalProduit] = useState<CatalogueProduit | null | false>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategorie, setFilterCategorie] = useState<string>('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(getSavedView);
  const [sortKey, setSortKey] = useState<SortKey>('numero');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleActif = (p: CatalogueProduit) => {
    updateMut.mutate({ id: p.id, payload: { actif: !p.actif } });
  };

  const formatPrix = (v: number) => new Intl.NumberFormat('fr-MG').format(v) + ' Ar';

  const filtered = produits
    .filter(p => {
      const matchCat = !filterCategorie || p.categorie_id === filterCategorie;
      const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) ||
        (p.reference_produit?.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'nom') return a.nom.localeCompare(b.nom) * dir;
      if (sortKey === 'prix_ariary') return (a.prix_ariary - b.prix_ariary) * dir;
      if (sortKey === 'moq') return (a.moq - b.moq) * dir;
      if (sortKey === 'numero') return (a.numero - b.numero) * dir;
      return 0;
    });

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategorie}
            onChange={e => setFilterCategorie(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleView('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleView('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Vue tableau"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setModalProduit(null)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun produit</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView
          produits={filtered}
          categories={categories}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          deleteMut={deleteMut}
          toggleActif={toggleActif}
          setModalProduit={setModalProduit}
          formatPrix={formatPrix}
        />
      ) : (
        <TableView
          produits={filtered}
          categories={categories}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          deleteMut={deleteMut}
          toggleActif={toggleActif}
          setModalProduit={setModalProduit}
          formatPrix={formatPrix}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

      {modalProduit !== false && (
        <ProduitFormModal
          produit={modalProduit}
          categories={categories}
          onClose={() => setModalProduit(false)}
        />
      )}
    </div>
  );
}

interface SharedProps {
  produits: CatalogueProduit[];
  categories: { id: string; nom: string }[];
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  deleteMut: { mutate: (id: string) => void };
  toggleActif: (p: CatalogueProduit) => void;
  setModalProduit: (p: CatalogueProduit | null) => void;
  formatPrix: (v: number) => string;
}

function GridView({ produits, categories, deleteConfirmId, setDeleteConfirmId, deleteMut, toggleActif, setModalProduit, formatPrix }: SharedProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {produits.map(p => {
        const photos = p.catalogue_produit_photos ?? [];
        const firstPhoto = photos[0];
        const catNom = categories.find(c => c.id === p.categorie_id)?.nom ?? '';
        return (
          <div key={p.id} className={`bg-white rounded-xl border ${p.actif ? 'border-gray-200' : 'border-gray-200 opacity-60'} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            <div className="relative aspect-video bg-gray-100">
              {firstPhoto ? (
                <img src={catalogueService.getPhotoUrl(firstPhoto.file_path)} alt={p.nom} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Image className="w-10 h-10" />
                </div>
              )}
              {photos.length > 1 && (
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{photos.length} photos</span>
              )}
              {!p.actif && (
                <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">Masqué</span>
              )}
              {p.reference_produit && (
                <span className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs font-mono px-2 py-0.5 rounded-full">{p.reference_produit}</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">{catNom}</p>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{p.nom}</h3>
              <p className="text-base font-bold text-gray-900">{formatPrix(p.prix_ariary)}</p>
              <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                <span>MOQ : {p.moq}</span>
                {p.unite && <span>· {p.unite}</span>}
                {p.prix_exw_rmb != null && <span>· ¥{p.prix_exw_rmb}</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-1.5">
                  <button onClick={() => setModalProduit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActif(p)}
                    className={`p-1.5 rounded-lg transition-colors ${p.actif ? 'text-gray-400 hover:bg-gray-50' : 'text-green-500 hover:bg-green-50'}`}
                    title={p.actif ? 'Masquer' : 'Afficher'}
                  >
                    {p.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <RowDeleteButton id={p.id} deleteConfirmId={deleteConfirmId} setDeleteConfirmId={setDeleteConfirmId} deleteMut={deleteMut} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TableViewProps extends SharedProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function TableView({ produits, categories, deleteConfirmId, setDeleteConfirmId, deleteMut, toggleActif, setModalProduit, formatPrix, sortKey, sortDir, onSort }: TableViewProps) {
  const fmt = (v: number | null | undefined, decimals = 2) =>
    v != null ? v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: decimals }) : '—';

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <SortableHeader label="N°" colKey="numero" currentKey={sortKey} dir={sortDir} onSort={onSort} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide" />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Réf. produit</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Code fournisseur</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
            <th className="w-14 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Photo</th>
            <SortableHeader label="Nom du produit" colKey="nom" currentKey={sortKey} dir={sortDir} onSort={onSort} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide" />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[200px]">Description</th>
            <SortableHeader label="MOQ" colKey="moq" currentKey={sortKey} dir={sortDir} onSort={onSort} className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" align="right" />
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Prix EXW (¥)</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Prix EXW ($)</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unité</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Qté / Unité</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vol. / Unité</th>
            <SortableHeader label="Prix Tana" colKey="prix_ariary" currentKey={sortKey} dir={sortDir} onSort={onSort} className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" align="right" />
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {produits.map((p, idx) => {
            const photos = p.catalogue_produit_photos ?? [];
            const firstPhoto = photos[0];
            const catNom = categories.find(c => c.id === p.categorie_id)?.nom ?? '—';
            return (
              <tr
                key={p.id}
                className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'} ${!p.actif ? 'opacity-50' : ''}`}
              >
                {/* Numéro */}
                <td className="px-3 py-2.5 text-center text-xs font-mono text-gray-500 tabular-nums">{p.numero}</td>

                {/* Référence */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {p.reference_produit ?? '—'}
                  </span>
                </td>

                {/* Code fournisseur */}
                <td className="px-3 py-2.5 text-xs text-gray-600 font-mono whitespace-nowrap">{p.code_fournisseur || '—'}</td>

                {/* Catégorie */}
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium whitespace-nowrap">{catNom}</span>
                </td>

                {/* Photo */}
                <td className="px-3 py-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {firstPhoto ? (
                      <img
                        src={catalogueService.getPhotoUrl(firstPhoto.file_path)}
                        alt={p.nom}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Image className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Nom */}
                <td className="px-3 py-2.5 min-w-[160px]">
                  <span className="font-medium text-gray-900">{p.nom}</span>
                </td>

                {/* Description */}
                <td className="px-3 py-2.5 max-w-[240px]">
                  {p.description ? (
                    <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>

                {/* MOQ */}
                <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums font-medium">{p.moq}</td>

                {/* Prix EXW RMB */}
                <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums whitespace-nowrap">
                  {p.prix_exw_rmb != null ? <span>¥ {fmt(p.prix_exw_rmb)}</span> : <span className="text-gray-300">—</span>}
                </td>

                {/* Prix EXW USD */}
                <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums whitespace-nowrap">
                  {p.prix_exw_usd != null ? <span>$ {fmt(p.prix_exw_usd)}</span> : <span className="text-gray-300">—</span>}
                </td>

                {/* Unité */}
                <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{p.unite || '—'}</td>

                {/* Quantité/Unité */}
                <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">
                  {p.quantite_par_unite != null ? fmt(p.quantite_par_unite, 0) : <span className="text-gray-300">—</span>}
                </td>

                {/* Volume/Unité */}
                <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">
                  {p.volume_par_unite != null ? fmt(p.volume_par_unite, 4) : <span className="text-gray-300">—</span>}
                </td>

                {/* Prix Ariary */}
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">{formatPrix(p.prix_ariary)}</td>

                {/* Actions */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModalProduit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActif(p)}
                      className={`p-1.5 rounded-lg transition-colors ${p.actif ? 'text-gray-400 hover:bg-gray-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={p.actif ? 'Masquer' : 'Afficher'}
                    >
                      {p.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <RowDeleteButton id={p.id} deleteConfirmId={deleteConfirmId} setDeleteConfirmId={setDeleteConfirmId} deleteMut={deleteMut} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({ label, colKey, currentKey, dir, onSort, className, align }: {
  label: string;
  colKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className: string;
  align?: 'right';
}) {
  const active = currentKey === colKey;
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className={className}>
      <button
        onClick={() => onSort(colKey)}
        className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse w-full justify-start' : ''} hover:text-gray-800 transition-colors ${active ? 'text-blue-600' : ''}`}
      >
        {label}
        <Icon className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
      </button>
    </th>
  );
}

function RowDeleteButton({ id, deleteConfirmId, setDeleteConfirmId, deleteMut }: {
  id: string;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  deleteMut: { mutate: (id: string) => void };
}) {
  if (deleteConfirmId === id) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-red-600 font-medium">Confirmer ?</span>
        <button onClick={() => { deleteMut.mutate(id); setDeleteConfirmId(null); }} className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">Oui</button>
        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors">Non</button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setDeleteConfirmId(id)}
      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
      title="Supprimer"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
