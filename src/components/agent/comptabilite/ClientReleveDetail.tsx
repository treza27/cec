import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, FileText, TrendingUp, TrendingDown, Package, Wallet,
  CreditCard, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, ExternalLink, ToggleLeft, ToggleRight, AlertTriangle, X, DollarSign,
} from 'lucide-react';
import {
  useNotesDebitByPseudo,
  useDettesFournisseurByClientId,
  useRemboursementsDette,
  useToggleApureExterne,
} from '../../../hooks/useComptabilite';
import { useEmployeeProfileContext } from '../../../contexts/EmployeeProfileContext';
import { supabase } from '../../../utils/supabase';
import { useQuery } from '@tanstack/react-query';
import type { MouvementCaisse, DetteFournisseur } from '../../../services/comptabiliteService';
import toast from 'react-hot-toast';

function formatMga(n: number) {
  return n.toLocaleString('fr-MG') + ' Ar';
}

function formatUsd(n: number | null | undefined) {
  if (n == null || isNaN(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUT_FACTURE_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  payee: { label: 'Payée', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  partielle: { label: 'Partielle', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  impayee: { label: 'Impayée', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
};

const STATUT_DETTE_BADGE: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  partiellement_remboursee: { label: 'Partielle', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  remboursee: { label: 'Remboursée', color: 'bg-green-100 text-green-700 border-green-200' },
};

const MODE_PAIEMENT_LABEL: Record<string, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mvola: 'MVola',
  orange_money: 'Orange Money',
};

interface ClientInfo {
  clientId: number;
  pseudo: string;
  nomComplet: string;
  entreprise?: string;
  telephone?: string;
  statut?: string;
}

interface MouvementRow extends MouvementCaisse {
  caisse?: { nom: string };
}

// ==========================================
// Sub-component: Encaissements (uses its own query for mouvements)
// ==========================================

function EncaissementsSection({ pseudo, noteDebitIds, demandeAchatIds, detteFournisseurIds }: {
  pseudo: string;
  noteDebitIds: number[];
  demandeAchatIds: number[];
  detteFournisseurIds: number[];
}) {
  const mouvementsQuery = useQuery<MouvementRow[]>({
    queryKey: ['releve_client', 'mouvements_all', pseudo],
    queryFn: async () => {
      const ids = [...noteDebitIds, ...demandeAchatIds, ...detteFournisseurIds];
      if (!pseudo && ids.length === 0) return [];

      const { data, error } = await supabase
        .from('mouvements_caisse')
        .select(`
          *,
          saisie_par:saisie_par_id(full_name),
          note_debit:note_debit_id(reference, client_pseudo),
          caisse:caisse_id(nom),
          demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom)),
          dette_fournisseur:dette_fournisseur_id(reference, client_id)
        `)
        .order('date_mouvement', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;

      const allRows = (data ?? []) as MouvementRow[];
      const pseudoLower = pseudo.toLowerCase();
      return allRows.filter(m => {
        if (m.note_debit_id && noteDebitIds.includes(m.note_debit_id)) return true;
        if (m.demande_achat_id && demandeAchatIds.includes(m.demande_achat_id)) return true;
        if (m.dette_fournisseur_id && detteFournisseurIds.includes(m.dette_fournisseur_id)) return true;
        if (m.tiers_nom && m.tiers_nom.toLowerCase() === pseudoLower) return true;
        if (m.note_debit?.client_pseudo && m.note_debit.client_pseudo.toLowerCase() === pseudoLower) return true;
        if (m.demande_achat?.client?.pseudo && m.demande_achat.client.pseudo.toLowerCase() === pseudoLower) return true;
        return false;
      });
    },
    enabled: !!pseudo,
  });

  const rows = mouvementsQuery.data ?? [];
  const loading = mouvementsQuery.isLoading;
  const error = mouvementsQuery.isError;

  const activeRows = rows.filter(r => !r.est_annule);
  const totalEncaisse = activeRows
    .filter(r => r.sens === 'entree')
    .reduce((s, r) => s + Number(r.montant_mga), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          Encaissements
        </h3>
        {activeRows.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            Total encaissé : <span className="text-green-600 font-semibold">{formatMga(totalEncaisse)}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-400">Chargement des encaissements...</span>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-300" />
          <p className="text-sm text-red-500">Erreur lors du chargement des encaissements.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center">
          <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">Aucun encaissement pour ce client.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Libellé</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Réf. facture / dossier</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Mode</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Caisse</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(m => {
                const refFacture = m.note_debit?.reference
                  ?? (m.demande_achat ? `Devis #${m.demande_achat.id}` : null)
                  ?? (m.dette_fournisseur?.reference ?? null)
                  ?? '—';
                const libelle = m.description || m.type_mouvement || '—';
                return (
                  <tr key={m.id} className={`transition-colors hover:bg-blue-50/50 ${m.est_annule ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(m.date_mouvement)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">
                      {libelle}
                      {m.est_annule && <span className="ml-2 text-xs text-red-400 italic">(annulé)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{refFacture}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">
                      {m.mode_paiement ? MODE_PAIEMENT_LABEL[m.mode_paiement] ?? m.mode_paiement : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{m.caisse?.nom ?? '—'}</td>
                    <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${
                      m.est_annule ? 'text-gray-300' : m.sens === 'entree' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {m.sens === 'entree' ? '+' : '−'}{formatMga(Number(m.montant_mga))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Sub-component: Dette Fournisseur row with expandable remboursements
// ==========================================

function DetteFournisseurRow({ dette }: { dette: DetteFournisseur }) {
  const [expanded, setExpanded] = useState(false);
  const { data: remboursements = [], isLoading } = useRemboursementsDette(expanded ? dette.id : null);

  const montantInitial = Number(dette.montant_mga_equivalent);
  const montantRembourse = Number(dette.montant_rembourse_mga ?? 0);
  const restant = Math.max(0, montantInitial - montantRembourse);
  const badge = STATUT_DETTE_BADGE[dette.statut] ?? STATUT_DETTE_BADGE.en_attente;

  return (
    <>
      <tr
        className={`transition-colors cursor-pointer hover:bg-blue-50/50 ${dette.est_annule ? 'opacity-50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            {dette.reference}
          </span>
        </td>
        <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(dette.date_paiement)}</td>
        <td className="px-4 py-2.5 text-sm text-gray-600">{dette.description || '—'}</td>
        <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-700 whitespace-nowrap">{formatMga(montantInitial)}</td>
        <td className="px-4 py-2.5 text-right text-sm font-semibold text-green-600 whitespace-nowrap">{formatMga(montantRembourse)}</td>
        <td className="px-4 py-2.5 text-right text-sm font-semibold text-orange-600 whitespace-nowrap">{formatMga(restant)}</td>
        <td className="px-4 py-2.5 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
            {badge.label}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/70">
          <td colSpan={7} className="px-4 py-3">
            {isLoading ? (
              <div className="flex items-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="ml-2 text-xs text-gray-400">Chargement des remboursements...</span>
              </div>
            ) : remboursements.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Aucun remboursement enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-400 uppercase">Mode</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-400 uppercase">Caisse</th>
                      <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-400 uppercase">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {remboursements.map(r => (
                      <tr key={r.id}>
                        <td className="px-3 py-1.5 text-xs text-gray-600 whitespace-nowrap">{formatDate(r.date_mouvement)}</td>
                        <td className="px-3 py-1.5 text-xs text-gray-600">{r.mode_paiement ? MODE_PAIEMENT_LABEL[r.mode_paiement] ?? r.mode_paiement : '—'}</td>
                        <td className="px-3 py-1.5 text-xs text-gray-500">{r.description || '—'}</td>
                        <td className="px-3 py-1.5 text-right text-xs font-semibold text-gray-700 whitespace-nowrap">{formatMga(Number(r.montant_mga))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ==========================================
// Main component
// ==========================================

interface ClientReleveDetailProps {
  client: ClientInfo;
  onBack: () => void;
}

export default function ClientReleveDetail({ client, onBack }: ClientReleveDetailProps) {
  const { data: notes = [], isLoading: notesLoading, isError: notesError } = useNotesDebitByPseudo(client.pseudo);
  const { data: dettes = [], isLoading: dettesLoading, isError: dettesError } = useDettesFournisseurByClientId(client.clientId > 0 ? client.clientId : null);
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';
  const toggleApure = useToggleApureExterne();
  const [pendingToggle, setPendingToggle] = useState<{ noteId: number; currentValue: boolean; reference: string } | null>(null);

  const handleToggleApure = (noteId: number, currentValue: boolean, reference: string) => {
    setPendingToggle({ noteId, currentValue, reference });
  };

  const confirmToggleApure = () => {
    if (!pendingToggle) return;
    const { noteId, currentValue } = pendingToggle;
    const newValue = !currentValue;
    setPendingToggle(null);
    toast.promise(
      toggleApure.mutateAsync({ noteDebitId: noteId, apure_externe: newValue }),
      { loading: 'Mise à jour...', success: newValue ? 'Note marquée comme apurée (externe).' : 'Note remise en suivi.', error: 'Erreur lors de la mise à jour.' }
    );
  };

  const noteDebitIds = useMemo(() => notes.map(n => n.id), [notes]);
  const detteFournisseurIds = useMemo(() => dettes.map(d => d.id), [dettes]);

  // Fetch demande_achat IDs for this client (via client_id)
  const { data: demandeAchatIds = [] } = useQuery<number[]>({
    queryKey: ['releve_client', 'demande_achat_ids', client.clientId],
    queryFn: async () => {
      if (!client.clientId) return [];
      const { data, error } = await supabase
        .from('demandes_achat')
        .select('id')
        .eq('client_id', client.clientId);
      if (error) throw error;
      return (data ?? []).map((d: any) => d.id as number);
    },
    enabled: client.clientId > 0,
  });

  const totals = useMemo(() => {
    let totalFacture = 0;
    let totalEncaisse = 0;
    let totalRestant = 0;
    let totalVolume = 0;

    for (const n of notes) {
      totalVolume += Number(n.volume_total_tana ?? 0);
      if (n.apure_externe) continue;
      const totalNote = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
      const paye = Number(n.total_paye ?? 0);
      totalFacture += totalNote;
      totalEncaisse += paye;
      totalRestant += Math.max(0, totalNote - paye);
    }
    return { totalFacture, totalEncaisse, totalRestant, totalVolume };
  }, [notes]);

  const detteTotals = useMemo(() => {
    const activeDettes = dettes.filter(d => !d.est_annule);
    const totalDette = activeDettes.reduce((s, d) => s + Number(d.montant_mga_equivalent), 0);
    const totalRembourse = activeDettes.reduce((s, d) => s + Number(d.montant_rembourse_mga ?? 0), 0);
    const totalRestantDette = Math.max(0, totalDette - totalRembourse);
    return { totalDette, totalRembourse, totalRestantDette };
  }, [dettes]);

  const kpiCards = [
    { label: 'Total facturé', value: formatMga(totals.totalFacture), icon: <FileText className="w-4 h-4" />, color: 'text-gray-800', bg: 'bg-gray-50', border: 'border-gray-200' },
    { label: 'Encaissé', value: formatMga(totals.totalEncaisse), icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Reste à percevoir', value: formatMga(totals.totalRestant), icon: <TrendingDown className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'Volume total', value: `${totals.totalVolume.toFixed(3)} m³`, icon: <Package className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Dettes fournisseur', value: formatMga(detteTotals.totalDette), icon: <CreditCard className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Reste fournisseur', value: formatMga(detteTotals.totalRestantDette), icon: <Wallet className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="mt-0.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Retour à la liste"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{client.nomComplet}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                <span>Pseudo : <span className="text-gray-600 font-medium">{client.pseudo}</span></span>
                {client.entreprise && <span>Entreprise : <span className="text-gray-600 font-medium">{client.entreprise}</span></span>}
                {client.telephone && <span>Tél : <span className="text-gray-600 font-medium">{client.telephone}</span></span>}
                {client.statut && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    {client.statut}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => (
          <div key={i} className={`rounded-xl border ${kpi.border} ${kpi.bg} p-4 flex flex-col min-h-[96px]`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`shrink-0 ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-xs font-medium text-gray-500 leading-tight">{kpi.label}</span>
            </div>
            <p className={`text-sm font-bold ${kpi.color} whitespace-nowrap mt-auto leading-tight`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Factures section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Factures (Notes de débit)
          </h3>
          {notes.length > 0 && (
            <span className="text-xs font-medium text-gray-500">{notes.length} facture(s){notes.filter(n => n.apure_externe).length > 0 && ` · ${notes.filter(n => n.apure_externe).length} apurée(s) ext.`}</span>
          )}
        </div>

        {notesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-400">Chargement des factures...</span>
          </div>
        ) : notesError ? (
          <div className="py-10 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-300" />
            <p className="text-sm text-red-500">Erreur lors du chargement des factures.</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Aucune facture pour ce client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Référence</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date (échéance)</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Volume</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Prix $/CBM</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Montant dû</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Encaissé</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Restant</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Statut</th>
                  {isAdmin && (
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Apurée ext.</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notes.map(n => {
                  const totalNote = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
                  const paye = Number(n.total_paye ?? 0);
                  const restant = Math.max(0, totalNote - paye);
                  const badge = STATUT_FACTURE_BADGE[n.statut_paiement] ?? STATUT_FACTURE_BADGE.impayee;
                  const isApure = n.apure_externe;
                  return (
                    <tr key={n.id} className={`transition-colors hover:bg-blue-50/50 ${isApure ? 'bg-slate-50/60' : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{n.reference}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(n.created_at)}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-gray-600 whitespace-nowrap">{Number(n.volume_total_tana ?? 0).toFixed(3)} m³</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-medium whitespace-nowrap ${isApure ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="inline-flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          {n.prix_cbm_usd != null ? Number(n.prix_cbm_usd).toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{formatMga(totalNote)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-300 line-through' : 'text-green-600'}`}>{formatMga(paye)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-300' : restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatMga(restant)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                          {isApure && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200" title="Apurée dans un autre logiciel">
                              <ExternalLink className="w-3 h-3" />
                              Apurée (ext.)
                            </span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleToggleApure(n.id, isApure, n.reference)}
                            disabled={toggleApure.isPending}
                            className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                              isApure ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-blue-600'
                            } disabled:opacity-50`}
                            title={isApure ? 'Remettre en suivi' : 'Marquer comme apurée dans un autre logiciel'}
                          >
                            {isApure ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            {isApure ? 'Actif' : 'Inactif'}
                          </button>
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

      {/* Encaissements section */}
      <EncaissementsSection
        pseudo={client.pseudo}
        noteDebitIds={noteDebitIds}
        demandeAchatIds={demandeAchatIds}
        detteFournisseurIds={detteFournisseurIds}
      />

      {/* Dettes Fournisseur section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Paiements Fournisseur
          </h3>
          {dettes.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              Total : <span className="text-gray-700 font-semibold">{formatMga(detteTotals.totalDette)}</span>
              {' · '}Reste : <span className="text-orange-600 font-semibold">{formatMga(detteTotals.totalRestantDette)}</span>
            </span>
          )}
        </div>

        {dettesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-400">Chargement des paiements fournisseur...</span>
          </div>
        ) : dettesError ? (
          <div className="py-10 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-300" />
            <p className="text-sm text-red-500">Erreur lors du chargement des paiements fournisseur.</p>
          </div>
        ) : dettes.length === 0 ? (
          <div className="py-10 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Aucun paiement fournisseur pour ce client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Référence</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Montant initial</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Remboursé</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Restant</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dettes.map(d => (
                  <DetteFournisseurRow key={d.id} dette={d} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmation intégré */}
      {pendingToggle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPendingToggle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer le changement</h3>
              </div>
              <button
                onClick={() => setPendingToggle(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-2">
                {pendingToggle.currentValue
                  ? 'Remettre cette note dans le suivi comptable ?'
                  : 'Marquer cette note comme apurée dans un autre logiciel ?'}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Note de débit : <span className="font-semibold text-gray-600">{pendingToggle.reference}</span>
                <br />
                {pendingToggle.currentValue
                  ? 'La note sera de nouveau comptée dans les totaux financiers.'
                  : 'La note restera visible mais ne sera plus comptée dans les totaux financiers.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPendingToggle(null)}
                  className="px-5 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmToggleApure}
                  disabled={toggleApure.isPending}
                  className="px-5 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
