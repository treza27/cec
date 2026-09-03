import React, { useState, useEffect } from 'react';
import { FileText, Truck, Printer, AlertCircle, Loader2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { noteDebitService, NoteDebit } from '../services/noteDebitService';
import { bonLivraisonService, BonLivraison } from '../services/bonLivraisonService';
import { useCompanySettings } from '../hooks/useCompanySettings';
import NoteDebitDocumentModal from './agent/livraison/NoteDebitDocumentModal';
import BonLivraisonDocumentModal from './agent/livraison/BonLivraisonDocumentModal';
import { supabase } from '../utils/supabase';
import { getDepartureStatusLabel, getDepartureStatusColor } from '../utils/statusHelpers';
import type { DepartureStatus } from '../types';

interface ClientDocumentsListProps {
  pseudo: string;
}

interface DepartureGroup {
  departId: number;
  statut: DepartureStatus | null;
  notesDebit: NoteDebit[];
  bonsLivraison: BonLivraison[];
  dateRecente: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildGroups(
  notesDebit: NoteDebit[],
  bonsLivraison: BonLivraison[],
  departStatuts: Record<number, DepartureStatus | null>
): DepartureGroup[] {
  const map = new Map<number, DepartureGroup>();

  for (const nd of notesDebit) {
    if (!map.has(nd.depart_id)) {
      map.set(nd.depart_id, {
        departId: nd.depart_id,
        statut: departStatuts[nd.depart_id] ?? null,
        notesDebit: [],
        bonsLivraison: [],
        dateRecente: nd.created_at,
      });
    }
    const g = map.get(nd.depart_id)!;
    g.notesDebit.push(nd);
    if (nd.created_at > g.dateRecente) g.dateRecente = nd.created_at;
  }

  for (const bl of bonsLivraison) {
    if (!map.has(bl.depart_id)) {
      map.set(bl.depart_id, {
        departId: bl.depart_id,
        statut: departStatuts[bl.depart_id] ?? null,
        notesDebit: [],
        bonsLivraison: [],
        dateRecente: bl.created_at,
      });
    }
    const g = map.get(bl.depart_id)!;
    g.bonsLivraison.push(bl);
    if (bl.created_at > g.dateRecente) g.dateRecente = bl.created_at;
  }

  return Array.from(map.values()).sort((a, b) =>
    b.dateRecente.localeCompare(a.dateRecente)
  );
}

function DepartureGroupCard({
  group,
  onViewNoteDebit,
  onViewBonLivraison,
}: {
  group: DepartureGroup;
  onViewNoteDebit: (nd: NoteDebit) => void;
  onViewBonLivraison: (bl: BonLivraison) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalDocs = group.notesDebit.length + group.bonsLivraison.length;
  const statusLabel = group.statut ? getDepartureStatusLabel(group.statut) : null;
  const statusColor = group.statut ? getDepartureStatusColor(group.statut) : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="text-base font-bold text-gray-900">Départ #{group.departId}</span>
            {statusLabel && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">{formatDate(group.dateRecente)}</p>
            <p className="text-xs text-gray-500">{totalDocs} document{totalDocs !== 1 ? 's' : ''}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {group.notesDebit.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50/60 border-b border-blue-100/80">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Notes de Débit
                </span>
                <span className="ml-auto text-xs text-blue-500">{group.notesDebit.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {group.notesDebit.map((nd) => (
                  <div
                    key={nd.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-blue-700">{nd.reference}</span>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{formatDate(nd.created_at)}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {(nd.montant_total_ariary + (nd.frais_livraison_ariary || 0)).toLocaleString('fr-FR')} Ar
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewNoteDebit(nd)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.bonsLivraison.length > 0 && (
            <div className={group.notesDebit.length > 0 ? 'border-t border-gray-100' : ''}>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50/60 border-b border-green-100/80">
                <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                  <Truck className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Bons de Livraison
                </span>
                <span className="ml-auto text-xs text-green-500">{group.bonsLivraison.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {group.bonsLivraison.map((bl) => (
                  <div
                    key={bl.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-green-700">{bl.reference}</span>
                        {bl.is_partial && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                            Partiel
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{formatDate(bl.created_at)}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {Number(bl.volume_total_livre).toFixed(3)} m³
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewBonLivraison(bl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientDocumentsList({ pseudo }: ClientDocumentsListProps) {
  const [groups, setGroups] = useState<DepartureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingNoteDebit, setViewingNoteDebit] = useState<NoteDebit | null>(null);
  const [viewingBonLivraison, setViewingBonLivraison] = useState<BonLivraison | null>(null);
  const { settings } = useCompanySettings();

  useEffect(() => {
    if (!pseudo) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [nd, bl] = await Promise.all([
          noteDebitService.getByPseudo(pseudo),
          bonLivraisonService.getByPseudo(pseudo),
        ]);

        const departIds = Array.from(
          new Set([...nd.map((d) => d.depart_id), ...bl.map((d) => d.depart_id)])
        );

        let departStatuts: Record<number, DepartureStatus | null> = {};
        if (departIds.length > 0) {
          const { data } = await supabase
            .from('depart')
            .select('id, statut')
            .in('id', departIds);
          if (data) {
            for (const row of data) {
              departStatuts[row.id] = (row.statut as DepartureStatus) ?? null;
            }
          }
        }

        setGroups(buildGroups(nd, bl, departStatuts));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pseudo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">Chargement de vos documents...</p>
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

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-semibold text-base">Aucun document disponible</p>
          <p className="text-gray-500 text-sm mt-1">
            Vos notes de débit et bons de livraison apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <DepartureGroupCard
          key={group.departId}
          group={group}
          onViewNoteDebit={setViewingNoteDebit}
          onViewBonLivraison={setViewingBonLivraison}
        />
      ))}

      {viewingNoteDebit && (
        <NoteDebitDocumentModal
          noteDebit={viewingNoteDebit}
          settings={settings}
          onClose={() => setViewingNoteDebit(null)}
        />
      )}
      {viewingBonLivraison && (
        <BonLivraisonDocumentModal
          bonLivraison={viewingBonLivraison}
          settings={settings}
          onClose={() => setViewingBonLivraison(null)}
        />
      )}
    </div>
  );
}
