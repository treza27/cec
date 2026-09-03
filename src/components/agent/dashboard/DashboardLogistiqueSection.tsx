import React, { useMemo } from 'react';
import { Ship, Package, Users, BarChart3 } from 'lucide-react';
import { NoteDebit } from '../../../services/noteDebitService';
import { BonLivraison } from '../../../services/bonLivraisonService';
import DashboardKpiCard from './DashboardKpiCard';

interface DepartureRow {
  id: number;
  numBL: string;
  statut: string;
  volumeTotal: number;
  poidsTotal: number;
  nbCartonsTotal: number;
  dateArriveTana: string | null;
  volumeContremesure: number | null;
}

interface ClientVolumeRow {
  pseudo: string;
  volume: number;
  cartons: number;
}

interface Props {
  departures: DepartureRow[];
  clientVolumes: ClientVolumeRow[];
  notesDebit: NoteDebit[];
  bonsLivraison: BonLivraison[];
  inventoryStats: {
    total: number;
    livre: number;
    enCours: number;
    totalVolume: number;
    totalPoids: number;
    totalCartons: number;
  };
}

const DEPARTURE_STATUS_LABELS: Record<string, string> = {
  preparation_depart: 'Preparation',
  conteneur_charge: 'Conteneur charge',
  depart_chine: 'Depart Chine',
  arrivee_toamasina: 'Arrive Toamasina',
  dedouanement_en_cours: 'Dedouanement',
  arrivee_antananarivo: 'Arrive Tana',
  decharge_trie: 'Decharge / Trie',
  archive: 'Archive',
};

const DEPARTURE_STATUS_COLORS: Record<string, string> = {
  preparation_depart: 'bg-gray-100 text-gray-600',
  conteneur_charge: 'bg-blue-100 text-blue-700',
  depart_chine: 'bg-sky-100 text-sky-700',
  arrivee_toamasina: 'bg-cyan-100 text-cyan-700',
  dedouanement_en_cours: 'bg-amber-100 text-amber-700',
  arrivee_antananarivo: 'bg-teal-100 text-teal-700',
  decharge_trie: 'bg-emerald-100 text-emerald-700',
  archive: 'bg-gray-100 text-gray-500',
};

export default function DashboardLogistiqueSection({ departures, clientVolumes, notesDebit, bonsLivraison, inventoryStats }: Props) {
  const activeDepartures = useMemo(() => departures.filter((d) => d.statut !== 'archive'), [departures]);

  const totalVolumeDeparts = useMemo(
    () => activeDepartures.reduce((acc, d) => acc + (d.volumeTotal ?? 0), 0),
    [activeDepartures]
  );

  const totalBonsLivraison = bonsLivraison.length;
  const colisLivres = inventoryStats.livre;
  const tauxLivraison = inventoryStats.total ? Math.round((colisLivres / inventoryStats.total) * 100) : 0;

  const departRevenues = useMemo(() => {
    const map: Record<number, { numBL: string; ca: number; nbNotes: number; volume: number }> = {};
    for (const d of departures) {
      map[d.id] = { numBL: d.numBL, ca: 0, nbNotes: 0, volume: d.volumeTotal ?? 0 };
    }
    for (const n of notesDebit) {
      if (map[n.depart_id]) {
        map[n.depart_id].ca += (n.montant_total_ariary || 0) + (n.frais_livraison_ariary || 0);
        map[n.depart_id].nbNotes += 1;
      }
    }
    return Object.values(map)
      .filter((d) => d.ca > 0)
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 8);
  }, [departures, notesDebit]);

  const maxRevenue = departRevenues[0]?.ca || 1;
  const maxClientVolume = clientVolumes[0]?.volume || 1;

  function formatAriary(v: number) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M Ar`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k Ar`;
    return `${v.toFixed(0)} Ar`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-600" />
          Logistique & Volumes
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Departs actifs"
            value={activeDepartures.length}
            subtitle={`${departures.length} total dont archives`}
            icon={Ship}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <DashboardKpiCard
            title="Volume total (CBM)"
            value={`${totalVolumeDeparts.toFixed(3)} m³`}
            subtitle="Departs actifs"
            icon={BarChart3}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
          />
          <DashboardKpiCard
            title="Colis livres"
            value={`${colisLivres} / ${inventoryStats.total}`}
            subtitle={`Taux de livraison : ${tauxLivraison}%`}
            icon={Package}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <DashboardKpiCard
            title="Bons de livraison"
            value={totalBonsLivraison}
            subtitle="Depuis le debut"
            icon={Users}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA par depart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Chiffre d'affaires par depart
          </h3>
          {departRevenues.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">Aucune note de debit enregistree</p>
          ) : (
            <div className="space-y-3">
              {departRevenues.map((d) => (
                <div key={d.numBL}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">{d.numBL || `Depart #${d.numBL}`}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{d.nbNotes} ND</span>
                      <span className="text-xs font-bold text-gray-900">{formatAriary(d.ca)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(d.ca / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volume par client */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" />
            Top 10 clients par volume (CBM)
          </h3>
          {clientVolumes.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">Aucun colis enregistre</p>
          ) : (
            <div className="space-y-3">
              {clientVolumes.map((c, i) => (
                <div key={c.pseudo}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[110px]">{c.pseudo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{c.cartons} ctn</span>
                      <span className="text-xs font-bold text-gray-900">{c.volume.toFixed(3)} m³</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full"
                      style={{ width: `${(c.volume / maxClientVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tableau departs actifs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-500" />
          Departs en cours
        </h3>
        {activeDepartures.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">Aucun depart actif</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">BL</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="pb-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume m³</th>
                  <th className="pb-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Vol. CM m³</th>
                  <th className="pb-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Poids kg</th>
                  <th className="pb-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Cartons</th>
                  <th className="pb-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeDepartures.slice(0, 10).map((d) => {
                  const ca = notesDebit
                    .filter((n) => n.depart_id === d.id)
                    .reduce((acc, n) => acc + (n.montant_total_ariary || 0) + (n.frais_livraison_ariary || 0), 0);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60">
                      <td className="py-2.5 font-semibold text-gray-800">{d.numBL || `—`}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEPARTURE_STATUS_COLORS[d.statut] || 'bg-gray-100 text-gray-500'}`}>
                          {DEPARTURE_STATUS_LABELS[d.statut] || d.statut}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-gray-600 tabular-nums">{(d.volumeTotal ?? 0).toFixed(3)}</td>
                      <td className="py-2.5 text-center tabular-nums">
                        {d.volumeContremesure !== null ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-600">{d.volumeContremesure.toFixed(3)}</span>
                            {(() => {
                              const diff = d.volumeContremesure - (d.volumeTotal ?? 0);
                              if (Math.abs(diff) < 0.0005) return null;
                              return (
                                <span className={`text-xs font-semibold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                                </span>
                              );
                            })()}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-gray-600 tabular-nums">{(d.poidsTotal ?? 0).toFixed(0)}</td>
                      <td className="py-2.5 text-center text-gray-600 tabular-nums">{d.nbCartonsTotal ?? 0}</td>
                      <td className="py-2.5 text-center text-gray-700 font-semibold tabular-nums">
                        {ca > 0 ? formatAriary(ca) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
