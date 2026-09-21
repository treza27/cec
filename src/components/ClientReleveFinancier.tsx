import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Wallet, TrendingUp, TrendingDown, Loader2, AlertCircle,
  Printer, CheckCircle, Clock, ExternalLink,
} from 'lucide-react';
import { noteDebitService, NoteDebit } from '../services/noteDebitService';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { supabase } from '../utils/supabase';
import NoteDebitDocumentModal from './agent/livraison/NoteDebitDocumentModal';

interface ClientReleveFinancierProps {
  pseudo: string;
}

interface EncaissementRow {
  id: number;
  date_mouvement: string;
  description: string | null;
  mode_paiement: string | null;
  montant_mga: number;
  note_debit_id: number | null;
  reference: string | null;
  type_mouvement: string | null;
}

function formatMga(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUT_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  payee: { label: 'Payée', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  partielle: { label: 'Partielle', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  impayee: { label: 'Impayée', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
  apuree: { label: 'Apurée', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <ExternalLink className="w-3 h-3" /> },
};

const MODE_PAIEMENT_LABEL: Record<string, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mvola: 'MVola',
  orange_money: 'Orange Money',
};

export default function ClientReleveFinancier({ pseudo }: ClientReleveFinancierProps) {
  const [notes, setNotes] = useState<NoteDebit[]>([]);
  const [encaissements, setEncaissements] = useState<EncaissementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteDebit | null>(null);
  const { settings } = useCompanySettings();

  useEffect(() => {
    if (!pseudo) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [notesData, encResult] = await Promise.all([
          noteDebitService.getByPseudo(pseudo),
          supabase.rpc('get_client_encaissements', { p_pseudo: pseudo }),
        ]);

        if (!mounted) return;
        setNotes(notesData);
        setEncaissements((encResult.data as EncaissementRow[]) ?? []);
        if (encResult.error) throw encResult.error;
      } catch {
        if (mounted) setError('Impossible de charger votre relevé financier. Veuillez réessayer plus tard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pseudo]);

  const totals = useMemo(() => {
    let totalFacture = 0;
    let totalPaye = 0;
    let totalRestant = 0;
    let totalVolume = 0;

    for (const n of notes) {
      totalVolume += Number(n.volume_total_tana ?? 0);
      if (n.apure_externe) continue;
      const totalNote = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
      const paye = Number(n.total_paye ?? 0);
      totalFacture += totalNote;
      totalPaye += paye;
      totalRestant += Math.max(0, totalNote - paye);
    }

    return { totalFacture, totalPaye, totalRestant, totalVolume };
  }, [notes]);

  const totalEncaissements = useMemo(
    () => encaissements.reduce((sum, e) => sum + Number(e.montant_mga), 0),
    [encaissements]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">Chargement de votre relevé financier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-red-600 font-medium text-sm">Erreur lors du chargement</p>
        <p className="text-gray-500 text-xs">{error}</p>
      </div>
    );
  }

  if (notes.length === 0 && encaissements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-semibold text-base">Aucun relevé disponible</p>
          <p className="text-gray-500 text-sm mt-1">
            Vos factures et paiements apparaîtront ici une fois disponibles.
          </p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total facturé',
      value: formatMga(totals.totalFacture),
      icon: <FileText className="w-4 h-4" />,
      color: 'text-gray-800',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Total encaissé',
      value: formatMga(totals.totalPaye),
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'Reste à payer',
      value: formatMga(totals.totalRestant),
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpiCards.map((kpi, i) => (
          <div key={i} className={`rounded-xl border ${kpi.border} ${kpi.bg} p-4 flex flex-col min-h-[92px]`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`shrink-0 ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-xs font-medium text-gray-500 leading-tight">{kpi.label}</span>
            </div>
            <p className={`text-sm font-bold ${kpi.color} whitespace-nowrap mt-auto leading-tight`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Factures section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Mes factures
          </h3>
          {notes.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              {notes.length} facture(s){notes.filter(n => n.apure_externe).length > 0 && ` · ${notes.filter(n => n.apure_externe).length} apurée(s)`}
            </span>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Aucune facture pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Référence</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Volume</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Montant dû</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Payé</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Restant</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Statut</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notes.map((n) => {
                  const isApure = !!n.apure_externe;
                  const totalNote = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
                  const paye = Number(n.total_paye ?? 0);
                  const restant = Math.max(0, totalNote - paye);
                  const statut = isApure ? 'apuree' : ((n.statut_paiement ?? 'impayee') as string);
                  const badge = STATUT_BADGE[statut] ?? STATUT_BADGE.impayee;
                  return (
                    <tr key={n.id} className={`transition-colors hover:bg-blue-50/40 ${isApure ? 'bg-slate-50/60' : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{n.reference}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(n.created_at)}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-gray-600 whitespace-nowrap">
                        {Number(n.volume_total_tana ?? 0).toFixed(3)} m³
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{formatMga(totalNote)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-300 line-through' : 'text-green-600'}`}>{formatMga(paye)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold whitespace-nowrap ${isApure ? 'text-gray-300' : restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {formatMga(restant)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => setViewingNote(n)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Encaissements section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            Mes paiements
          </h3>
          {encaissements.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              Total : <span className="text-green-600 font-semibold">{formatMga(totalEncaissements)}</span>
            </span>
          )}
        </div>

        {encaissements.length === 0 ? (
          <div className="py-10 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun paiement enregistré pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Description</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Référence</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Mode</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {encaissements.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-green-50/30">
                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(e.date_mouvement)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{e.description || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{e.reference ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">
                      {e.mode_paiement ? MODE_PAIEMENT_LABEL[e.mode_paiement] ?? e.mode_paiement : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-semibold text-green-600 whitespace-nowrap">
                      +{formatMga(Number(e.montant_mga))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note de débit document viewer */}
      {viewingNote && settings && (
        <NoteDebitDocumentModal
          noteDebit={viewingNote}
          settings={settings}
          onClose={() => setViewingNote(null)}
        />
      )}
    </div>
  );
}