import React, { useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Image, ExternalLink, Upload, Loader2, X, Package
} from 'lucide-react';
import { AchatArticle } from '../../../types';
import { achatArticleService, AchatArticleFormData } from '../../../services/achatArticleService';
import { useAchatArticles } from '../../../hooks/useAchatArticles';
import { autoOptimizeImage } from '../../../utils/imageOptimization';
import toast from 'react-hot-toast';

interface AchatArticlesTableProps {
  demandeId: number;
  tauxChangeVendu: number | null | undefined;
  fraisPortGlobaux: number | null | undefined;
  isEditing: boolean;
}

interface LocalArticle extends Partial<AchatArticle> {
  localId: string;
  isNew?: boolean;
  isSaving?: boolean;
  photoFile?: File | null;
  photoPreview?: string | null;
}

function calcPrixLigne(
  prixUnitaire: number | null | undefined,
  quantite: number,
  taux: number | null | undefined
): number | null {
  if (prixUnitaire == null || taux == null) return null;
  const p = Number(prixUnitaire);
  const t = Number(taux);
  const q = Number(quantite ?? 1);
  if (isNaN(p) || isNaN(t)) return null;
  return p * q * t;
}

export default function AchatArticlesTable({ demandeId, tauxChangeVendu, fraisPortGlobaux, isEditing }: AchatArticlesTableProps) {
  const { articles, loading, createArticle, updateArticle, deleteArticle } = useAchatArticles(demandeId);
  const [localEdits, setLocalEdits] = useState<Record<number, Partial<AchatArticle>>>({});
  const [newRows, setNewRows] = useState<LocalArticle[]>([]);
  const [uploadingId, setUploadingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setLocalEdit = (id: number, field: keyof AchatArticle, value: unknown) => {
    setLocalEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getVal = <K extends keyof AchatArticle>(article: AchatArticle, field: K) => {
    if (localEdits[article.id] && field in localEdits[article.id]) {
      return localEdits[article.id][field] as AchatArticle[K];
    }
    return article[field];
  };

  const handleSaveRow = async (article: AchatArticle) => {
    const edits = localEdits[article.id];
    if (!edits || Object.keys(edits).length === 0) return;
    try {
      await updateArticle({ id: article.id, updates: edits });
      setLocalEdits(prev => {
        const next = { ...prev };
        delete next[article.id];
        return next;
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBlurSave = (article: AchatArticle) => {
    handleSaveRow(article);
  };

  const handleDeleteExisting = async (id: number) => {
    if (!confirm('Supprimer cet article ?')) return;
    setDeletingId(id);
    try {
      await deleteArticle(id);
      setLocalEdits(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success('Article supprimé');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePhotoUploadExisting = useCallback(async (article: AchatArticle, file: File) => {
    setUploadingId(article.id);
    try {
      const optimized = await autoOptimizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
      const url = await achatArticleService.uploadPhoto(optimized, demandeId, article.id);
      await updateArticle({ id: article.id, updates: { photo_url: url } });
      toast.success('Photo mise à jour');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingId(null);
    }
  }, [demandeId, updateArticle]);

  const addNewRow = () => {
    const localId = `new_${Date.now()}`;
    setNewRows(prev => [...prev, {
      localId,
      isNew: true,
      nom_article: '',
      reference: null,
      quantite: 1,
      prix_unitaire_rmb: null,
      poids_estime: null,
      volume_cbm: null,
      lien_achat: null,
      tracking: null,
      photo_url: null,
      photoFile: null,
      photoPreview: null,
    }]);
  };

  const updateNewRow = (localId: string, field: keyof LocalArticle, value: unknown) => {
    setNewRows(prev => prev.map(r => r.localId === localId ? { ...r, [field]: value } : r));
  };

  const handleNewRowPhotoChange = (localId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateNewRow(localId, 'photoPreview', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    updateNewRow(localId, 'photoFile', file);
  };

  const removeNewRow = (localId: string) => {
    setNewRows(prev => prev.filter(r => r.localId !== localId));
  };

  const saveNewRow = async (row: LocalArticle) => {
    if (!row.nom_article?.trim()) {
      toast.error('Le nom de l\'article est obligatoire');
      return;
    }
    updateNewRow(row.localId, 'isSaving', true);
    setUploadingId(row.localId);
    try {
      let photoUrl: string | null = null;
      if (row.photoFile) {
        const optimized = await autoOptimizeImage(row.photoFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
        photoUrl = await achatArticleService.uploadPhoto(optimized, demandeId);
      }
      const formData: AchatArticleFormData = {
        demande_achat_id: demandeId,
        nom_article: row.nom_article!.trim(),
        reference: row.reference || null,
        description: null,
        lien_achat: row.lien_achat || null,
        photo_url: photoUrl,
        prix_unitaire_rmb: row.prix_unitaire_rmb ?? null,
        frais_port_locaux_rmb: null,
        quantite: Number(row.quantite) || 1,
        poids_estime: row.poids_estime ?? null,
        volume_cbm: row.volume_cbm ?? null,
        ordre: articles.length + newRows.indexOf(row),
      };
      await createArticle(formData);
      removeNewRow(row.localId);
      toast.success('Article ajouté');
    } catch (error: any) {
      toast.error(error.message);
      updateNewRow(row.localId, 'isSaving', false);
    } finally {
      setUploadingId(null);
    }
  };

  const sousTotalArticles = [...articles].reduce((sum, a) => {
    const prix = calcPrixLigne(
      localEdits[a.id]?.prix_unitaire_rmb !== undefined ? localEdits[a.id].prix_unitaire_rmb : a.prix_unitaire_rmb,
      Number(localEdits[a.id]?.quantite !== undefined ? localEdits[a.id].quantite : a.quantite) || 1,
      tauxChangeVendu
    );
    return sum + (prix ?? 0);
  }, 0);
  const fraisPortAr = (Number(fraisPortGlobaux ?? 0)) * (Number(tauxChangeVendu ?? 0));
  const totalPrix = sousTotalArticles + fraisPortAr;

  const totalQuantite = articles.reduce((sum, a) => sum + (Number(getVal(a, 'quantite')) || 0), 0);
  const totalPoids = articles.reduce((sum, a) => {
    const p = Number(getVal(a, 'poids_estime'));
    const q = Number(getVal(a, 'quantite')) || 1;
    return sum + (p ? p * q : 0);
  }, 0);
  const totalVolume = articles.reduce((sum, a) => {
    const v = Number(getVal(a, 'volume_cbm'));
    const q = Number(getVal(a, 'quantite')) || 1;
    return sum + (v ? v * q : 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasArticles = articles.length > 0 || newRows.length > 0;

  return (
    <div className="space-y-3">
      {!hasArticles && !isEditing && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Package className="w-8 h-8 mb-2" />
          <p className="text-sm italic">Aucun article renseigné</p>
        </div>
      )}

      {hasArticles && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">Photo</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-44">Article</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-28">Référence</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">Lien</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">Tracking</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">Qté</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">Prix unit.</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">Poids</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-24">Volume</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-36">Total ligne</th>
                {isEditing && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => {
                const prixLigne = calcPrixLigne(
                  localEdits[article.id]?.prix_unitaire_rmb !== undefined ? localEdits[article.id].prix_unitaire_rmb : article.prix_unitaire_rmb,
                  Number(localEdits[article.id]?.quantite !== undefined ? localEdits[article.id].quantite : article.quantite) || 1,
                  tauxChangeVendu
                );
                const photoUrl = getVal(article, 'photo_url');

                return (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors group">
                    {/* Photo */}
                    <td className="px-3 py-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={article.nom_article}
                            loading="lazy"
                            className="w-14 h-14 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                            <Image className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[`existing_${article.id}`]?.click()}
                            disabled={uploadingId === article.id}
                            className="absolute inset-0 rounded-md bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          >
                            {uploadingId === article.id
                              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                              : <Upload className="w-4 h-4 text-white" />
                            }
                          </button>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { fileInputRefs.current[`existing_${article.id}`] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUploadExisting(article, file);
                          }}
                        />
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="px-3 py-3 w-44">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(localEdits[article.id]?.nom_article !== undefined ? localEdits[article.id].nom_article : article.nom_article) as string}
                          onChange={(e) => setLocalEdit(article.id, 'nom_article', e.target.value)}
                          onBlur={() => handleBlurSave(article)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nom de l'article"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 line-clamp-3">{article.nom_article}</span>
                      )}
                    </td>

                    {/* Référence */}
                    <td className="px-3 py-3 w-28">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(localEdits[article.id]?.reference !== undefined ? localEdits[article.id].reference : article.reference) as string ?? ''}
                          onChange={(e) => setLocalEdit(article.id, 'reference', e.target.value || null)}
                          onBlur={() => handleBlurSave(article)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Réf..."
                        />
                      ) : (
                        <span className="text-gray-700 text-xs">{article.reference || <span className="text-gray-300">-</span>}</span>
                      )}
                    </td>

                    {/* Lien */}
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="url"
                          value={(localEdits[article.id]?.lien_achat !== undefined ? localEdits[article.id].lien_achat : article.lien_achat) as string ?? ''}
                          onChange={(e) => setLocalEdit(article.id, 'lien_achat', e.target.value || null)}
                          onBlur={() => handleBlurSave(article)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://..."
                        />
                      ) : (
                        article.lien_achat ? (
                          <a
                            href={article.lien_achat}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )
                      )}
                    </td>

                    {/* Tracking */}
                    <td className="px-3 py-3 w-32">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(localEdits[article.id]?.tracking !== undefined ? localEdits[article.id].tracking : article.tracking) as string ?? ''}
                          onChange={(e) => setLocalEdit(article.id, 'tracking', e.target.value || null)}
                          onBlur={() => handleBlurSave(article)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="N° tracking..."
                        />
                      ) : (
                        article.tracking ? (
                          <span className="text-xs font-mono text-gray-700 break-all">{article.tracking}</span>
                        ) : (
                          <span className="text-gray-300 text-xs italic">-</span>
                        )
                      )}
                    </td>

                    {/* Quantite */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={(localEdits[article.id]?.quantite !== undefined ? localEdits[article.id].quantite : article.quantite) as number}
                          onChange={(e) => setLocalEdit(article.id, 'quantite', Number(e.target.value))}
                          onBlur={() => handleBlurSave(article)}
                          className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{article.quantite}</span>
                      )}
                    </td>

                    {/* Prix unitaire */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={(localEdits[article.id]?.prix_unitaire_rmb !== undefined ? localEdits[article.id].prix_unitaire_rmb : article.prix_unitaire_rmb) as number ?? ''}
                            onChange={(e) => setLocalEdit(article.id, 'prix_unitaire_rmb', e.target.value === '' ? null : Number(e.target.value))}
                            onBlur={() => handleBlurSave(article)}
                            className="w-full px-2 py-1 pr-10 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">¥</span>
                        </div>
                      ) : (
                        <span className="text-gray-900">
                          {article.prix_unitaire_rmb != null
                            ? `${Number(article.prix_unitaire_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ¥`
                            : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* Poids */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={(localEdits[article.id]?.poids_estime !== undefined ? localEdits[article.id].poids_estime : article.poids_estime) as number ?? ''}
                            onChange={(e) => setLocalEdit(article.id, 'poids_estime', e.target.value === '' ? null : Number(e.target.value))}
                            onBlur={() => handleBlurSave(article)}
                            className="w-full px-2 py-1 pr-7 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">kg</span>
                        </div>
                      ) : (
                        <span className="text-gray-900">
                          {article.poids_estime != null ? `${article.poids_estime} kg` : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* Volume */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={(localEdits[article.id]?.volume_cbm !== undefined ? localEdits[article.id].volume_cbm : article.volume_cbm) as number ?? ''}
                            onChange={(e) => setLocalEdit(article.id, 'volume_cbm', e.target.value === '' ? null : Number(e.target.value))}
                            onBlur={() => handleBlurSave(article)}
                            className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-900">
                          {article.volume_cbm != null ? `${article.volume_cbm}` : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* Total ligne */}
                    <td className="px-3 py-3 text-right">
                      {prixLigne != null ? (
                        <span className="font-semibold text-blue-700">
                          {Math.round(prixLigne).toLocaleString('fr-FR')} Ar
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    {isEditing && (
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteExisting(article.id)}
                          disabled={deletingId === article.id}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          {deletingId === article.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Nouvelles lignes en cours d'ajout */}
              {newRows.map((row) => (
                <tr key={row.localId} className="bg-blue-50/40">
                  {/* Photo */}
                  <td className="px-3 py-3">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      {row.photoPreview ? (
                        <img
                          src={row.photoPreview}
                          alt="Aperçu"
                          loading="lazy"
                          className="w-14 h-14 object-cover rounded-md border border-blue-300"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md bg-blue-100 flex items-center justify-center border border-dashed border-blue-300">
                          <Image className="w-4 h-4 text-blue-300" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[`new_${row.localId}`]?.click()}
                        disabled={uploadingId === row.localId}
                        className="absolute inset-0 rounded-md bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={el => { fileInputRefs.current[`new_${row.localId}`] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleNewRowPhotoChange(row.localId, file);
                        }}
                      />
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.nom_article || ''}
                      onChange={(e) => updateNewRow(row.localId, 'nom_article', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="Nom de l'article *"
                      autoFocus
                    />
                  </td>

                  {/* Référence */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.reference || ''}
                      onChange={(e) => updateNewRow(row.localId, 'reference', e.target.value || null)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="Réf..."
                    />
                  </td>

                  {/* Lien */}
                  <td className="px-3 py-2">
                    <input
                      type="url"
                      value={row.lien_achat || ''}
                      onChange={(e) => updateNewRow(row.localId, 'lien_achat', e.target.value || null)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="https://..."
                    />
                  </td>

                  {/* Tracking */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.tracking || ''}
                      onChange={(e) => updateNewRow(row.localId, 'tracking', e.target.value || null)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="N° tracking..."
                    />
                  </td>

                  {/* Quantite */}
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min="1"
                      value={row.quantite || 1}
                      onChange={(e) => updateNewRow(row.localId, 'quantite', Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm text-right border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </td>

                  {/* Prix unitaire */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={row.prix_unitaire_rmb ?? ''}
                      onChange={(e) => updateNewRow(row.localId, 'prix_unitaire_rmb', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm text-right border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="0"
                    />
                  </td>

                  {/* Poids */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={row.poids_estime ?? ''}
                      onChange={(e) => updateNewRow(row.localId, 'poids_estime', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm text-right border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="0"
                    />
                  </td>

                  {/* Volume */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={row.volume_cbm ?? ''}
                      onChange={(e) => updateNewRow(row.localId, 'volume_cbm', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm text-right border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="0"
                    />
                  </td>

                  {/* Total ligne */}
                  <td className="px-3 py-2 text-right">
                    <span className="text-gray-300 text-xs">-</span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => saveNewRow(row)}
                        disabled={uploadingId === row.localId || row.isSaving}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                        title="Sauvegarder"
                      >
                        {uploadingId === row.localId || row.isSaving
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <span className="text-xs font-semibold">OK</span>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNewRow(row.localId)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Ligne de totaux */}
              {articles.length > 0 && (
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                  <td colSpan={5} className="px-3 py-2.5 text-xs text-gray-500 font-semibold">TOTAUX</td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">{totalQuantite}</td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 text-right text-xs text-gray-700">
                    {totalPoids > 0 ? `${totalPoids.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} kg` : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-gray-700">
                    {totalVolume > 0 ? totalVolume.toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {totalPrix > 0 ? (
                      <span className="text-blue-800 font-bold text-sm">
                        {Math.round(totalPrix).toLocaleString('fr-FR')} Ar
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  {isEditing && <td />}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <button
          type="button"
          onClick={addNewRow}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Ajouter un article
        </button>
      )}

      {/* Bloc prix total */}
      {(sousTotalArticles > 0 || fraisPortAr > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Sous-total articles ({articles.length} art. · Taux vendu: {tauxChangeVendu ?? '-'} MGA/RMB)</span>
            <span>{Math.round(sousTotalArticles).toLocaleString('fr-FR')} Ar</span>
          </div>
          {fraisPortAr > 0 && (
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>Frais de port ({Number(fraisPortGlobaux).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ¥ × {tauxChangeVendu} MGA/RMB)</span>
              <span>{Math.round(fraisPortAr).toLocaleString('fr-FR')} Ar</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-blue-200">
            <p className="text-xs font-semibold text-blue-700">Prix Total de la Commande (Ariary)</p>
            <p className="text-2xl font-bold text-blue-800">
              {Math.round(totalPrix).toLocaleString('fr-FR')} <span className="text-sm font-normal">Ar</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
