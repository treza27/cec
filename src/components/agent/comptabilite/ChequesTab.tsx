import React, { useState, useMemo } from 'react';
import { Search, Ban, CheckCircle, Clock, CreditCard, AlertTriangle, X, Info, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCheques,
  useChangerStatutCheque,
  useUpdateChequeDetails,
} from '../../../hooks/useComptabilite';
import { StatutCheque, Cheque } from '../../../services/comptabiliteService';

function formatMga(n: number) {
  return n.toLocaleString('fr-MG') + ' Ar';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const STATUT_CONFIG: Record<StatutCheque, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  en_attente: {
    label: 'En attente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="w-3 h-3" />,
  },
  verse: {
    label: 'Versé',
    color: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  annule: {
    label: 'Annulé',
    color: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
    icon: <Ban className="w-3 h-3" />,
  },
};

function isOverdue(dateEcheance: string, statut: StatutCheque): boolean {
  if (statut !== 'en_attente') return false;
  return new Date(dateEcheance) < new Date(new Date().toDateString());
}

function isDueSoon(dateEcheance: string, statut: StatutCheque): boolean {
  if (statut !== 'en_attente') return false;
  const today = new Date(new Date().toDateString());
  const echeance = new Date(dateEcheance);
  const diffDays = Math.ceil((echeance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

// ==========================================
// Modal: annuler un chèque
// ==========================================

function EditChequeModal({ cheque, onClose, onSuccess }: {
  cheque: Cheque;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [numero, setNumero] = useState(cheque.numero_cheque);
  const [payeur, setPayeur] = useState(cheque.payeur);
  const [echeance, setEcheance] = useState(cheque.date_echeance);
  const [description, setDescription] = useState(cheque.description ?? '');
  const updateMutation = useUpdateChequeDetails();

  const handleSave = async () => {
    if (!numero.trim()) { toast.error('Numéro de chèque requis'); return; }
    if (!payeur.trim()) { toast.error('Payeur requis'); return; }
    if (!echeance) { toast.error('Date d\'échéance requise'); return; }
    try {
      await updateMutation.mutateAsync({
        id: cheque.id,
        numero_cheque: numero,
        payeur,
        date_echeance: echeance,
        description: description.trim() || null,
      });
      toast.success('Chèque mis à jour');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Modifier le chèque</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro de chèque</label>
            <input
              value={numero}
              onChange={e => setNumero(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payeur</label>
            <input
              value={payeur}
              onChange={e => setPayeur(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date d'échéance</label>
            <input
              type="date"
              value={echeance}
              onChange={e => setEcheance(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnulerChequeModal({ chequeId, onClose, onSuccess }: {
  chequeId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [motif, setMotif] = useState('');
  const changer = useChangerStatutCheque();

  const handleAnnuler = async () => {
    if (!motif.trim()) return toast.error('Veuillez indiquer un motif');
    try {
      await changer.mutateAsync({ id: chequeId, statut: 'annule', motif: motif.trim() });
      toast.success('Chèque annulé');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Annuler le chèque</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Indiquez le motif d'annulation (ex. chèque sans provision).</p>
        <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} placeholder="Motif…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Retour</button>
          <button onClick={handleAnnuler} disabled={changer.isPending || !motif.trim()} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {changer.isPending ? 'Annulation…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main tab component
// ==========================================

export default function ChequesTab({ canEdit, isAdmin }: { canEdit: boolean; isAdmin?: boolean }) {
  const [filtreStatut, setFiltreStatut] = useState<StatutCheque | ''>('');
  const [search, setSearch] = useState('');
  const [annulerId, setAnnulerId] = useState<number | null>(null);
  const [editCheque, setEditCheque] = useState<Cheque | null>(null);

  const { data: cheques = [], isLoading } = useCheques({
    statut: filtreStatut || undefined,
    search: search || undefined,
  });

  const stats = useMemo(() => {
    const enAttente = cheques.filter(c => c.statut === 'en_attente');
    const verses = cheques.filter(c => c.statut === 'verse');
    const annules = cheques.filter(c => c.statut === 'annule');
    return {
      totalAttente: enAttente.reduce((s, c) => s + Number(c.montant_mga), 0),
      totalVerse: verses.reduce((s, c) => s + Number(c.montant_mga), 0),
      totalAnnule: annules.reduce((s, c) => s + Number(c.montant_mga), 0),
      countAttente: enAttente.length,
      countVerse: verses.length,
      countAnnule: annules.length,
      countOverdue: enAttente.filter(c => isOverdue(c.date_echeance, c.statut)).length,
    };
  }, [cheques]);

  return (
    <div className="space-y-4">
      {/* Info banner: versement via transfert interne */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Les chèques sont versés en banque via un <strong>transfert interne (sortie) vers la banque</strong> avec le mode de paiement <strong>chéque</strong> dans la Caisse.
          Cet onglet sert au suivi et à la visualisation des chèques. Le statut « Versé » est mis à jour automatiquement lors du transfert.
        </p>
      </div>

      {/* Stats cards — admin only */}
      {isAdmin && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">En attente ({stats.countAttente})</p>
          <p className="text-sm font-bold text-amber-700">{formatMga(stats.totalAttente)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Versés ({stats.countVerse})</p>
          <p className="text-sm font-bold text-green-700">{formatMga(stats.totalVerse)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Annulés ({stats.countAnnule})</p>
          <p className="text-sm font-bold text-red-700">{formatMga(stats.totalAnnule)}</p>
        </div>
        <div className={`rounded-xl p-3 ${stats.countOverdue > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500 mb-0.5">En retard</p>
          <p className={`text-sm font-bold ${stats.countOverdue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.countOverdue} chèque{stats.countOverdue !== 1 ? 's' : ''}</p>
        </div>
      </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par n° ou payeur…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value as StatutCheque | '')}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="verse">Versés</option>
          <option value="annule">Annulés</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : cheques.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-500">Aucun chèque trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">N° chèque</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Payeur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Réception</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Échéance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Note de débit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Versement</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  {canEdit && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cheques.map((c, i) => {
                  const statutConf = STATUT_CONFIG[c.statut];
                  const overdue = isOverdue(c.date_echeance, c.statut);
                  const dueSoon = isDueSoon(c.date_echeance, c.statut);
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${c.statut === 'annule' ? 'opacity-40' : i % 2 === 0 ? 'hover:bg-gray-50/50' : 'bg-gray-50/30 hover:bg-gray-100/50'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-900">{c.numero_cheque}</span>
                        {c.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]" title={c.description}>{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {formatMga(Number(c.montant_mga))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{c.payeur}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(c.date_reception)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap font-mono">
                        <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                          {formatDate(c.date_echeance)}
                        </span>
                        {overdue && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-red-500" title="Échéance dépassée">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {dueSoon && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-orange-500" title="Échéance proche">
                            <Clock className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.note_debit ? (
                          <span className="font-mono text-blue-600 font-medium">{c.note_debit.reference}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.statut === 'verse' && c.date_versement ? (
                          <div className="space-y-0.5">
                            {c.compte_bancaire && (
                              <span className="font-medium text-gray-700">{c.compte_bancaire.nom}</span>
                            )}
                            <span className="block text-gray-400">{formatDate(c.date_versement)}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statutConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statutConf.dot}`}></span>
                          {statutConf.label}
                        </span>
                        {c.statut === 'annule' && c.motif_annulation && (
                          <p className="text-xs text-red-400 mt-1 max-w-[120px] truncate mx-auto" title={c.motif_annulation}>{c.motif_annulation}</p>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditCheque(c)}
                              className="p-1 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {c.statut === 'en_attente' && (
                              <button
                                onClick={() => setAnnulerId(c.id)}
                                className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Annuler"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.statut === 'verse' && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                            {c.statut === 'annule' && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {annulerId !== null && (
        <AnnulerChequeModal
          chequeId={annulerId}
          onClose={() => setAnnulerId(null)}
          onSuccess={() => setAnnulerId(null)}
        />
      )}

      {editCheque && (
        <EditChequeModal
          cheque={editCheque}
          onClose={() => setEditCheque(null)}
          onSuccess={() => setEditCheque(null)}
        />
      )}
    </div>
  );
}
