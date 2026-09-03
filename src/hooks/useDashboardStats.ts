import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { NoteDebit } from '../services/noteDebitService';
import { BonLivraison } from '../services/bonLivraisonService';
import { DemandeAchat } from '../types';

export interface DashboardStats {
  notesDebit: NoteDebit[];
  bonsLivraison: BonLivraison[];
  demandes: DemandeAchat[];
  inventoryStats: {
    total: number;
    livre: number;
    enCours: number;
    totalVolume: number;
    totalPoids: number;
    totalCartons: number;
  };
  departures: {
    id: number;
    numBL: string;
    statut: string;
    volumeTotal: number;
    poidsTotal: number;
    nbCartonsTotal: number;
    dateArriveTana: string | null;
    volumeContremesure: number | null;
  }[];
  clientVolumes: { pseudo: string; volume: number; cartons: number }[];
}

async function fetchAllInventoryRows() {
  const pageSize = 1000;
  let allRows: { statut: string; pseudo: string; nb_cartons_tana: number | null; nb_cartons: number; poids_tana: number | null; poids: number; volume_tana: number | null; volume: number; id_depart: number | null; bl: string | null }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('inventaire')
      .select('statut, pseudo, nb_cartons_tana, nb_cartons, poids_tana, poids, volume_tana, volume, id_depart, bl')
      .range(from, from + pageSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data as typeof allRows);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [notesDebitRes, bonsLivraisonRes, demandesRes, inventoryRows, departsRes] = await Promise.all([
    supabase.from('notes_debit').select('*').order('created_at', { ascending: false }),
    supabase.from('bons_livraison').select('*').order('created_at', { ascending: false }),
    supabase.from('demandes_achat').select('*, achat_articles(*), client:clients(id, pseudo, nom, prenom)').order('created_at', { ascending: false }),
    fetchAllInventoryRows(),
    supabase.from('depart').select('id, num_bl, num_tc, statut, volume_total, poids_total, nb_cartons_total, date_arrivee_tana').order('created_at', { ascending: false }),
  ]);

  const notesDebit: NoteDebit[] = (notesDebitRes.data || []).map((row) => ({
    ...row,
    colis_details: row.colis_details || [],
  }));

  const bonsLivraison: BonLivraison[] = (bonsLivraisonRes.data || []).map((row) => ({
    ...row,
    colis_details: row.colis_details || [],
  }));

  const demandes: DemandeAchat[] = (demandesRes.data || []) as DemandeAchat[];
  const inventoryStats = {
    total: inventoryRows.length,
    livre: inventoryRows.filter((r) => r.statut === 'livre').length,
    enCours: inventoryRows.filter((r) => r.statut === 'en_cours_livraison').length,
    totalVolume: inventoryRows.reduce((acc, r) => acc + (Number(r.volume_tana || r.volume) || 0), 0),
    totalPoids: inventoryRows.reduce((acc, r) => acc + (Number(r.poids_tana || r.poids) || 0), 0),
    totalCartons: inventoryRows.reduce((acc, r) => acc + (Number(r.nb_cartons_tana || r.nb_cartons) || 0), 0),
  };

  const cmVolumeByBL: Record<string, { sum: number; hasData: boolean }> = {};
  for (const r of inventoryRows) {
    const key = r.bl || (r.id_depart != null ? String(r.id_depart) : null);
    if (!key) continue;
    if (!cmVolumeByBL[key]) cmVolumeByBL[key] = { sum: 0, hasData: false };
    if (r.volume_tana != null) {
      cmVolumeByBL[key].sum += Number(r.volume_tana);
      cmVolumeByBL[key].hasData = true;
    }
  }

  const departures = (departsRes.data || []).map((d) => {
    const cmEntry = d.num_bl ? cmVolumeByBL[d.num_bl] : undefined;
    return {
      id: d.id,
      numBL: d.num_bl || '',
      statut: d.statut || '',
      volumeTotal: Number(d.volume_total) || 0,
      poidsTotal: Number(d.poids_total) || 0,
      nbCartonsTotal: Number(d.nb_cartons_total) || 0,
      dateArriveTana: d.date_arrivee_tana || null,
      volumeContremesure: cmEntry?.hasData ? cmEntry.sum : null,
    };
  });

  const clientVolumeMap: Record<string, { volume: number; cartons: number }> = {};
  for (const r of inventoryRows) {
    const pseudo = r.pseudo || 'Inconnu';
    if (!clientVolumeMap[pseudo]) clientVolumeMap[pseudo] = { volume: 0, cartons: 0 };
    clientVolumeMap[pseudo].volume += r.volume_tana != null ? Number(r.volume_tana) : 0;
    clientVolumeMap[pseudo].cartons += r.nb_cartons_tana != null ? Number(r.nb_cartons_tana) : 0;
  }
  const clientVolumes = Object.entries(clientVolumeMap)
    .map(([pseudo, vals]) => ({ pseudo, ...vals }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  return { notesDebit, bonsLivraison, demandes, inventoryStats, departures, clientVolumes };
}

export function useDashboardStats() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    stats: data || null,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
