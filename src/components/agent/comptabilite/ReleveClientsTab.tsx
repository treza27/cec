import React, { useMemo, useState } from 'react';
import { Search, Users, FileText, TrendingUp, Package, ChevronRight } from 'lucide-react';
import { useNotesDebitAll, useClientsBasic } from '../../../hooks/useComptabilite';
import type { NoteDebitNonPayee, ClientBasic } from '../../../services/comptabiliteService';
import ClientReleveDetail from './ClientReleveDetail';

function formatMga(n: number) {
  return n.toLocaleString('fr-MG') + ' Ar';
}

interface ClientReleve {
  clientId: number;
  pseudo: string;
  nomComplet: string;
  entreprise?: string;
  telephone?: string;
  statut?: string;
  nbFactures: number;
  nbApureExterne: number;
  totalFacture: number;
  encaisse: number;
  restant: number;
  volume: number;
}

export default function ReleveClientsTab() {
  const { data: notes = [], isLoading: notesLoading } = useNotesDebitAll();
  const { data: clients = [], isLoading: clientsLoading } = useClientsBasic();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientReleve | null>(null);

  const clientsByPseudo = useMemo(() => {
    const map = new Map<string, ClientBasic>();
    for (const c of clients) {
      if (c.pseudo) map.set(c.pseudo, c);
    }
    return map;
  }, [clients]);

  const releves: ClientReleve[] = useMemo(() => {
    const byClient = new Map<number, ClientReleve>();

    for (const note of notes as NoteDebitNonPayee[]) {
      const pseudo = note.client_pseudo ?? '';
      const client = clientsByPseudo.get(pseudo);
      const clientId = client?.id ?? 0;
      const key = clientId || -pseudo.length;

      const totalNote = Number(note.montant_total_ariary) + Number(note.frais_livraison_ariary ?? 0);
      const paye = Number(note.total_paye ?? 0);

      if (!byClient.has(key)) {
        byClient.set(key, {
          clientId,
          pseudo,
          nomComplet: client ? `${client.nom ?? ''} ${client.prenom}`.trim() : (note.client_nom ?? pseudo),
          entreprise: client?.entreprise ?? undefined,
          telephone: client?.telephone ?? undefined,
          statut: client?.statut_contact ?? undefined,
          nbFactures: 0,
          nbApureExterne: 0,
          totalFacture: 0,
          encaisse: 0,
          restant: 0,
          volume: 0,
        });
      }

      const r = byClient.get(key)!;
      r.nbFactures += 1;
      r.volume += Number(note.volume_total_tana ?? 0);
      if (note.apure_externe) {
        r.nbApureExterne += 1;
      } else {
        r.totalFacture += totalNote;
        r.encaisse += paye;
        r.restant += Math.max(0, totalNote - paye);
      }
    }

    return Array.from(byClient.values()).sort((a, b) => b.totalFacture - a.totalFacture);
  }, [notes, clientsByPseudo]);

  const filtered = useMemo(() => {
    if (!search.trim()) return releves;
    const q = search.toLowerCase();
    return releves.filter(r =>
      r.pseudo.toLowerCase().includes(q) ||
      r.nomComplet.toLowerCase().includes(q) ||
      (r.entreprise ?? '').toLowerCase().includes(q)
    );
  }, [releves, search]);

  const totals = useMemo(() => ({
    nbFactures: filtered.reduce((s, r) => s + r.nbFactures, 0),
    totalFacture: filtered.reduce((s, r) => s + r.totalFacture, 0),
    encaisse: filtered.reduce((s, r) => s + r.encaisse, 0),
    restant: filtered.reduce((s, r) => s + r.restant, 0),
    volume: filtered.reduce((s, r) => s + r.volume, 0),
  }), [filtered]);

  const loading = notesLoading || clientsLoading;

  if (selectedClient) {
    return (
      <ClientReleveDetail
        client={{
          clientId: selectedClient.clientId,
          pseudo: selectedClient.pseudo,
          nomComplet: selectedClient.nomComplet,
          entreprise: selectedClient.entreprise,
          telephone: selectedClient.telephone,
          statut: selectedClient.statut,
        }}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client par nom, pseudo ou entreprise..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Chargement du relevé...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-sm font-medium">Aucun client trouvé</p>
            <p className="text-xs mt-1">
              {search.trim() ? 'Essayez une autre recherche.' : 'Aucune note de débit n\'a encore été créée.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Client</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Factures</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Total facturé</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Encaissé</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Restant</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    <span className="inline-flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Volume</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r, i) => (
                  <tr
                    key={`${r.clientId}-${r.pseudo}`}
                    onClick={() => setSelectedClient(r)}
                    className={`transition-colors hover:bg-blue-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{r.nomComplet}</span>
                          <span className="text-xs text-gray-400">
                            {r.pseudo}{r.entreprise ? ` · ${r.entreprise}` : ''}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {r.nbFactures}
                      </span>
                      {r.nbApureExterne > 0 && (
                        <span className="ml-1 text-[10px] text-gray-400" title="Notes apurées dans un autre logiciel">
                          ({r.nbApureExterne} ext.)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatMga(r.totalFacture)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 whitespace-nowrap">
                      {formatMga(r.encaisse)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${r.restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {formatMga(r.restant)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap">
                      {r.volume.toFixed(3)} m³
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    Total{search.trim() ? ` (${filtered.length} client${filtered.length > 1 ? 's' : ''})` : ''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {totals.nbFactures}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">{formatMga(totals.totalFacture)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-600 whitespace-nowrap">{formatMga(totals.encaisse)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-orange-600 whitespace-nowrap">{formatMga(totals.restant)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {totals.volume.toFixed(3)} m³</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
