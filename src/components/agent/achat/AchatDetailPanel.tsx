import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ExternalLink, User, Calendar, Package, DollarSign, CreditCard as Edit3, Save, Loader2, ChevronDown, UserCheck, Link, FileText, Copy, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import { useAchatDetail } from '../../../hooks/useAchats';
import { achatService, DemandeAchatAcheteurData } from '../../../services/achatService';
import { StatutDemandeAchat } from '../../../types';
import { useAllEmployees, useEmployeeProfile } from '../../../hooks/useEmployeeProfile';
import AchatStatusBadge, { STATUS_CONFIG } from './AchatStatusBadge';
import NotesInternes from './NotesInternes';
import AchatArticlesTable from './AchatArticlesTable';
import DevisModal from './DevisModal';
import { useAchatArticles } from '../../../hooks/useAchatArticles';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import toast from 'react-hot-toast';

interface AchatDetailPanelProps {
  demandeId: number;
  onClose: () => void;
  currentUserId: string | null;
  onUpdated: () => void;
}

const STATUTS_ORDER: StatutDemandeAchat[] = [
  'Nouveau', 'En cours d\'analyse', 'Action requise', 'Devis Prêt', 'Rejeté', 'Payé', 'Acheté'
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const MIN_WIDTH = 480;
const MAX_WIDTH_RATIO = 0.95;
const DEFAULT_WIDTH = 900;

function useResizablePanel(defaultWidth: number) {
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX;
      const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
      setWidth(Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };
    const onUp = () => { isResizing.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  return { width, handleMouseDown };
}

interface ArticleCardProps {
  article: { id: number; nom_article: string; quantite: number; photo_url?: string | null };
}

function ArticleCard({ article }: ArticleCardProps) {
  const [hovering, setHovering] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!article.photo_url) return;
    try {
      const response = await fetch(article.photo_url);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article.nom_article.replace(/\s+/g, '_')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger l\'image');
    }
  }, [article]);

  const handleCopy = useCallback(async () => {
    if (!article.photo_url) return;
    setCopying(true);
    try {
      const response = await fetch(article.photo_url);
      const blob = await response.blob();
      const pngBlob = blob.type === 'image/png' ? blob : await convertToPng(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      toast.success('Image copiée dans le presse-papier');
    } catch {
      toast.error('Impossible de copier l\'image (navigateur non compatible)');
    } finally {
      setCopying(false);
    }
  }, [article]);

  return (
    <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
      {article.photo_url ? (
        <div
          className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <img
            src={article.photo_url}
            alt={article.nom_article}
            className="w-full h-full object-cover"
          />
          {hovering && (
            <div className="absolute inset-0 bg-black/50 flex items-end justify-center gap-1.5 pb-1.5">
              <button
                onClick={handleCopy}
                disabled={copying}
                title="Copier l'image"
                className="flex items-center justify-center w-7 h-7 bg-white/90 hover:bg-white rounded text-gray-700 hover:text-blue-600 transition-colors"
              >
                {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                title="Télécharger l'image"
                className="flex items-center justify-center w-7 h-7 bg-white/90 hover:bg-white rounded text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-snug">{article.nom_article}</p>
        <p className="text-xs text-gray-500 mt-1">
          Qté : <span className="font-semibold text-gray-700">{article.quantite}</span>
        </p>
      </div>
    </div>
  );
}

async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Conversion failed'));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export default function AchatDetailPanel({ demandeId, onClose, currentUserId, onUpdated }: AchatDetailPanelProps) {
  const { demande, loading, refetch } = useAchatDetail(demandeId);
  const { data: employees = [] } = useAllEmployees();
  const { profileData } = useEmployeeProfile();
  const isAdmin = profileData?.role === 'administrateur';
  const STATUTS_SELECTABLE = STATUTS_ORDER.filter(
    (s) => isAdmin || (s !== 'Payé' && s !== 'Acheté')
  );
  const { articles } = useAchatArticles(demandeId);
  const { settings: companySettings } = useCompanySettings();
  const { width: panelWidth, handleMouseDown: handleResizeMouseDown } = useResizablePanel(DEFAULT_WIDTH);

  const [isEditingAcheteur, setIsEditingAcheteur] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showStatutDropdown, setShowStatutDropdown] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [acheteurForm, setAcheteurForm] = useState<DemandeAchatAcheteurData>({});
  const [hasReglement, setHasReglement] = useState(false);

  useEffect(() => {
    async function checkReglement() {
      const { count } = await supabase
        .from('mouvements_caisse')
        .select('id', { count: 'exact', head: true })
        .eq('demande_achat_id', demandeId)
        .eq('type_mouvement', 'entree_client')
        .eq('est_annule', false);
      setHasReglement((count ?? 0) > 0);
    }
    checkReglement();
  }, [demandeId]);

  useEffect(() => {
    if (demande) {
      setAcheteurForm({
        lien_achat_final: demande.lien_achat_final ?? '',
        taux_change_achete: demande.taux_change_achete ?? undefined,
        taux_change_vendu: demande.taux_change_vendu ?? undefined,
        frais_port_locaux_rmb: demande.frais_port_locaux_rmb ?? undefined,
        assigne_a_id: demande.assigne_a_id ?? undefined,
        statut: demande.statut,
      });
    }
  }, [demande]);

  const handleCancelEdit = () => {
    if (demande) {
      setAcheteurForm({
        lien_achat_final: demande.lien_achat_final ?? '',
        taux_change_achete: demande.taux_change_achete ?? undefined,
        taux_change_vendu: demande.taux_change_vendu ?? undefined,
        frais_port_locaux_rmb: demande.frais_port_locaux_rmb ?? undefined,
        assigne_a_id: demande.assigne_a_id ?? undefined,
        statut: demande.statut,
      });
    }
    setIsEditingAcheteur(false);
  };

  const handleSaveAcheteur = async () => {
    setIsSaving(true);
    try {
      await achatService.updateAcheteur(demandeId, acheteurForm);
      toast.success('Informations sauvegardées !');
      setIsEditingAcheteur(false);
      refetch();
      onUpdated();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatutChange = async (statut: StatutDemandeAchat, disabled?: boolean) => {
    if (disabled) return;
    setShowStatutDropdown(false);
    try {
      await achatService.updateStatut(demandeId, statut, isAdmin);
      toast.success('Statut mis à jour !');
      refetch();
      onUpdated();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignChange = async (userId: string) => {
    try {
      await achatService.assignTo(demandeId, userId || null);
      toast.success('Assignation mise à jour !');
      refetch();
      onUpdated();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  if (!demande) return null;

  const tauxVendu = isEditingAcheteur
    ? (acheteurForm.taux_change_vendu ?? demande.taux_change_vendu)
    : demande.taux_change_vendu;

  const fraisPort = isEditingAcheteur
    ? (acheteurForm.frais_port_locaux_rmb ?? demande.frais_port_locaux_rmb)
    : demande.frais_port_locaux_rmb;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white shadow-2xl overflow-y-auto flex flex-col animate-slide-in-right"
        style={{ width: `${panelWidth}px`, maxWidth: `${MAX_WIDTH_RATIO * 100}vw`, minWidth: `${MIN_WIDTH}px` }}
        onClick={(e) => e.stopPropagation()}>
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-20 group flex items-center justify-center hover:bg-blue-400/30 transition-colors"
          title="Redimensionner"
        >
          <div className="w-0.5 h-12 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
        </div>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">#{demande.id}</span>
              <AchatStatusBadge statut={demande.statut} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1 truncate">{demande.nom_article}</h2>
            <p className="text-sm text-gray-500">
              {demande.client?.prenom} {demande.client?.nom || ''} · {demande.client?.pseudo}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDevisModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Voir le Devis
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Statut & Assignation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Statut</label>
              <div className="relative">
                <button
                  onClick={() => setShowStatutDropdown(!showStatutDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  <AchatStatusBadge statut={demande.statut} size="sm" />
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showStatutDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {STATUTS_SELECTABLE.map((s) => {
                      const isPayeDisabled = s === 'Payé' && !isAdmin && !hasReglement;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatutChange(s, isPayeDisabled)}
                          title={isPayeDisabled ? "Un règlement client est requis pour passer en Payé" : undefined}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                            demande.statut === s ? 'bg-blue-50' : ''
                          } ${isPayeDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />
                          {s}
                          {isPayeDisabled && <AlertCircle className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assigné à (Acheteur)
                </div>
              </label>
              <select
                value={demande.assigne_a_id ?? ''}
                onChange={(e) => handleAssignChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Non assigné</option>
                {employees.map((emp) => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.full_name || emp.email || emp.user_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informations article (demande globale) */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Informations de la demande
            </h3>

            <div>
              <p className="text-xs text-gray-500 mb-1">Titre de la demande</p>
              <p className="text-sm font-medium text-gray-900">{demande.nom_article}</p>
            </div>

            {demande.lien_exemple && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Lien exemple</p>
                <a
                  href={demande.lien_exemple}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{demande.lien_exemple}</span>
                </a>
              </div>
            )}

            {demande.remarques && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Remarques</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{demande.remarques}</p>
              </div>
            )}

            {articles.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                  Articles ({articles.length})
                </p>
                <div className="space-y-3">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informations Acheteur */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Informations Acheteur
              </h3>
              {!isEditingAcheteur ? (
                <button
                  onClick={() => setIsEditingAcheteur(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveAcheteur}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>

            {/* Champs globaux */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Lien achat global */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  Lien d'achat global
                </label>
                {isEditingAcheteur ? (
                  <input
                    type="url"
                    value={acheteurForm.lien_achat_final ?? ''}
                    onChange={(e) => setAcheteurForm(f => ({ ...f, lien_achat_final: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : demande.lien_achat_final ? (
                  <a
                    href={demande.lien_achat_final}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{demande.lien_achat_final}</span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 italic">Non renseigné</p>
                )}
              </div>

              {/* Taux achat */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Taux de change acheté</label>
                {isEditingAcheteur ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={acheteurForm.taux_change_achete ?? ''}
                      onChange={(e) => setAcheteurForm(f => ({
                        ...f,
                        taux_change_achete: e.target.value === '' ? undefined : Number(e.target.value)
                      }))}
                      className="w-full px-3 py-2 pr-20 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">MGA/RMB</span>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {demande.taux_change_achete != null
                      ? `${Number(demande.taux_change_achete).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA/RMB`
                      : <span className="text-gray-400 italic">Non renseigné</span>}
                  </p>
                )}
              </div>

              {/* Taux vente */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Taux de change vendu</label>
                {isEditingAcheteur ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={acheteurForm.taux_change_vendu ?? ''}
                      onChange={(e) => setAcheteurForm(f => ({
                        ...f,
                        taux_change_vendu: e.target.value === '' ? undefined : Number(e.target.value)
                      }))}
                      className="w-full px-3 py-2 pr-20 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">MGA/RMB</span>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {demande.taux_change_vendu != null
                      ? `${Number(demande.taux_change_vendu).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MGA/RMB`
                      : <span className="text-gray-400 italic">Non renseigné</span>}
                  </p>
                )}
              </div>

              {/* Frais de port globaux */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Frais de port (global)</label>
                {isEditingAcheteur ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={acheteurForm.frais_port_locaux_rmb ?? ''}
                      onChange={(e) => setAcheteurForm(f => ({
                        ...f,
                        frais_port_locaux_rmb: e.target.value === '' ? undefined : Number(e.target.value)
                      }))}
                      className="w-full px-3 py-2 pr-7 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">¥</span>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {demande.frais_port_locaux_rmb != null
                      ? `${Number(demande.frais_port_locaux_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ¥`
                      : <span className="text-gray-400 italic">Non renseigné</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Articles</p>
              <AchatArticlesTable
                demandeId={demandeId}
                tauxChangeVendu={tauxVendu}
                fraisPortGlobaux={fraisPort}
                isEditing={isEditingAcheteur}
              />
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Créé le
              </p>
              <p className="text-xs font-medium text-gray-700">{formatDate(demande.date_creation)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Créé par
              </p>
              <p className="text-xs font-medium text-gray-700 truncate">
                {demande.cree_par?.full_name || demande.cree_par?.email || '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">En traitement</p>
              <p className="text-xs font-medium text-gray-700">{formatDate(demande.date_traitement)}</p>
            </div>
          </div>

          {/* Notes internes */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <NotesInternes demandeAchatId={demandeId} currentUserId={currentUserId} />
          </div>
        </div>
      </div>
    </div>

    {showDevisModal && demande && (
      <DevisModal
        demande={demande}
        articles={articles}
        settings={companySettings}
        onClose={() => setShowDevisModal(false)}
      />
    )}
    </>
  );
}
