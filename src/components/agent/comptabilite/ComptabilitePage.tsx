import React, { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, Building2, Users, FileText, BarChart3, Ban, CheckCircle, Clock, RefreshCw, Filter, UserCog, X, Trash2, AlertTriangle, CreditCard, DollarSign, ChevronDown, ChevronRight, Search, Smartphone, Download, ChevronLeft, Eye, Pencil, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmployeeProfileContext } from '../../../contexts/EmployeeProfileContext';
import {
  useCaisses,
  useCaisseMine,
  useCaisseSolde,
  useMouvementsCaisse,
  useAnnulerMouvementCaisse,
  useSetResponsableCaisse,
  useArchiveCaisse,
  useComptesBancaires,
  useCompteBancaireSolde,
  useMouvementsBancaires,
  useAnnulerMouvementBancaire,
  useAvancesSalaires,
  useMarquerAvanceRembourse,
  useNotesDebitNonPayees,
  useNotesDebitAll,
  useCreateCaisse,
  useCreateCompteBancaire,
  useArchiveCompteBancaire,
  useAllEmployees,
  useDettesFournisseur,
  useDettesFournisseurRemboursements,
  useAnnulerDetteFournisseur,
  useComptesAlipay,
  useComptesAlipayMine,
  useCompteAlipaySolde,
  useMouvementsAlipay,
  useAnnulerMouvementAlipay,
  useCreateCompteAlipay,
  useSetResponsableCompteAlipay,
  useArchiveCompteAlipay,
  useRapportMensuelComplet,
  useNotesDebitRapport,
  useUpdateMouvementCaisse,
  type NoteDebitRapport,
} from '../../../hooks/useComptabilite';
import { exportExcelComptabilite, type CompteAvecMouvements } from '../../../utils/exportExcelComptabilite';
import MouvementForm from './MouvementForm';
import MouvementBancaireForm from './MouvementBancaireForm';
import ApprovisionnementAgmaForm from './ApprovisionnementAgmaForm';
import RapportMensuelView from './RapportMensuelView';
import DetteFournisseurForm from './DetteFournisseurForm';
import AlipayMouvementForm from './AlipayMouvementForm';
import ChequesTab from './ChequesTab';
import ReleveClientsTab from './ReleveClientsTab';
import { MouvementCaisse, MouvementBancaire, MouvementAlipay, TypeMouvementCaisse, TypeMouvementAlipay, CompteBancaire, CompteAlipay, SoldeDetail, ModePaiementBancaire, StatutDetteFournisseur, DetteFournisseur } from '../../../services/comptabiliteService';

// ==========================================
// Helpers
// ==========================================

const TYPE_CAISSE_LABELS: Record<TypeMouvementCaisse, string> = {
  entree_client: 'Règlement achat client',
  paiement_note_debit: 'Note de débit',
  achat_rmb: 'Achat RMB',
  frais_annexe: 'Frais annexes',
  loyer: 'Loyer',
  achat_materiel: 'Achat matériel',
  salaire: 'Salaire',
  avance_salaire: 'Avance salaire',
  transfert_interne: 'Transfert interne',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
};


const TYPE_BANQUE_LABELS: Record<string, string> = {
  versement_caisse: 'Versement caisse',
  virement_entrant: 'Virement entrant',
  virement_sortant: 'Virement sortant',
  frais_bancaires: 'Frais bancaires',
  interets: 'Intérêts',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
  approvisionnement: 'Approvisionnement',
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mvola: 'MVola',
  orange_money: 'Orange Money',
};

const MODE_BANQUE_LABELS: Record<ModePaiementBancaire, { label: string; color: string }> = {
  depot_especes:  { label: 'Dépôt espèces',  color: 'bg-green-100 text-green-700 border-green-200' },
  depot_cheque:   { label: 'Dépôt chèque',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  virement_recu:  { label: 'Virement reçu',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  virement_emis:  { label: 'Virement émis',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  cheque_emis:    { label: 'Chèque émis',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  prelevement:    { label: 'Prélèvement',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
  autre:          { label: 'Autre',           color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function formatMga(n: number) {
  return n.toLocaleString('fr-MG') + ' Ar';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function currentMonthRange() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  return {
    from: `${y}-${String(m).padStart(2, '0')}-01`,
    to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

// ==========================================
// Th helper
// ==========================================

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${className}`}>
      {children}
    </th>
  );
}

// ==========================================
// Table mouvements caisse
// ==========================================

interface CaisseTableProps {
  mouvements: MouvementCaisse[];
  canAnnuler: boolean;
  onAnnuler: (id: number) => void;
  canEdit: boolean;
}

function CaisseTable({ mouvements, canAnnuler, onAnnuler, canEdit }: CaisseTableProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSens, setFilterSens] = useState<string>('');
  const [detailMouvement, setDetailMouvement] = useState<MouvementCaisse | null>(null);

  const filtered = useMemo(() => {
    return mouvements.filter(m => {
      if (filterType && m.type_mouvement !== filterType) return false;
      if (filterSens && m.sens !== filterSens) return false;
      return true;
    });
  }, [mouvements, filterType, filterSens]);

  const totalEntrees = filtered.filter(m => m.sens === 'entree' && !m.est_annule && m.mode_paiement !== 'virement').reduce((s, m) => s + Number(m.montant_mga), 0);
  const totalSorties = filtered.filter(m => m.sens === 'sortie' && !m.est_annule && m.mode_paiement !== 'virement').reduce((s, m) => s + Number(m.montant_mga), 0);

  return (
    <div>
      {/* Filtres */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les types</option>
          {(Object.entries(TYPE_CAISSE_LABELS) as [TypeMouvementCaisse, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterSens}
          onChange={e => setFilterSens(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Entrées & sorties</option>
          <option value="entree">Entrées seulement</option>
          <option value="sortie">Sorties seulement</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} mouvement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Aucun mouvement</p>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Mode paiement</Th>
                <Th>Compte / Dest.</Th>
                <Th>Provenance / Bénéficiaire</Th>
                <Th className="text-right">Entrée</Th>
                <Th className="text-right">Sortie</Th>
                <Th>Statut</Th>
                {canAnnuler && <Th></Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m, i) => {
                const isEntree = m.sens === 'entree';
                const annule = m.est_annule;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setDetailMouvement(m)}
                    className={`cursor-pointer transition-colors ${annule ? 'opacity-40 line-through' : i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50/50 hover:bg-blue-50'}`}
                  >
                    {/* Date */}
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {formatDate(m.date_mouvement)}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isEntree ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isEntree
                            ? <TrendingUp className="w-3 h-3 text-green-600" />
                            : <TrendingDown className="w-3 h-3 text-red-600" />
                          }
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {TYPE_CAISSE_LABELS[m.type_mouvement] ?? m.type_mouvement}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-[220px]">
                      <p className="truncate" title={m.description}>{m.description || '—'}</p>
                      {m.montant_rmb && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          ¥{Number(m.montant_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} × {m.taux_rmb_mga}
                        </p>
                      )}
                    </td>

                    {/* Mode paiement */}
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {m.mode_paiement ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {MODE_PAIEMENT_LABELS[m.mode_paiement] ?? m.mode_paiement}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Compte / Destination */}
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {m.type_mouvement === 'transfert_interne' && m.sens === 'sortie'
                        ? (m.caisse_destination?.nom ?? m.compte_bancaire?.nom ?? '—')
                        : m.compte_bancaire?.nom ?? m.employe_beneficiaire?.full_name ?? m.note_debit?.reference ?? (m.demande_achat ? `SA${new Date(m.demande_achat.date_creation).getFullYear().toString().slice(-2)}${String(m.demande_achat.id).padStart(3, '0')}` : null) ?? '—'}
                    </td>

                    {/* Provenance / Bénéficiaire */}
                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                      {m.type_mouvement === 'transfert_interne' && m.sens === 'entree' && m.tiers_nom
                        ? <span className="flex items-center gap-1">{m.tiers_nom}</span>
                        : (m.tiers_nom ?? '—')}
                    </td>

                    {/* Entrée */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {isEntree && !annule ? (
                        <span className="text-sm font-semibold text-green-600">
                          +{formatMga(Number(m.montant_mga))}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Sortie */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {!isEntree && !annule ? (
                        <span className="text-sm font-semibold text-red-600">
                          −{formatMga(Number(m.montant_mga))}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {annule ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                          <Ban className="w-3 h-3" /> Annulé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3" /> Valide
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    {canAnnuler && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        {!annule && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAnnuler(m.id); }}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                            title="Annuler ce mouvement"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detailMouvement && (
        <MouvementCaisseDetailModal
          mouvement={detailMouvement}
          onClose={() => setDetailMouvement(null)}
          onAnnuler={canAnnuler && !detailMouvement.est_annule ? () => { onAnnuler(detailMouvement.id); setDetailMouvement(null); } : undefined}
          canEdit={canEdit && !detailMouvement.est_annule}
          onUpdated={(updated) => { setDetailMouvement(updated); }}
        />
      )}
    </div>
  );
}

// ==========================================
// Detail modal for caisse operations
// ==========================================

interface MouvementCaisseDetailModalProps {
  mouvement: MouvementCaisse;
  onClose: () => void;
  onAnnuler?: () => void;
  canEdit?: boolean;
  onUpdated?: (updated: MouvementCaisse) => void;
}

function MouvementCaisseDetailModal({ mouvement: m, onClose, onAnnuler, canEdit, onUpdated }: MouvementCaisseDetailModalProps) {
  const isEntree = m.sens === 'entree';
  const annule = m.est_annule;
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateMouvementCaisse();

  const [editData, setEditData] = useState({
    date_mouvement: m.date_mouvement,
    montant_mga: String(Number(m.montant_mga)),
    mode_paiement: m.mode_paiement ?? '',
    description: m.description ?? '',
    tiers_nom: m.tiers_nom ?? '',
    reference_externe: m.reference_externe ?? '',
  });

  useEffect(() => {
    if (!isEditing) {
      setEditData({
        date_mouvement: m.date_mouvement,
        montant_mga: String(Number(m.montant_mga)),
        mode_paiement: m.mode_paiement ?? '',
        description: m.description ?? '',
        tiers_nom: m.tiers_nom ?? '',
        reference_externe: m.reference_externe ?? '',
      });
    }
  }, [m, isEditing]);

  const handleSave = async () => {
    const montant = Number(editData.montant_mga);
    if (!montant || montant <= 0) {
      toast.error('Le montant doit être un nombre positif');
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({
        id: m.id,
        payload: {
          date_mouvement: editData.date_mouvement,
          montant_mga: montant,
          mode_paiement: (editData.mode_paiement || null) as MouvementCaisse['mode_paiement'],
          description: editData.description,
          tiers_nom: editData.tiers_nom || null,
          reference_externe: editData.reference_externe || null,
        },
      });
      toast.success('Mouvement modifié');
      setIsEditing(false);
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la modification');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      date_mouvement: m.date_mouvement,
      montant_mga: String(Number(m.montant_mga)),
      mode_paiement: m.mode_paiement ?? '',
      description: m.description ?? '',
      tiers_nom: m.tiers_nom ?? '',
      reference_externe: m.reference_externe ?? '',
    });
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'text-xs font-medium text-gray-400 mb-0.5';

  const readOnlyFields: { label: string; value: React.ReactNode }[] = [
    { label: 'Type', value: TYPE_CAISSE_LABELS[m.type_mouvement] ?? m.type_mouvement },
    { label: 'Sens', value: isEntree ? 'Entrée' : 'Sortie' },
    { label: 'Caisse de destination', value: m.caisse_destination?.nom ?? '—' },
    { label: 'Compte bancaire lié', value: m.compte_bancaire?.nom ?? '—' },
    { label: 'Note de débit', value: m.note_debit?.reference ?? '—' },
    { label: 'Employé bénéficiaire', value: m.employe_beneficiaire?.full_name ?? '—' },
    { label: "Demande d'achat", value: m.demande_achat ? `SA${new Date(m.demande_achat.date_creation).getFullYear().toString().slice(-2)}${String(m.demande_achat.id).padStart(3, '0')}` : '—' },
    { label: 'Saisi par', value: m.saisie_par?.full_name ?? '—' },
    { label: 'Montant RMB', value: m.montant_rmb ? `¥${Number(m.montant_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` : '—' },
    { label: 'Taux RMB→MGA', value: m.taux_rmb_mga ?? '—' },
    { label: 'Mode paiement destination', value: m.mode_paiement_destination ?? '—' },
    { label: 'Date de création', value: <span className="font-mono">{formatDate(m.created_at)}</span> },
    { label: 'Date de mise à jour', value: <span className="font-mono">{formatDate(m.updated_at)}</span> },
    { label: 'Statut', value: annule ? 'Annulé' : 'Valide' },
    { label: "Motif d'annulation", value: m.motif_annulation ?? '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isEntree ? 'bg-green-100' : 'bg-red-100'}`}>
              {isEntree
                ? <TrendingUp className="w-5 h-5 text-green-600" />
                : <TrendingDown className="w-5 h-5 text-red-600" />
              }
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isEditing ? 'Modifier le mouvement' : 'Détail du mouvement'}
              </h3>
              <p className="text-xs text-gray-500">
                {TYPE_CAISSE_LABELS[m.type_mouvement] ?? m.type_mouvement} · {formatDate(m.date_mouvement)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Montant highlight */}
          <div className={`rounded-xl p-4 mb-5 ${annule ? 'bg-gray-50' : isEntree ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs font-medium text-gray-500 mb-1">Montant</p>
            <p className={`text-2xl font-bold ${annule ? 'text-gray-400 line-through' : isEntree ? 'text-green-700' : 'text-red-700'}`}>
              {isEntree ? '+' : '−'}{formatMga(Number(editData.montant_mga || m.montant_mga))}
            </p>
            {m.montant_rmb && (
              <p className="text-sm text-gray-500 mt-1">
                ¥{Number(m.montant_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} × {m.taux_rmb_mga}
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3 mb-5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              annule
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-green-50 text-green-700 border-green-100'
            }`}>
              {annule
                ? <><Ban className="w-3 h-3" /> Annulé</>
                : <><CheckCircle className="w-3 h-3" /> Valide</>
              }
            </span>
            {annule && m.motif_annulation && (
              <span className="text-xs text-gray-500">Motif : {m.motif_annulation}</span>
            )}
          </div>

          {/* Editable fields */}
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
              <div className="flex flex-col">
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={editData.date_mouvement}
                  onChange={e => setEditData(d => ({ ...d, date_mouvement: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Montant (Ar)</label>
                <input
                  type="number"
                  value={editData.montant_mga}
                  onChange={e => setEditData(d => ({ ...d, montant_mga: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Mode de paiement</label>
                <select
                  value={editData.mode_paiement}
                  onChange={e => setEditData(d => ({ ...d, mode_paiement: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Aucun —</option>
                  {Object.entries(MODE_PAIEMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Tiers</label>
                <input
                  type="text"
                  value={editData.tiers_nom}
                  onChange={e => setEditData(d => ({ ...d, tiers_nom: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={editData.description}
                  onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Référence externe</label>
                <input
                  type="text"
                  value={editData.reference_externe}
                  onChange={e => setEditData(d => ({ ...d, reference_externe: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          ) : null}

          {/* Read-only fields (always shown) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {!isEditing && (
              <>
                <div className="flex flex-col">
                  <span className={labelClass}>Date</span>
                  <span className="text-sm text-gray-800 font-mono">{formatDate(m.date_mouvement)}</span>
                </div>
                <div className="flex flex-col">
                  <span className={labelClass}>Montant</span>
                  <span className={`text-sm font-semibold ${isEntree ? 'text-green-600' : 'text-red-600'}`}>
                    {isEntree ? '+' : '−'}{formatMga(Number(m.montant_mga))}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={labelClass}>Mode de paiement</span>
                  <span className="text-sm text-gray-800">{m.mode_paiement ? (MODE_PAIEMENT_LABELS[m.mode_paiement] ?? m.mode_paiement) : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className={labelClass}>Description</span>
                  <span className="text-sm text-gray-800">{m.description || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className={labelClass}>Tiers</span>
                  <span className="text-sm text-gray-800">{m.tiers_nom ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className={labelClass}>Référence externe</span>
                  <span className="text-sm text-gray-800 font-mono">{m.reference_externe ?? '—'}</span>
                </div>
              </>
            )}
            {readOnlyFields.map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className={labelClass}>{label}</span>
                <span className="text-sm text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler les modifications
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Enregistrement...' : <><Save className="w-4 h-4" /> Enregistrer</>}
              </button>
            </>
          ) : (
            <>
              {canEdit && onAnnuler && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              )}
              {onAnnuler && (
                <button
                  onClick={onAnnuler}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" /> Annuler ce mouvement
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Table mouvements bancaires
// ==========================================

interface BanqueTableProps {
  mouvements: MouvementBancaire[];
  devise: string;
  canAnnuler: boolean;
  onAnnuler: (id: number) => void;
}

function BanqueTable({ mouvements, devise, canAnnuler, onAnnuler }: BanqueTableProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSens, setFilterSens] = useState<string>('');

  const filtered = useMemo(() => {
    return mouvements.filter(m => {
      if (filterType && m.type_mouvement !== filterType) return false;
      if (filterSens && m.sens !== filterSens) return false;
      return true;
    });
  }, [mouvements, filterType, filterSens]);

  const totalEntrees = filtered.filter(m => m.sens === 'entree' && !m.est_annule).reduce((s, m) => s + Number(m.montant), 0);
  const totalSorties = filtered.filter(m => m.sens === 'sortie' && !m.est_annule).reduce((s, m) => s + Number(m.montant), 0);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_BANQUE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterSens}
          onChange={e => setFilterSens(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Entrées & sorties</option>
          <option value="entree">Entrées seulement</option>
          <option value="sortie">Sorties seulement</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} mouvement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Aucun mouvement</p>
        ) : (
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Mode</Th>
                <Th>Description</Th>
                <Th>Référence</Th>
                <Th>Saisi par</Th>
                <Th className="text-right">Taux</Th>
                <Th className="text-right">Entrée ({devise})</Th>
                <Th className="text-right">Sortie ({devise})</Th>
                <Th>Statut</Th>
                {canAnnuler && <Th></Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m, i) => {
                const isEntree = m.sens === 'entree';
                const annule = m.est_annule;
                return (
                  <tr
                    key={m.id}
                    className={`${annule ? 'opacity-40 line-through' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {formatDate(m.date_mouvement)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isEntree ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isEntree ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {TYPE_BANQUE_LABELS[m.type_mouvement] ?? m.type_mouvement}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {m.mode_paiement && MODE_BANQUE_LABELS[m.mode_paiement] ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${MODE_BANQUE_LABELS[m.mode_paiement].color}`}>
                          {MODE_BANQUE_LABELS[m.mode_paiement].label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-[220px]">
                      <p className="truncate" title={m.description}>{m.description || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap font-mono">
                      {m.reference_externe ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {m.saisie_par?.full_name ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-mono text-xs">
                      {m.taux_change ? (
                        <span className="text-amber-700 font-semibold">
                          {Number(m.taux_change).toLocaleString('fr-MG')}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {isEntree && !annule ? (
                        <span className="text-sm font-semibold text-green-600">
                          +{Number(m.montant).toLocaleString('fr-MG')}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {!isEntree && !annule ? (
                        <span className="text-sm font-semibold text-red-600">
                          −{Number(m.montant).toLocaleString('fr-MG')}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {annule ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                          <Ban className="w-3 h-3" /> Annulé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3" /> Valide
                        </span>
                      )}
                    </td>
                    {canAnnuler && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        {!annule && (
                          <button
                            onClick={() => onAnnuler(m.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                            title="Annuler ce mouvement"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Tab Caisses
// ==========================================

type CompteUnifie =
  | { kind: 'caisse'; id: number; nom: string; description?: string; responsable_id: string | null; responsable?: { full_name: string | null; email: string | null } | null }
  | { kind: 'alipay'; id: number; nom: string; responsable_id: string | null; responsable?: { full_name: string | null; email: string | null } | null };

function TabCaisses({ isAdmin, isAcheteur = false }: { isAdmin: boolean; isAcheteur?: boolean }) {
  const [selectedCompte, setSelectedCompte] = useState<{ kind: 'caisse' | 'alipay'; id: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCreateCompte, setShowCreateCompte] = useState(false);
  const [newType, setNewType] = useState<'caisse' | 'alipay'>('caisse');
  const [newNom, setNewNom] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newResponsableId, setNewResponsableId] = useState('');
  const [annulerId, setAnnulerId] = useState<number | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [responsablePopoverKey, setResponsablePopoverKey] = useState<string | null>(null);
  const [archiveCompteKey, setArchiveCompteKey] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(() => currentMonthRange().from);
  const [dateTo, setDateTo] = useState(() => currentMonthRange().to);

  const { data: caissesAll = [] } = useCaisses();
  const { data: caissesMine = [] } = useCaisseMine();
  const { data: comptesAlipayAll = [] } = useComptesAlipay();
  const { data: comptesAlipayMine = [] } = useComptesAlipayMine();
  const caisses = isAdmin ? caissesAll : caissesMine;
  const comptesAlipay = isAcheteur ? comptesAlipayMine : comptesAlipayAll;

  const { data: employees = [] } = useAllEmployees();

  const isAlipaySelected = selectedCompte?.kind === 'alipay';
  const { data: soldeCaisse, refetch: refetchSoldeCaisse } = useCaisseSolde(
    selectedCompte?.kind === 'caisse' ? selectedCompte.id : 0
  );
  const { data: soldeAlipay, refetch: refetchSoldeAlipay } = useCompteAlipaySolde(
    selectedCompte?.kind === 'alipay' ? selectedCompte.id : 0
  );
  const { data: mouvementsCaisse = [], refetch: refetchMouvementsCaisse } = useMouvementsCaisse(
    selectedCompte?.kind === 'caisse'
      ? { caisse_id: selectedCompte.id, date_from: dateFrom, date_to: dateTo }
      : undefined
  );
  const { data: mouvementsAlipay = [], refetch: refetchMouvementsAlipay } = useMouvementsAlipay(
    selectedCompte?.kind === 'alipay'
      ? { compte_alipay_id: selectedCompte.id, date_from: dateFrom, date_to: dateTo }
      : undefined
  );

  const annulerCaisse = useAnnulerMouvementCaisse();
  const annulerAlipay = useAnnulerMouvementAlipay();
  const createCaisse = useCreateCaisse();
  const createCompteAlipay = useCreateCompteAlipay();
  const setResponsableCaisse = useSetResponsableCaisse();
  const setResponsableAlipay = useSetResponsableCompteAlipay();
  const archiveCaisse = useArchiveCaisse();
  const archiveCompteAlipay = useArchiveCompteAlipay();

  const comptesUnifies: CompteUnifie[] = useMemo(() => [
    ...caisses.map(c => ({
      kind: 'caisse' as const,
      id: c.id,
      nom: c.nom,
      description: c.description,
      responsable_id: c.responsable_id,
      responsable: c.responsable,
    })),
    ...comptesAlipay.map(c => ({
      kind: 'alipay' as const,
      id: c.id,
      nom: c.nom,
      responsable_id: c.responsable_id,
      responsable: c.responsable,
    })),
  ], [caisses, comptesAlipay]);

  const selectedCaisse = selectedCompte?.kind === 'caisse' ? caisses.find(c => c.id === selectedCompte.id) : undefined;
  const selectedCompteAlipay = selectedCompte?.kind === 'alipay' ? comptesAlipay.find(c => c.id === selectedCompte.id) : undefined;

  const handleAnnuler = async (id: number) => {
    if (!motifAnnulation.trim()) {
      toast.error('Veuillez saisir un motif d\'annulation');
      return;
    }
    try {
      if (isAlipaySelected) {
        await annulerAlipay.mutateAsync({ id, motif: motifAnnulation });
      } else {
        await annulerCaisse.mutateAsync({ id, motif: motifAnnulation });
      }
      toast.success('Mouvement annulé');
      setAnnulerId(null);
      setMotifAnnulation('');
      if (isAlipaySelected) { refetchMouvementsAlipay(); refetchSoldeAlipay(); }
      else { refetchMouvementsCaisse(); refetchSoldeCaisse(); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleCreateCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    try {
      if (newType === 'alipay') {
        const c = await createCompteAlipay.mutateAsync({ nom: newNom, responsable_id: newResponsableId || null });
        toast.success('Compte Alipay créé');
        setSelectedCompte({ kind: 'alipay', id: c.id });
      } else {
        const c = await createCaisse.mutateAsync({
          nom: newNom,
          description: newDesc,
          responsable_id: newResponsableId || null,
        });
        toast.success('Caisse créée');
        setSelectedCompte({ kind: 'caisse', id: c.id });
      }
      setShowCreateCompte(false);
      setNewNom(''); setNewDesc(''); setNewResponsableId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleSetResponsable = async (compte: CompteUnifie, responsableId: string) => {
    try {
      if (compte.kind === 'alipay') {
        await setResponsableAlipay.mutateAsync({ compteId: compte.id, responsableId: responsableId || null });
      } else {
        await setResponsableCaisse.mutateAsync({ caisseId: compte.id, responsableId: responsableId || null });
      }
      toast.success('Responsable mis à jour');
      setResponsablePopoverKey(null);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleArchive = async () => {
    if (!archiveCompteKey) return;
    const [kind, idStr] = archiveCompteKey.split(':');
    const id = Number(idStr);
    try {
      if (kind === 'alipay') {
        await archiveCompteAlipay.mutateAsync(id);
        toast.success('Compte Alipay archivé');
      } else {
        await archiveCaisse.mutateAsync(id);
        toast.success('Caisse archivée');
      }
      if (selectedCompte?.id === id) setSelectedCompte(null);
      setArchiveCompteKey(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  if (comptesUnifies.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Aucune caisse disponible</p>
        <p className="text-sm mt-1">Contactez un administrateur</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sélection de compte */}
      <div className="flex items-center gap-3 flex-wrap">
        {comptesUnifies.map(c => {
          const key = `${c.kind}:${c.id}`;
          const isSelected = selectedCompte?.kind === c.kind && selectedCompte?.id === c.id;
          const Icon = c.kind === 'alipay' ? Smartphone : Wallet;
          return (
            <div key={key} className="relative">
              <div className={`flex items-center rounded-xl border transition-all overflow-hidden ${
                isSelected ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'
              }`}>
                <button
                  onClick={() => setSelectedCompte({ kind: c.kind, id: c.id })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-100' : c.kind === 'alipay' ? 'text-orange-500' : 'text-gray-500'}`} />
                  <span className={isSelected ? 'text-white' : 'text-gray-700'}>{c.nom}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-blue-500 text-blue-50' : c.kind === 'alipay' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.kind === 'alipay' ? 'RMB' : 'Ar'}
                  </span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setResponsablePopoverKey(responsablePopoverKey === key ? null : key)}
                    title="Gérer la responsable"
                    className={`px-2 py-2 border-l transition-colors ${
                      isSelected ? 'border-blue-500 text-blue-200 hover:bg-blue-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                  >
                    <UserCog className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setArchiveCompteKey(key)}
                    title="Archiver ce compte"
                    className={`px-2 py-2 border-l transition-colors ${
                      isSelected ? 'border-blue-500 text-blue-200 hover:bg-red-600 hover:text-white' : 'border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {c.responsable && (
                <div className="absolute -bottom-5 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-xs text-gray-400 whitespace-nowrap truncate max-w-[120px]">{c.responsable.full_name}</span>
                </div>
              )}
              {isAdmin && responsablePopoverKey === key && (
                <div className="absolute left-0 top-full mt-2 z-30 bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Responsable {c.kind === 'alipay' ? 'Alipay' : 'de la caisse'}
                    </p>
                    <button onClick={() => setResponsablePopoverKey(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    defaultValue={c.responsable_id ?? ''}
                    onChange={e => handleSetResponsable(c, e.target.value)}
                    disabled={c.kind === 'alipay' ? setResponsableAlipay.isPending : setResponsableCaisse.isPending}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">— Aucune responsable —</option>
                    {employees.map(emp => (
                      <option key={emp.user_id} value={emp.user_id}>
                        {emp.full_name ?? emp.email ?? emp.user_id}
                        {emp.role ? ` (${emp.role})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => setShowCreateCompte(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle caisse
          </button>
        )}
      </div>

      {comptesUnifies.some(c => c.responsable) && <div className="h-2" />}

      {showCreateCompte && (
        <form onSubmit={handleCreateCompte} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end flex-wrap">
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de compte</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as 'caisse' | 'alipay')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="caisse">Caisse espèces (Ariary)</option>
              <option value="alipay">Compte Alipay (RMB)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {newType === 'alipay' ? 'Nom du compte' : 'Nom de la caisse'}
            </label>
            <input value={newNom} onChange={e => setNewNom(e.target.value)}
              placeholder={newType === 'alipay' ? 'Ex: Alipay Nirina' : 'Ex: Caisse Ambodivona'} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {newType === 'caisse' && (
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          )}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Responsable (optionnel)</label>
            <select
              value={newResponsableId}
              onChange={e => setNewResponsableId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Aucune —</option>
              {employees.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.full_name ?? emp.email ?? emp.user_id}
                  {emp.role ? ` (${emp.role})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={createCaisse.isPending || createCompteAlipay.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {(createCaisse.isPending || createCompteAlipay.isPending) ? 'Création...' : 'Créer'}
          </button>
          <button type="button" onClick={() => setShowCreateCompte(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </form>
      )}

      {/* Détail caisse espèces */}
      {selectedCaisse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Wallet className="w-4 h-4 text-gray-500" />
                <h3 className="text-base font-semibold text-gray-900">{selectedCaisse.nom}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Ariary</span>
              </div>
              {selectedCaisse.description && <p className="text-sm text-gray-500">{selectedCaisse.description}</p>}
              {selectedCaisse.responsable && (
                <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                  <UserCog className="w-3 h-3" /> {selectedCaisse.responsable.full_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Solde actuel</p>
              <p className={`text-2xl font-bold ${((soldeCaisse as SoldeDetail)?.total ?? 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatMga((soldeCaisse as SoldeDetail)?.total ?? 0)}
              </p>
              <div className="flex items-center justify-end gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                  Espèces : <span className="font-semibold text-gray-700">{formatMga((soldeCaisse as SoldeDetail)?.especes ?? 0)}</span>
                </span>
                {((soldeCaisse as SoldeDetail)?.cheques ?? 0) !== 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                    Chèques : <span className="font-semibold">{formatMga((soldeCaisse as SoldeDetail)?.cheques ?? 0)}</span>
                  </span>
                )}
                {((soldeCaisse as SoldeDetail)?.mvola ?? 0) !== 0 && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                    MVola : <span className="font-semibold">{formatMga((soldeCaisse as SoldeDetail)?.mvola ?? 0)}</span>
                  </span>
                )}
                {((soldeCaisse as SoldeDetail)?.orange_money ?? 0) !== 0 && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-2 py-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                    Orange Money : <span className="font-semibold">{formatMga((soldeCaisse as SoldeDetail)?.orange_money ?? 0)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50 flex-wrap">
            <span className="text-xs font-medium text-gray-600">Période :</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <span className="text-xs text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button onClick={() => setShowForm(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Saisir
            </button>
          </div>

          <CaisseTable mouvements={mouvementsCaisse} canAnnuler={isAdmin} onAnnuler={(id) => setAnnulerId(id)} canEdit={isAdmin} />
        </div>
      )}

      {/* Détail compte Alipay */}
      {selectedCompteAlipay && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <h3 className="text-base font-semibold text-gray-900">{selectedCompteAlipay.nom}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">RMB</span>
              </div>
              {selectedCompteAlipay.responsable && (
                <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                  <UserCog className="w-3 h-3" /> {selectedCompteAlipay.responsable.full_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Solde Alipay</p>
              <p className={`text-2xl font-bold ${(soldeAlipay ?? 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                ¥{(soldeAlipay ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">RMB</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50 flex-wrap">
            <span className="text-xs font-medium text-gray-600">Période :</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <span className="text-xs text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button onClick={() => setShowForm(true)}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Saisir
            </button>
          </div>

          <AlipayTable mouvements={mouvementsAlipay} canAnnuler={isAdmin} onAnnuler={(id) => setAnnulerId(id)} />
        </div>
      )}

      {!selectedCompte && comptesUnifies.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Sélectionnez une caisse pour voir les mouvements</p>
        </div>
      )}

      {/* Modal annulation */}
      {annulerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Annuler le mouvement{isAlipaySelected ? ' Alipay' : ''}
            </h3>
            <p className="text-sm text-gray-600 mb-3">Veuillez saisir le motif d'annulation.</p>
            <textarea value={motifAnnulation} onChange={e => setMotifAnnulation(e.target.value)}
              rows={3} placeholder="Motif..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3" />
            <div className="flex gap-3">
              <button onClick={() => { setAnnulerId(null); setMotifAnnulation(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={() => handleAnnuler(annulerId)}
                disabled={isAlipaySelected ? annulerAlipay.isPending : annulerCaisse.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {(isAlipaySelected ? annulerAlipay.isPending : annulerCaisse.isPending) ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && selectedCompte?.kind === 'caisse' && (
        <MouvementForm
          caisseId={selectedCompte.id}
          isAdmin={isAdmin}
          onClose={() => setShowForm(false)}
          onSuccess={() => { refetchMouvementsCaisse(); refetchSoldeCaisse(); }}
        />
      )}

      {showForm && selectedCompte?.kind === 'alipay' && selectedCompteAlipay && (
        <AlipayMouvementForm
          compteAlipayId={selectedCompteAlipay.id}
          compteNom={selectedCompteAlipay.nom}
          onClose={() => setShowForm(false)}
          onSuccess={() => { refetchMouvementsAlipay(); refetchSoldeAlipay(); }}
        />
      )}

      {/* Modal confirmation archivage */}
      {archiveCompteKey !== null && (() => {
        const [kind, idStr] = archiveCompteKey.split(':');
        const compte = comptesUnifies.find(c => c.kind === kind && c.id === Number(idStr));
        const isAlipay = kind === 'alipay';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Archiver {isAlipay ? 'le compte Alipay' : 'la caisse'}
                  </h3>
                  <p className="text-sm text-gray-500">{compte?.nom}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {isAlipay ? 'Ce compte' : 'Cette caisse'} sera désactivé{isAlipay ? '' : 'e'} et archivé{isAlipay ? '' : 'e'}. Les mouvements existants sont conservés.
              </p>
              <p className="text-sm text-gray-500 mb-5">
                Vous pourrez le restaurer depuis la page <span className="font-medium text-gray-700">Archives</span>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setArchiveCompteKey(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={handleArchive}
                  disabled={isAlipay ? archiveCompteAlipay.isPending : archiveCaisse.isPending}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                  {(isAlipay ? archiveCompteAlipay.isPending : archiveCaisse.isPending) ? 'Archivage...' : 'Archiver'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ==========================================
// Responsable Assignation Popover (admin)
// ==========================================

interface ResponsablePopoverProps {
  compte: CompteBancaire;
  onClose: () => void;
}

function ResponsablePopover({ compte, onClose }: ResponsablePopoverProps) {
  const { data: employees = [] } = useAllEmployees();
  const setResponsable = useSetResponsableCompte();
  const [selectedId, setSelectedId] = useState<string>(compte.responsable_id ?? '');

  const handleSave = async () => {
    try {
      await setResponsable.mutateAsync({ compteId: compte.id, responsableId: selectedId || null });
      toast.success('Responsable mis à jour');
      onClose();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 z-30 bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Responsable du compte</p>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        La responsable assignée pourra voir et saisir des mouvements sur ce compte.
      </p>
      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">— Aucune responsable —</option>
        {employees.map(emp => (
          <option key={emp.user_id} value={emp.user_id}>
            {emp.full_name ?? emp.email ?? emp.user_id}
            {emp.role ? ` (${emp.role})` : ''}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={setResponsable.isPending}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {setResponsable.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button onClick={onClose} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Tab Banque
// ==========================================

function TabBanque({ isAdmin }: { isAdmin: boolean }) {
  const [selectedCompteId, setSelectedCompteId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showApproForm, setShowApproForm] = useState(false);
  const [showCreateCompte, setShowCreateCompte] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newBanque, setNewBanque] = useState('');
  const [newDevise, setNewDevise] = useState<'MGA' | 'USD' | 'EUR' | 'RMB'>('MGA');
  const [archiveCompteId, setArchiveCompteId] = useState<number | null>(null);
  const [annulerId, setAnnulerId] = useState<number | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: comptes = [] } = useComptesBancaires();

  const { data: solde, refetch: refetchSolde } = useCompteBancaireSolde(selectedCompteId ?? 0);
  const { data: mouvements = [], refetch: refetchMouvements } = useMouvementsBancaires(
    selectedCompteId
      ? { compte_bancaire_id: selectedCompteId, ...(dateFrom ? { date_from: dateFrom } : {}), ...(dateTo ? { date_to: dateTo } : {}) }
      : undefined
  );
  const createCompte = useCreateCompteBancaire();
  const archiveCompte = useArchiveCompteBancaire();
  const annuler = useAnnulerMouvementBancaire();
  const selectedCompte = comptes.find(c => c.id === selectedCompteId);

  const handleAnnuler = async (id: number) => {
    if (!motifAnnulation.trim()) return;
    try {
      await annuler.mutateAsync({ id, motif: motifAnnulation });
      toast.success('Mouvement annulé');
      setAnnulerId(null);
      setMotifAnnulation('');
      refetchMouvements();
      refetchSolde();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleCreateCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !newBanque.trim()) return;
    try {
      const c = await createCompte.mutateAsync({ nom: newNom, banque: newBanque, devise: newDevise });
      toast.success('Compte créé');
      setShowCreateCompte(false);
      setNewNom(''); setNewBanque('');
      setSelectedCompteId(c.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleArchiveCompte = async () => {
    if (archiveCompteId === null) return;
    try {
      await archiveCompte.mutateAsync(archiveCompteId);
      toast.success('Compte archivé');
      if (selectedCompteId === archiveCompteId) setSelectedCompteId(null);
      setArchiveCompteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {comptes.map(c => (
          <div key={c.id} className="flex items-center rounded-xl border overflow-hidden transition-all ${selectedCompteId === c.id ? 'border-blue-600' : 'border-gray-200 hover:border-blue-300'}">
            <button
              onClick={() => setSelectedCompteId(c.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCompteId === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.nom}
              <span className="ml-1.5 text-xs opacity-75">{c.devise}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setArchiveCompteId(c.id)}
                title="Archiver ce compte"
                className={`px-2 py-2 border-l transition-colors ${
                  selectedCompteId === c.id
                    ? 'border-blue-500 bg-blue-600 text-blue-200 hover:bg-red-600 hover:text-white'
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => setShowCreateCompte(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouveau compte
          </button>
        )}
      </div>

      {showCreateCompte && (
        <form onSubmit={handleCreateCompte} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du compte</label>
            <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Ex: Compte BNI" required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Banque</label>
            <input value={newBanque} onChange={e => setNewBanque(e.target.value)} placeholder="BNI, BFV..." required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Devise</label>
            <select value={newDevise} onChange={e => setNewDevise(e.target.value as 'MGA' | 'USD' | 'EUR' | 'RMB')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="MGA">MGA</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="RMB">RMB</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Créer</button>
          <button type="button" onClick={() => setShowCreateCompte(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Annuler</button>
        </form>
      )}

      {selectedCompte && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selectedCompte.nom}</h3>
              <p className="text-sm text-gray-500">{selectedCompte.banque}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Solde</p>
              <p className={`text-2xl font-bold ${(solde ?? 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {(solde ?? 0).toLocaleString('fr-MG')} {selectedCompte.devise}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50 flex-wrap">
            <span className="text-xs font-medium text-gray-600">Période :</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <span className="text-xs text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {isAdmin && (
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 flex-wrap">
                {selectedCompte && selectedCompte.devise === 'MGA' && comptes.some(c => c.devise !== 'MGA') && (
                  <button
                    onClick={() => setShowApproForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Approvisionnement
                  </button>
                )}
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" /> Saisir
                </button>
              </div>
            )}
          </div>

          <BanqueTable mouvements={mouvements} devise={selectedCompte.devise} canAnnuler={isAdmin} onAnnuler={(id) => setAnnulerId(id)} />
        </div>
      )}

      {!selectedCompteId && comptes.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Sélectionnez un compte pour voir les mouvements</p>
        </div>
      )}

      {!selectedCompteId && comptes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucun compte bancaire configuré.</p>
        </div>
      )}

      {/* Modal annulation mouvement bancaire */}
      {annulerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Annuler le mouvement</h3>
            <p className="text-sm text-gray-600 mb-1">Veuillez saisir le motif d'annulation.</p>
            {mouvements.find(m => m.id === annulerId)?.mouvement_bancaire_lie_id && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Ce mouvement est lié à un autre compte. Les deux mouvements seront annulés.
              </p>
            )}
            <textarea
              value={motifAnnulation}
              onChange={e => setMotifAnnulation(e.target.value)}
              rows={3} placeholder="Motif..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3"
            />
            <div className="flex gap-3">
              <button onClick={() => { setAnnulerId(null); setMotifAnnulation(''); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={() => handleAnnuler(annulerId)} disabled={annuler.isPending || !motifAnnulation.trim()} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {annuler.isPending ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && selectedCompteId && selectedCompte && (
        <MouvementBancaireForm
          compteId={selectedCompteId}
          devise={selectedCompte.devise}
          isAdmin={isAdmin}
          onClose={() => setShowForm(false)}
          onSuccess={() => { refetchMouvements(); refetchSolde(); }}
        />
      )}

      {showApproForm && selectedCompte && (
        <ApprovisionnementAgmaForm
          compteSource={selectedCompte}
          comptesDestination={comptes.filter(c => c.devise !== 'MGA')}
          onClose={() => setShowApproForm(false)}
          onSuccess={() => { refetchMouvements(); refetchSolde(); }}
        />
      )}

      {/* Modal confirmation archivage compte bancaire */}
      {archiveCompteId !== null && (() => {
        const compte = comptes.find(c => c.id === archiveCompteId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Archiver le compte</h3>
                  <p className="text-sm text-gray-500">{compte?.nom} — {compte?.banque}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Ce compte sera désactivé et archivé. Les mouvements existants sont conservés.
              </p>
              <p className="text-sm text-gray-500 mb-5">
                Vous pourrez le restaurer depuis la page <span className="font-medium text-gray-700">Archives</span>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setArchiveCompteId(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleArchiveCompte}
                  disabled={archiveCompte.isPending}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {archiveCompte.isPending ? 'Archivage...' : 'Archiver'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ==========================================
// Tab Avances
// ==========================================

function TabAvances({ isAdmin }: { isAdmin: boolean }) {
  const { data: avances = [] } = useAvancesSalaires();
  const marquerRembourse = useMarquerAvanceRembourse();

  const enAttente = avances.filter(a => a.statut === 'en_attente');
  const remboursees = avances.filter(a => a.statut === 'rembourse');

  const handleRembourser = async (id: number) => {
    try {
      await marquerRembourse.mutateAsync(id);
      toast.success('Avance marquée comme remboursée');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-4">
      {enAttente.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p className="font-medium text-sm">Aucune avance en attente de remboursement</p>
        </div>
      )}

      {enAttente.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-orange-50">
            <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Avances en attente ({enAttente.length})
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Date</Th>
                  <Th>Employé</Th>
                  <Th>Notes</Th>
                  <Th className="text-right">Montant</Th>
                  {isAdmin && <Th></Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enAttente.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'}>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(a.date_avance)}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{a.employe?.full_name ?? a.employe_id}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{a.notes || '—'}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold text-orange-600">{formatMga(Number(a.montant_mga))}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleRembourser(a.id)}
                          disabled={marquerRembourse.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" /> Remboursé
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {remboursees.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-green-50">
            <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Remboursées ({remboursees.length})
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Date avance</Th>
                  <Th>Date remboursement</Th>
                  <Th>Employé</Th>
                  <Th>Notes</Th>
                  <Th className="text-right">Montant</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 opacity-60">
                {remboursees.slice(0, 30).map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(a.date_avance)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{a.date_remboursement ? formatDate(a.date_remboursement) : '—'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{a.employe?.full_name ?? a.employe_id}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{a.notes || '—'}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-sm font-medium text-gray-500">{formatMga(Number(a.montant_mga))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Tab Notes débit
// ==========================================

function TabNotesDebit() {
  const { data: notes = [] } = useNotesDebitAll();

  const rowClass = (statut: string) => {
    if (statut === 'payee') return 'bg-green-50 hover:bg-green-100/70';
    if (statut === 'partielle') return 'bg-amber-50 hover:bg-amber-100/70';
    return 'bg-white hover:bg-gray-50';
  };

  const statutBadge = (statut: string) => {
    if (statut === 'payee') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Payée</span>;
    if (statut === 'partielle') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Partielle</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Impayée</span>;
  };

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-sm">Aucune note de débit</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Notes de débit ({notes.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Référence</Th>
                  <Th>Client</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Montant fret</Th>
                  <Th className="text-right">Frais livraison</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Payé</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notes.map((n) => {
                  const total = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
                  const paye = Number(n.total_paye ?? 0);
                  return (
                    <tr key={n.id} className={rowClass(n.statut_paiement)}>
                      <td className="px-3 py-3 text-sm font-semibold text-gray-800">{n.reference}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{n.client_pseudo ?? n.client_nom ?? '—'}</td>
                      <td className="px-3 py-3">{statutBadge(n.statut_paiement)}</td>
                      <td className="px-3 py-3 text-right text-sm text-gray-600">{formatMga(Number(n.montant_total_ariary))}</td>
                      <td className="px-3 py-3 text-right text-sm text-gray-600">{n.frais_livraison_ariary ? formatMga(Number(n.frais_livraison_ariary)) : '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`text-sm font-bold ${n.statut_paiement === 'payee' ? 'text-green-700' : n.statut_paiement === 'partielle' ? 'text-amber-700' : 'text-red-600'}`}>
                          {formatMga(total)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-gray-600">
                        {paye > 0 ? formatMga(paye) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Tab Rapport
// ==========================================

const MOIS_LABELS_RAPPORT = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function NotesDebitParDepartSection({ notes, isLoading }: { notes: NoteDebitRapport[]; isLoading: boolean }) {
  const lignes = buildNotesParDepart(notes);

  const totalPaye = lignes.reduce((s, l) => s + l.totalPaye, 0);
  const totalImpaye = lignes.reduce((s, l) => s + l.totalImpaye, 0);
  const totalEmis = lignes.reduce((s, l) => s + l.totalEmis, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-500" />
        <h3 className="text-base font-semibold text-gray-800">Notes de débit — par Départ</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
      ) : lignes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Aucune note de débit ce mois-ci</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Départ (BL)</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nb notes</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-green-700 uppercase tracking-wide">Payé</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-red-600 uppercase tracking-wide">Impayé</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Total émis</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(l => (
                <tr key={l.departId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{l.numBl}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{l.nbNotes}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-green-700">
                    {l.totalPaye > 0 ? formatAr(l.totalPaye) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-red-600">
                    {l.totalImpaye > 0 ? formatAr(l.totalImpaye) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{formatAr(l.totalEmis)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="py-2.5 px-3 text-xs font-bold text-gray-700 uppercase">Total</td>
                <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-700">{lignes.reduce((s, l) => s + l.nbNotes, 0)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-green-700">{formatAr(totalPaye)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-red-600">{formatAr(totalImpaye)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-gray-800">{formatAr(totalEmis)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

interface NoteDebitParDepart {
  departId: number;
  numBl: string;
  nbNotes: number;
  totalPaye: number;
  totalImpaye: number;
  totalEmis: number;
}

function buildNotesParDepart(notes: NoteDebitRapport[]): NoteDebitParDepart[] {
  const map = new Map<number, NoteDebitParDepart>();
  for (const n of notes) {
    const key = n.depart_id;
    const montant = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
    const existing = map.get(key);
    if (existing) {
      existing.nbNotes++;
      existing.totalEmis += montant;
      if (n.statut_paiement === 'payee') existing.totalPaye += montant;
      else existing.totalImpaye += montant;
    } else {
      map.set(key, {
        departId: key,
        numBl: n.depart?.num_bl ?? `Départ #${key}`,
        nbNotes: 1,
        totalEmis: montant,
        totalPaye: n.statut_paiement === 'payee' ? montant : 0,
        totalImpaye: n.statut_paiement !== 'payee' ? montant : 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.numBl.localeCompare(b.numBl));
}

function formatAr(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

function TabRapport({ isAdmin }: { isAdmin: boolean }) {
  const { data: caisses = [] } = useCaisses();
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [selectedCaisseId, setSelectedCaisseId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: rapportComplet, isLoading: isLoadingComplet } = useRapportMensuelComplet(annee, mois);
  const { data: notesRapport = [], isLoading: isLoadingNotes } = useNotesDebitRapport(annee, mois);

  function prevMonth() {
    if (mois === 1) { setMois(12); setAnnee(a => a - 1); }
    else setMois(m => m - 1);
  }
  function nextMonth() {
    if (mois === 12) { setMois(1); setAnnee(a => a + 1); }
    else setMois(m => m + 1);
  }

  async function handleExport() {
    if (!rapportComplet) return;
    setExporting(true);
    try {
      const comptes: CompteAvecMouvements[] = [
        ...rapportComplet.caisses.map(({ compte, mouvements }) => ({
          type: 'caisse' as const,
          nom: compte.nom,
          devise: 'Ar',
          mouvements,
        })),
        ...rapportComplet.banques.map(({ compte, mouvements }) => ({
          type: 'banque' as const,
          nom: `${compte.nom} (${compte.banque})`,
          devise: compte.devise,
          mouvements,
        })),
        ...rapportComplet.alipay.map(({ compte, mouvements }) => ({
          type: 'alipay' as const,
          nom: compte.nom,
          devise: '¥',
          mouvements,
        })),
      ];
      exportExcelComptabilite(comptes, annee, mois, notesRapport);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête : sélecteur mois + bouton export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-semibold text-gray-800 min-w-[150px] text-center">
            {MOIS_LABELS_RAPPORT[mois - 1]} {annee}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={handleExport}
            disabled={exporting || isLoadingComplet || !rapportComplet}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter Excel'}
          </button>
        )}
      </div>

      {/* Sélecteur de caisse + rapport détaillé */}
      <div className="flex items-center gap-3 flex-wrap">
        {caisses.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCaisseId(selectedCaisseId === c.id ? null : c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              selectedCaisseId === c.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            {c.nom}
          </button>
        ))}
      </div>

      {selectedCaisseId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <RapportMensuelView caisseId={selectedCaisseId} annee={annee} mois={mois} />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Sélectionnez une caisse pour voir le rapport détaillé</p>
        </div>
      )}

      {/* ---- Notes de débit par Départ ---- */}
      <NotesDebitParDepartSection notes={notesRapport} isLoading={isLoadingNotes} />
    </div>
  );
}

// ==========================================
// Tab Paiements Fournisseur
// ==========================================

const STATUT_DETTE_CONFIG: Record<StatutDetteFournisseur, { label: string; color: string; dot: string }> = {
  en_attente: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  partiellement_remboursee: { label: 'Partiel', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  remboursee: { label: 'Remboursée', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
};

function DetteRowDetail({ detteId }: { detteId: number }) {
  const { data: remboursements = [], isLoading } = useDettesFournisseurRemboursements(detteId);
  if (isLoading) return <div className="px-6 py-3 text-xs text-gray-400">Chargement…</div>;
  if (remboursements.length === 0) return <div className="px-6 py-3 text-xs text-gray-400">Aucun remboursement enregistré.</div>;
  return (
    <div className="px-6 py-3 bg-blue-50/60 border-t border-blue-100">
      <p className="text-xs font-semibold text-blue-700 mb-2">Remboursements reçus ({remboursements.length})</p>
      <div className="space-y-1.5">
        {remboursements.map(r => (
          <div key={r.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{formatDate(r.date_mouvement)}</span>
            <span className="font-medium text-green-700">+{Number(r.montant_mga).toLocaleString('fr-MG')} Ar</span>
            <span className="text-gray-500">{r.saisie_par?.full_name ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPaiementsFournisseur({ isAdmin, canCreate }: { isAdmin: boolean; canCreate: boolean }) {
  const [filtreStatut, setFiltreStatut] = useState<StatutDetteFournisseur | ''>('');
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreDateFrom, setFiltreDateFrom] = useState('');
  const [filtreDateTo, setFiltreDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDette, setEditDette] = useState<DetteFournisseur | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [annulerId, setAnnulerId] = useState<number | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const { data: dettes = [], refetch, isLoading } = useDettesFournisseur({
    statut: filtreStatut,
    date_from: filtreDateFrom || undefined,
    date_to: filtreDateTo || undefined,
  });

  const annuler = useAnnulerDetteFournisseur();

  const dettesFiltrees = useMemo(() => {
    if (!filtreClient.trim()) return dettes;
    const q = filtreClient.toLowerCase();
    return dettes.filter(d =>
      (d.client?.pseudo ?? '').toLowerCase().includes(q) ||
      (d.client?.nom ?? '').toLowerCase().includes(q) ||
      (d.client?.prenom ?? '').toLowerCase().includes(q)
    );
  }, [dettes, filtreClient]);

  const stats = useMemo(() => {
    const actives = dettes.filter(d => !d.est_annule);
    const totalUsd = actives.reduce((s, d) => s + Number(d.montant_usd), 0);
    const totalMga = actives.reduce((s, d) => s + Number(d.montant_mga_equivalent), 0);
    const totalRembourse = actives.reduce((s, d) => s + Number(d.montant_rembourse_mga), 0);
    const totalRestant = totalMga - totalRembourse;
    return { totalUsd, totalMga, totalRembourse, totalRestant };
  }, [dettes]);

  const handleAnnuler = async () => {
    if (!annulerId || !motifAnnulation.trim()) return;
    try {
      await annuler.mutateAsync({ id: annulerId, motif: motifAnnulation });
      toast.success('Dette annulée');
      setAnnulerId(null);
      setMotifAnnulation('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats cards — admin only */}
      {isAdmin && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total USD payé', value: `${stats.totalUsd.toFixed(2)}`, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Équivalent MGA', value: `${stats.totalMga.toLocaleString('fr-MG')} Ar`, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Remboursé MGA', value: `${stats.totalRembourse.toLocaleString('fr-MG')} Ar`, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Restant à recouvrir', value: `${stats.totalRestant.toLocaleString('fr-MG')} Ar`, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouveau paiement fournisseur
          </button>
        )}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={filtreClient}
            onChange={e => setFiltreClient(e.target.value)}
            placeholder="Filtrer par client…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value as StatutDetteFournisseur | '')}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="partiellement_remboursee">Partiel</option>
          <option value="remboursee">Remboursée</option>
        </select>
        <input type="date" value={filtreDateFrom} onChange={e => setFiltreDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          title="Date début" />
        <input type="date" value={filtreDateTo} onChange={e => setFiltreDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          title="Date fin" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : dettesFiltrees.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-500">Aucun paiement fournisseur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">USD</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Taux</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Equiv. MGA</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Remboursé</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  {isAdmin && <th className="px-4 py-3 w-12"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dettesFiltrees.map((dette, i) => {
                  const restant = Number(dette.montant_mga_equivalent) - Number(dette.montant_rembourse_mga);
                  const statutConf = STATUT_DETTE_CONFIG[dette.statut as StatutDetteFournisseur] ?? STATUT_DETTE_CONFIG.en_attente;
                  const isExpanded = expandedId === dette.id;
                  const isAnnule = dette.est_annule;
                  return (
                    <React.Fragment key={dette.id}>
                      <tr
                        className={`transition-colors cursor-pointer ${isAnnule ? 'opacity-40' : i % 2 === 0 ? 'hover:bg-gray-50/50' : 'bg-gray-50/30 hover:bg-gray-100/50'}`}
                        onClick={() => setExpandedId(isExpanded ? null : dette.id)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs font-semibold ${isAnnule ? 'line-through text-gray-400' : 'text-blue-700'}`}>
                            {dette.reference}
                          </span>
                          {isAnnule && <span className="ml-2 text-xs text-red-500">Annulé</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-xs">{dette.client?.pseudo ?? '—'}</p>
                          {(dette.client?.nom || dette.client?.prenom) && (
                            <p className="text-xs text-gray-400">{[dette.client.prenom, dette.client.nom].filter(Boolean).join(' ')}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(dette.date_paiement)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-blue-700 whitespace-nowrap">
                          ${Number(dette.montant_usd).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono whitespace-nowrap">
                          {Number(dette.taux_usd_mga).toLocaleString('fr-MG')}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {Number(dette.montant_mga_equivalent).toLocaleString('fr-MG')} Ar
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-green-700 whitespace-nowrap">
                          {Number(dette.montant_rembourse_mga).toLocaleString('fr-MG')} Ar
                        </td>
                        <td className={`px-4 py-3 text-right text-xs font-bold whitespace-nowrap ${restant > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {restant > 0 ? `${restant.toLocaleString('fr-MG')} Ar` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statutConf.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statutConf.dot}`}></span>
                            {statutConf.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {!isAnnule && (
                                <button
                                  onClick={() => setEditDette(dette)}
                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                  title="Modifier ce paiement"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isAnnule && dette.statut !== 'remboursee' && (
                                <button
                                  onClick={() => setAnnulerId(dette.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Annuler cette dette"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={isAdmin ? 11 : 10} className="p-0">
                            <div className="mx-4 mb-2">
                              {dette.description && (
                                <div className="px-4 py-2 bg-gray-50 border-l-4 border-blue-300 text-xs text-gray-600 mb-1">
                                  {dette.description}
                                  {dette.notes && <span className="ml-2 text-gray-400">· {dette.notes}</span>}
                                </div>
                              )}
                              <DetteRowDetail detteId={dette.id} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal annulation */}
      {annulerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Annuler la dette fournisseur</h3>
            <p className="text-sm text-gray-500 mb-3">Cette action est irréversible. Le solde ne sera pas restitué automatiquement.</p>
            <textarea
              value={motifAnnulation}
              onChange={e => setMotifAnnulation(e.target.value)}
              rows={3} placeholder="Motif d'annulation…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3"
            />
            <div className="flex gap-3">
              <button onClick={() => { setAnnulerId(null); setMotifAnnulation(''); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleAnnuler} disabled={annuler.isPending || !motifAnnulation.trim()} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {annuler.isPending ? 'Annulation…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <DetteFournisseurForm
          onClose={() => setShowForm(false)}
          onSuccess={() => refetch()}
        />
      )}

      {editDette && (
        <DetteFournisseurForm
          dette={editDette}
          onClose={() => setEditDette(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// ==========================================
// Tab Alipay
// ==========================================

const TYPE_ALIPAY_LABELS: Record<TypeMouvementAlipay, string> = {
  approvisionnement: 'Approvisionnement',
  achat_fournisseur: 'Achat fournisseur',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
};

function alipayDevisRef(m: MouvementAlipay): string {
  if (!m.demande_achat) return '—';
  const yy = new Date(m.demande_achat.date_creation).getFullYear().toString().slice(-2);
  return `SA${yy}${String(m.demande_achat.id).padStart(3, '0')}`;
}

interface AlipayTableProps {
  mouvements: MouvementAlipay[];
  canAnnuler: boolean;
  onAnnuler: (id: number) => void;
}

function AlipayTable({ mouvements, canAnnuler, onAnnuler }: AlipayTableProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSens, setFilterSens] = useState<string>('');

  const filtered = useMemo(() => {
    return mouvements.filter(m => {
      if (filterType && m.type_mouvement !== filterType) return false;
      if (filterSens && m.sens !== filterSens) return false;
      return true;
    });
  }, [mouvements, filterType, filterSens]);

  const totalEntrees = filtered.filter(m => m.sens === 'entree' && !m.est_annule).reduce((s, m) => s + Number(m.montant_rmb), 0);
  const totalSorties = filtered.filter(m => m.sens === 'sortie' && !m.est_annule).reduce((s, m) => s + Number(m.montant_rmb), 0);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les types</option>
          {(Object.entries(TYPE_ALIPAY_LABELS) as [TypeMouvementAlipay, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterSens}
          onChange={e => setFilterSens(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Entrées & sorties</option>
          <option value="entree">Entrées seulement</option>
          <option value="sortie">Sorties seulement</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} mouvement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Aucun mouvement</p>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Devis lié</Th>
                <Th>Fournisseur / Tiers</Th>
                <Th>Taux (MGA)</Th>
                <Th className="text-right">Entrée (¥)</Th>
                <Th className="text-right">Sortie (¥)</Th>
                <Th>Statut</Th>
                {canAnnuler && <Th></Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m, i) => {
                const isEntree = m.sens === 'entree';
                const annule = m.est_annule;
                return (
                  <tr
                    key={m.id}
                    className={`${annule ? 'opacity-40 line-through' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(m.date_mouvement)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isEntree ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isEntree ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{TYPE_ALIPAY_LABELS[m.type_mouvement] ?? m.type_mouvement}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-[200px]">
                      <p className="truncate" title={m.description}>{m.description || '—'}</p>
                      {m.reference_externe && (
                        <p className="text-gray-400 font-mono text-[10px] mt-0.5">{m.reference_externe}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {m.demande_achat ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                          {alipayDevisRef(m)}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{m.tiers_nom ?? '—'}</td>
                    <td className="px-3 py-3 text-xs text-amber-700 whitespace-nowrap font-mono">
                      {m.taux_rmb_mga ? Number(m.taux_rmb_mga).toLocaleString('fr-MG') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {isEntree && !annule ? (
                        <span className="text-sm font-semibold text-green-600">
                          +¥{Number(m.montant_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {!isEntree && !annule ? (
                        <span className="text-sm font-semibold text-red-600">
                          −¥{Number(m.montant_rmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {annule ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                          <Ban className="w-3 h-3" /> Annulé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3" /> Valide
                        </span>
                      )}
                    </td>
                    {canAnnuler && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        {!annule && (
                          <button
                            onClick={() => onAnnuler(m.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                            title="Annuler ce mouvement"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Page principale
// ==========================================

type Tab = 'caisses' | 'banque' | 'avances' | 'notes_debit' | 'paiements_fournisseur' | 'cheques' | 'releve_clients' | 'rapport';

export default function ComptabilitePage() {
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';
  const isTresorier = profileData?.role === 'tresorier';
  const isAcheteur = profileData?.role === 'acheteur';

  const canAccess = isAdmin || isTresorier || isAcheteur;

  const [activeTab, setActiveTab] = useState<Tab>('caisses');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'caisses', label: 'Caisses', icon: Wallet },
    ...(isAdmin ? [{ id: 'banque' as Tab, label: 'Banque', icon: Building2 }] : []),
    ...(!isAcheteur ? [{ id: 'avances' as Tab, label: 'Avances', icon: Users }] : []),
    { id: 'notes_debit', label: 'Notes de débit', icon: FileText },
    { id: 'paiements_fournisseur' as Tab, label: 'Paiements Fournisseur', icon: CreditCard },
    { id: 'cheques' as Tab, label: 'Chèques', icon: CreditCard },
    { id: 'releve_clients' as Tab, label: 'Relevé Clients', icon: Users },
    ...(isAdmin ? [{ id: 'rapport' as Tab, label: 'Rapport', icon: BarChart3 }] : []),
  ];

  // Pas d'accès du tout
  if (!canAccess) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Accès restreint</p>
        <p className="text-sm mt-1">Vous n'avez pas accès à cette section.</p>
      </div>
    );
  }

  const visibleTabs = TABS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Comptabilité</h1>
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'caisses' && <TabCaisses isAdmin={isAdmin} isAcheteur={isAcheteur} />}
      {activeTab === 'banque' && isAdmin && <TabBanque isAdmin={isAdmin} />}
      {activeTab === 'avances' && !isAcheteur && <TabAvances isAdmin={isAdmin} />}
      {activeTab === 'notes_debit' && <TabNotesDebit />}
      {activeTab === 'paiements_fournisseur' && <TabPaiementsFournisseur isAdmin={isAdmin} canCreate={isAdmin || isTresorier || isAcheteur} />}
      {activeTab === 'cheques' && <ChequesTab canEdit={isAdmin || isTresorier} isAdmin={isAdmin} />}
      {activeTab === 'releve_clients' && <ReleveClientsTab />}
      {activeTab === 'rapport' && isAdmin && <TabRapport isAdmin={isAdmin} />}
    </div>
  );
}
