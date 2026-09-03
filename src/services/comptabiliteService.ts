import { supabase } from '../utils/supabase';

// ==========================================
// Types
// ==========================================

export type TypeCaisse = 'especes' | 'mvola' | 'orange_money';

export interface Caisse {
  id: number;
  nom: string;
  description: string;
  type_caisse: TypeCaisse;
  solde_initial_mga: number;
  date_solde_initial: string;
  responsable_id: string | null;
  est_active: boolean;
  created_at: string;
  updated_at: string;
  responsable?: { full_name: string | null; email: string | null };
}

export interface CompteBancaire {
  id: number;
  nom: string;
  banque: string;
  numero_compte: string;
  devise: 'MGA' | 'USD' | 'EUR' | 'RMB';
  solde_initial: number;
  date_solde_initial: string;
  est_actif: boolean;
  responsable_id: string | null;
  created_at: string;
  updated_at: string;
  responsable?: { full_name: string | null; email: string | null } | null;
}

export type TypeMouvementCaisse =
  | 'entree_client'
  | 'achat_rmb'
  | 'paiement_note_debit'
  | 'frais_annexe'
  | 'loyer'
  | 'achat_materiel'
  | 'salaire'
  | 'avance_salaire'
  | 'transfert_interne'
  | 'remboursement_dette_fournisseur'
  | 'autre_entree'
  | 'autre_sortie';

export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'mvola' | 'orange_money';

export interface SoldeDetail {
  total: number;
  especes: number;
  cheques: number;
  mvola: number;
  orange_money: number;
}

export interface MouvementCaisse {
  id: number;
  caisse_id: number;
  type_mouvement: TypeMouvementCaisse;
  sens: 'entree' | 'sortie';
  montant_mga: number;
  montant_rmb: number | null;
  taux_rmb_mga: number | null;
  mode_paiement: ModePaiement | null;
  description: string;
  reference_externe: string | null;
  note_debit_id: number | null;
  demande_achat_id: number | null;
  employe_beneficiaire_id: string | null;
  compte_bancaire_id: number | null;
  caisse_destination_id: number | null;
  mode_paiement_destination: ModePaiement | null;
  tiers_nom: string | null;
  dette_fournisseur_id: number | null;
  saisie_par_id: string;
  date_mouvement: string;
  est_annule: boolean;
  annule_par_id: string | null;
  annule_at: string | null;
  motif_annulation: string | null;
  created_at: string;
  updated_at: string;
  saisie_par?: { full_name: string | null };
  employe_beneficiaire?: { full_name: string | null };
  note_debit?: { reference: string; client_pseudo: string | null };
  compte_bancaire?: { nom: string; devise: string };
  caisse_destination?: { id: number; nom: string; type_caisse: string } | null;
  demande_achat?: { id: number; nom_article: string; date_creation: string; client: { pseudo: string | null; nom: string | null; prenom: string | null } | null } | null;
  dette_fournisseur?: { reference: string; client_id: number } | null;
}

export interface MouvementCaisseCreateData {
  caisse_id: number;
  type_mouvement: TypeMouvementCaisse;
  sens: 'entree' | 'sortie';
  montant_mga: number;
  montant_rmb?: number | null;
  taux_rmb_mga?: number | null;
  mode_paiement?: ModePaiement | null;
  description: string;
  note_debit_id?: number | null;
  demande_achat_id?: number | null;
  employe_beneficiaire_id?: string | null;
  compte_bancaire_id?: number | null;
  caisse_destination_id?: number | null;
  mode_paiement_destination?: ModePaiement | null;
  tiers_nom?: string | null;
  date_mouvement?: string;
  dette_fournisseur_id?: number | null;
}

export type TypeMouvementBancaire =
  | 'versement_caisse'
  | 'virement_entrant'
  | 'virement_sortant'
  | 'frais_bancaires'
  | 'interets'
  | 'autre_entree'
  | 'autre_sortie'
  | 'approvisionnement';

export type ModePaiementBancaire =
  | 'depot_especes'
  | 'depot_cheque'
  | 'virement_recu'
  | 'virement_emis'
  | 'cheque_emis'
  | 'prelevement'
  | 'autre';

export interface MouvementBancaire {
  id: number;
  compte_bancaire_id: number;
  type_mouvement: TypeMouvementBancaire;
  sens: 'entree' | 'sortie';
  montant: number;
  description: string;
  reference_externe: string | null;
  mode_paiement: ModePaiementBancaire | null;
  mouvement_caisse_id: number | null;
  taux_change: number | null;
  mouvement_bancaire_lie_id: number | null;
  saisie_par_id: string;
  date_mouvement: string;
  est_annule: boolean;
  annule_par_id: string | null;
  annule_at: string | null;
  motif_annulation: string | null;
  created_at: string;
  updated_at: string;
  saisie_par?: { full_name: string | null };
  compte_bancaire?: { nom: string; devise: string; banque: string };
}

export interface MouvementBancaireCreateData {
  compte_bancaire_id: number;
  type_mouvement: TypeMouvementBancaire;
  sens: 'entree' | 'sortie';
  montant: number;
  description: string;
  reference_externe?: string | null;
  mode_paiement?: ModePaiementBancaire | null;
  mouvement_caisse_id?: number | null;
  taux_change?: number | null;
  mouvement_bancaire_lie_id?: number | null;
  date_mouvement?: string;
}

export interface ApprovisionnementCreateData {
  compte_source_id: number;
  compte_destination_id: number;
  montant_source: number;
  montant_destination: number;
  taux_change: number;
  description?: string;
  date_mouvement?: string;
}

export interface AvanceSalaire {
  id: number;
  employe_id: string;
  montant_mga: number;
  date_avance: string;
  statut: 'en_attente' | 'rembourse';
  date_remboursement: string | null;
  mouvement_caisse_id: number | null;
  saisie_par_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employe?: { full_name: string | null; email: string | null };
}

export interface AvanceSalaireCreateData {
  employe_id: string;
  montant_mga: number;
  date_avance?: string;
  notes?: string;
  mouvement_caisse_id?: number;
}

export interface RapportMensuel {
  annee: number;
  mois: number;
  caisse_id: number;
  solde_debut: number;
  solde_fin: number;
  total_entrees: number;
  total_sorties: number;
  par_type: Record<string, number>;
}

// ==========================================
// Caisse Service
// ==========================================

export const caisseService = {
  async getAll(): Promise<Caisse[]> {
    const { data, error } = await supabase
      .from('caisses')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_active', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getMine(): Promise<Caisse[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('caisses')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_active', true)
      .eq('responsable_id', user.id)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getActives(): Promise<Caisse[]> {
    const { data, error } = await supabase
      .from('caisses')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_active', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: { nom: string; description?: string; type_caisse?: TypeCaisse; responsable_id?: string | null; solde_initial_mga?: number; date_solde_initial?: string }): Promise<Caisse> {
    const { data, error } = await supabase
      .from('caisses')
      .insert(payload)
      .select('*, responsable:responsable_id(full_name, email)')
      .single();
    if (error) throw error;
    return data;
  },

  async setResponsable(caisseId: number, responsableId: string | null): Promise<Caisse> {
    const { data, error } = await supabase
      .from('caisses')
      .update({ responsable_id: responsableId })
      .eq('id', caisseId)
      .select('*, responsable:responsable_id(full_name, email)')
      .single();
    if (error) throw error;
    return data;
  },

  async getArchived(): Promise<Caisse[]> {
    const { data, error } = await supabase
      .from('caisses')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_active', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async archive(id: number): Promise<void> {
    const { error } = await supabase
      .from('caisses')
      .update({ est_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async restore(id: number): Promise<void> {
    const { error } = await supabase
      .from('caisses')
      .update({ est_active: true })
      .eq('id', id);
    if (error) throw error;
  },

  async getSolde(caisseId: number): Promise<SoldeDetail> {
    const caisse = await caisseService.getAll().then(list => list.find(c => c.id === caisseId));
    if (!caisse) return { total: 0, especes: 0, cheques: 0 };
    const { data, error } = await supabase
      .from('mouvements_caisse')
      .select('sens, montant_mga, mode_paiement')
      .eq('caisse_id', caisseId)
      .eq('est_annule', false);
    if (error) throw error;
    const mouvements = data ?? [];
    const soldeInitial = Number(caisse.solde_initial_mga);

    const netByMode = (mode: string) => {
      const e = mouvements.filter(m => m.sens === 'entree' && m.mode_paiement === mode).reduce((s, m) => s + Number(m.montant_mga), 0);
      const s = mouvements.filter(m => m.sens === 'sortie' && m.mode_paiement === mode).reduce((s, m) => s + Number(m.montant_mga), 0);
      return e - s;
    };

    const cheques = netByMode('cheque');
    const especes = soldeInitial + netByMode('especes');
    const mvola = netByMode('mvola');
    const orange_money = netByMode('orange_money');
    return { total: especes + cheques + mvola + orange_money, especes, cheques, mvola, orange_money };
  },
};

// ==========================================
// Compte Bancaire Service
// ==========================================

const COMPTE_BANCAIRE_SELECT = '*, responsable:responsable_id(full_name, email)';

export const compteBancaireService = {
  async getAll(): Promise<CompteBancaire[]> {
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .select(COMPTE_BANCAIRE_SELECT)
      .eq('est_actif', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getActifs(): Promise<CompteBancaire[]> {
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .select(COMPTE_BANCAIRE_SELECT)
      .eq('est_actif', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getMesComptes(): Promise<CompteBancaire[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .select(COMPTE_BANCAIRE_SELECT)
      .eq('responsable_id', user.id)
      .eq('est_actif', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: { nom: string; banque: string; numero_compte?: string; devise: 'MGA' | 'USD' | 'EUR' | 'RMB'; solde_initial?: number; date_solde_initial?: string }): Promise<CompteBancaire> {
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .insert(payload)
      .select(COMPTE_BANCAIRE_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async setResponsable(compteId: number, responsableId: string | null): Promise<CompteBancaire> {
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .update({ responsable_id: responsableId })
      .eq('id', compteId)
      .select(COMPTE_BANCAIRE_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async getArchived(): Promise<CompteBancaire[]> {
    const { data, error } = await supabase
      .from('comptes_bancaires')
      .select(COMPTE_BANCAIRE_SELECT)
      .eq('est_actif', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async archive(id: number): Promise<void> {
    const { error } = await supabase
      .from('comptes_bancaires')
      .update({ est_actif: false })
      .eq('id', id);
    if (error) throw error;
  },

  async restore(id: number): Promise<void> {
    const { error } = await supabase
      .from('comptes_bancaires')
      .update({ est_actif: true })
      .eq('id', id);
    if (error) throw error;
  },

  async getSolde(compteId: number): Promise<number> {
    const compte = await compteBancaireService.getAll().then(list => list.find(c => c.id === compteId));
    if (!compte) return 0;
    const { data, error } = await supabase
      .from('mouvements_bancaires')
      .select('sens, montant')
      .eq('compte_bancaire_id', compteId)
      .eq('est_annule', false);
    if (error) throw error;
    const mouvements = data ?? [];
    const totalEntrees = mouvements.filter(m => m.sens === 'entree').reduce((s, m) => s + Number(m.montant), 0);
    const totalSorties = mouvements.filter(m => m.sens === 'sortie').reduce((s, m) => s + Number(m.montant), 0);
    return Number(compte.solde_initial) + totalEntrees - totalSorties;
  },
};

// ==========================================
// Mouvement Caisse Service
// ==========================================

export const mouvementCaisseService = {
  async getAll(filters?: { caisse_id?: number; date_from?: string; date_to?: string; type_mouvement?: string }): Promise<MouvementCaisse[]> {
    let query = supabase
      .from('mouvements_caisse')
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        employe_beneficiaire:employe_beneficiaire_id(full_name),
        note_debit:note_debit_id(reference, client_pseudo),
        compte_bancaire:compte_bancaire_id(nom, devise),
        caisse_destination:caisse_destination_id(id, nom, type_caisse),
        demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom))
      `)
      .order('date_mouvement', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.caisse_id) query = query.eq('caisse_id', filters.caisse_id);
    if (filters?.date_from) query = query.gte('date_mouvement', filters.date_from);
    if (filters?.date_to) query = query.lte('date_mouvement', filters.date_to);
    if (filters?.type_mouvement) query = query.eq('type_mouvement', filters.type_mouvement);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: MouvementCaisseCreateData): Promise<MouvementCaisse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data, error } = await supabase
      .from('mouvements_caisse')
      .insert({ ...payload, saisie_par_id: user.id })
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        employe_beneficiaire:employe_beneficiaire_id(full_name),
        note_debit:note_debit_id(reference, client_pseudo),
        compte_bancaire:compte_bancaire_id(nom, devise),
        caisse_destination:caisse_destination_id(id, nom, type_caisse),
        demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom)),
        dette_fournisseur:dette_fournisseur_id(reference, client_id)
      `)
      .single();
    if (error) throw error;

    // Mettre à jour la dette fournisseur si c'est un remboursement
    if (payload.dette_fournisseur_id && payload.type_mouvement === 'remboursement_dette_fournisseur') {
      const { error: errRecalc } = await supabase
        .rpc('recalc_dette_fournisseur_remboursement', { dette_id: payload.dette_fournisseur_id });
      if (errRecalc) {
        throw new Error('Le mouvement de caisse a été créé mais la mise à jour de la dette a échoué. Veuillez contacter un administrateur.');
      }
    }

    return data;
  },

  async update(id: number, payload: {
    description?: string;
    date_mouvement?: string;
    montant_mga?: number;
    mode_paiement?: ModePaiement | null;
    tiers_nom?: string | null;
    reference_externe?: string | null;
  }): Promise<MouvementCaisse> {
    // Fetch original movement to know what linked records to cascade to
    const { data: original } = await supabase
      .from('mouvements_caisse')
      .select('type_mouvement, caisse_id, caisse_destination_id, compte_bancaire_id, note_debit_id, dette_fournisseur_id, montant_mga, date_mouvement, description')
      .eq('id', id)
      .maybeSingle();

    const { data, error } = await supabase
      .from('mouvements_caisse')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        employe_beneficiaire:employe_beneficiaire_id(full_name),
        note_debit:note_debit_id(reference, client_pseudo),
        compte_bancaire:compte_bancaire_id(nom, devise),
        caisse_destination:caisse_destination_id(id, nom, type_caisse),
        demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom)),
        dette_fournisseur:dette_fournisseur_id(reference, client_id)
      `)
      .single();
    if (error) throw error;

    if (!original) return data;

    const cascadeUpdates: Promise<void>[] = [];

    // 1. Linked bank movement (transfert_interne to bank, or virement)
    const banqueUpdate: Record<string, unknown> = {};
    if (payload.montant_mga !== undefined) banqueUpdate.montant = payload.montant_mga;
    if (payload.date_mouvement !== undefined) banqueUpdate.date_mouvement = payload.date_mouvement;
    if (payload.description !== undefined) banqueUpdate.description = payload.description;
    if (Object.keys(banqueUpdate).length > 0) {
      cascadeUpdates.push(
        supabase.from('mouvements_bancaires')
          .update(banqueUpdate)
          .eq('mouvement_caisse_id', id)
          .eq('est_annule', false)
          .then(({ error: e }) => { if (e) throw e; })
      );
    }

    // 2. Linked cheque (entrée by cheque)
    if (payload.montant_mga !== undefined || payload.date_mouvement !== undefined) {
      const chequeUpdate: Record<string, unknown> = {};
      if (payload.montant_mga !== undefined) chequeUpdate.montant_mga = payload.montant_mga;
      if (payload.date_mouvement !== undefined) chequeUpdate.date_reception = payload.date_mouvement;
      if (payload.description !== undefined) chequeUpdate.description = payload.description;
      cascadeUpdates.push(
        supabase.from('cheques')
          .update(chequeUpdate)
          .eq('mouvement_caisse_id', id)
          .then(({ error: e }) => { if (e) throw e; })
      );
    }

    // 3. Linked avance salaire
    if (payload.montant_mga !== undefined || payload.date_mouvement !== undefined) {
      const avanceUpdate: Record<string, unknown> = {};
      if (payload.montant_mga !== undefined) avanceUpdate.montant_mga = payload.montant_mga;
      if (payload.date_mouvement !== undefined) avanceUpdate.date_avance = payload.date_mouvement;
      cascadeUpdates.push(
        supabase.from('avances_salaires')
          .update(avanceUpdate)
          .eq('mouvement_caisse_id', id)
          .then(({ error: e }) => { if (e) throw e; })
      );
    }

    // 4. Linked Alipay movement (date and description only; RMB amount/taux not editable from caisse form)
    if (payload.date_mouvement !== undefined || payload.description !== undefined) {
      const alipayUpdate: Record<string, unknown> = {};
      if (payload.date_mouvement !== undefined) alipayUpdate.date_mouvement = payload.date_mouvement;
      if (payload.description !== undefined) alipayUpdate.description = payload.description;
      cascadeUpdates.push(
        supabase.from('mouvements_alipay')
          .update(alipayUpdate)
          .eq('caisse_mouvement_id', id)
          .eq('est_annule', false)
          .then(({ error: e }) => { if (e) throw e; })
      );
    }

    // 5. Recalculate note de débit statut if montant changed
    if (payload.montant_mga !== undefined && original.note_debit_id) {
      cascadeUpdates.push(
        (async () => {
          const { data: note } = await supabase
            .from('notes_debit')
            .select('montant_total_ariary, frais_livraison_ariary')
            .eq('id', original.note_debit_id)
            .maybeSingle();
          if (!note) return;
          const { data: mouvements } = await supabase
            .from('mouvements_caisse')
            .select('montant_mga')
            .eq('note_debit_id', original.note_debit_id)
            .eq('est_annule', false);
          const totalPaye = (mouvements ?? []).reduce((s, m) => s + Number(m.montant_mga), 0);
          const montantNote = Number(note.montant_total_ariary) + Number(note.frais_livraison_ariary ?? 0);
          const nouveauStatut = totalPaye >= montantNote ? 'payee' : 'partielle';
          await supabase.from('notes_debit')
            .update({ statut_paiement: nouveauStatut, total_paye: totalPaye })
            .eq('id', original.note_debit_id);
        })()
      );
    }

    // 6. Recalculate dette fournisseur statut if montant changed
    if (payload.montant_mga !== undefined && original.dette_fournisseur_id) {
      cascadeUpdates.push(
        supabase.rpc('recalc_dette_fournisseur_remboursement', { dette_id: original.dette_fournisseur_id })
          .then(({ error: e }) => { if (e) throw e; })
      );
    }

    // 7. Paired caisse entree movement for cross-caisse transfert_interne
    if (original.type_mouvement === 'transfert_interne' && original.caisse_destination_id) {
      const pairedUpdate: Record<string, unknown> = {};
      if (payload.montant_mga !== undefined) pairedUpdate.montant_mga = payload.montant_mga;
      if (payload.date_mouvement !== undefined) pairedUpdate.date_mouvement = payload.date_mouvement;
      if (payload.description !== undefined) pairedUpdate.description = payload.description;
      if (Object.keys(pairedUpdate).length > 0) {
        cascadeUpdates.push(
          supabase.from('mouvements_caisse')
            .update(pairedUpdate)
            .eq('type_mouvement', 'transfert_interne')
            .eq('sens', 'entree')
            .eq('caisse_id', original.caisse_destination_id)
            .eq('caisse_destination_id', original.caisse_id)
            .eq('montant_mga', original.montant_mga)
            .eq('date_mouvement', original.date_mouvement)
            .eq('est_annule', false)
            .then(({ error: e }) => { if (e) throw e; })
        );
      }
    }

    await Promise.all(cascadeUpdates);

    return data;
  },

  async annuler(id: number, motif: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const now = new Date().toISOString();
    const annulationFields = { est_annule: true, annule_par_id: user.id, annule_at: now, motif_annulation: motif };

    const { data: mouvement } = await supabase
      .from('mouvements_caisse')
      .select('type_mouvement, dette_fournisseur_id')
      .eq('id', id)
      .maybeSingle();

    const { data: updatedCaisse, error } = await supabase
      .from('mouvements_caisse')
      .update(annulationFields)
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!updatedCaisse || updatedCaisse.length === 0) {
      throw new Error('Impossible d\'annuler le mouvement de caisse (modification bloquée par la sécurité). Contactez un administrateur.');
    }

    const { error: errBanque } = await supabase
      .from('mouvements_bancaires')
      .update(annulationFields)
      .eq('mouvement_caisse_id', id)
      .eq('est_annule', false);
    if (errBanque) throw errBanque;

    if (mouvement?.type_mouvement === 'remboursement_dette_fournisseur' && mouvement?.dette_fournisseur_id) {
      await supabase
        .rpc('recalc_dette_fournisseur_remboursement', { dette_id: mouvement.dette_fournisseur_id });
    }
  },
};

// ==========================================
// Mouvement Bancaire Service
// ==========================================

export const mouvementBancaireService = {
  async getAll(filters?: { compte_bancaire_id?: number; date_from?: string; date_to?: string }): Promise<MouvementBancaire[]> {
    let query = supabase
      .from('mouvements_bancaires')
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        compte_bancaire:compte_bancaire_id(nom, devise, banque)
      `)
      .order('date_mouvement', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.compte_bancaire_id) query = query.eq('compte_bancaire_id', filters.compte_bancaire_id);
    if (filters?.date_from) query = query.gte('date_mouvement', filters.date_from);
    if (filters?.date_to) query = query.lte('date_mouvement', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: MouvementBancaireCreateData): Promise<MouvementBancaire> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data, error } = await supabase
      .from('mouvements_bancaires')
      .insert({ ...payload, saisie_par_id: user.id })
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        compte_bancaire:compte_bancaire_id(nom, devise, banque)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async annuler(id: number, motif: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const now = new Date().toISOString();
    const annulationFields = { est_annule: true, annule_par_id: user.id, annule_at: now, motif_annulation: motif };

    const { data: mouvement, error: errFetch } = await supabase
      .from('mouvements_bancaires')
      .select('mouvement_bancaire_lie_id')
      .eq('id', id)
      .single();
    if (errFetch) throw errFetch;

    const { data: updatedBanque, error } = await supabase
      .from('mouvements_bancaires')
      .update(annulationFields)
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!updatedBanque || updatedBanque.length === 0) {
      throw new Error('Impossible d\'annuler le mouvement bancaire (modification bloquée par la sécurité). Contactez un administrateur.');
    }

    if (mouvement?.mouvement_bancaire_lie_id) {
      const { error: errLie } = await supabase
        .from('mouvements_bancaires')
        .update(annulationFields)
        .eq('id', mouvement.mouvement_bancaire_lie_id)
        .eq('est_annule', false);
      if (errLie) throw errLie;
    }
  },

  async createApprovisionnement(payload: ApprovisionnementCreateData): Promise<{ sortie: MouvementBancaire; entree: MouvementBancaire }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const date = payload.date_mouvement ?? new Date().toISOString().split('T')[0];
    const description = payload.description || 'Approvisionnement inter-banques';

    // Insert sortie (source: NEDISMA MGA)
    const { data: sortie, error: errSortie } = await supabase
      .from('mouvements_bancaires')
      .insert({
        compte_bancaire_id: payload.compte_source_id,
        type_mouvement: 'approvisionnement',
        sens: 'sortie',
        montant: payload.montant_source,
        description,
        taux_change: payload.taux_change,
        mode_paiement: 'virement_emis',
        saisie_par_id: user.id,
        date_mouvement: date,
      })
      .select(`*, saisie_par:saisie_par_id(full_name), compte_bancaire:compte_bancaire_id(nom, devise, banque)`)
      .single();
    if (errSortie) throw errSortie;

    // Insert entree (destination: AGMA USD) avec lien vers la sortie
    const { data: entree, error: errEntree } = await supabase
      .from('mouvements_bancaires')
      .insert({
        compte_bancaire_id: payload.compte_destination_id,
        type_mouvement: 'approvisionnement',
        sens: 'entree',
        montant: payload.montant_destination,
        description,
        taux_change: payload.taux_change,
        mode_paiement: 'virement_recu',
        mouvement_bancaire_lie_id: sortie.id,
        saisie_par_id: user.id,
        date_mouvement: date,
      })
      .select(`*, saisie_par:saisie_par_id(full_name), compte_bancaire:compte_bancaire_id(nom, devise, banque)`)
      .single();
    if (errEntree) throw errEntree;

    // Lier la sortie vers l'entrée
    await supabase
      .from('mouvements_bancaires')
      .update({ mouvement_bancaire_lie_id: entree.id })
      .eq('id', sortie.id);

    return { sortie, entree };
  },
};

// ==========================================
// Avance Salaire Service
// ==========================================

export const avanceSalaireService = {
  async getAll(): Promise<AvanceSalaire[]> {
    const { data, error } = await supabase
      .from('avances_salaires')
      .select('*, employe:employe_id(full_name, email)')
      .order('date_avance', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getSoldesByEmploye(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('avances_salaires')
      .select('employe_id, montant_mga, statut');
    if (error) throw error;
    const result: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.statut === 'en_attente') {
        result[row.employe_id] = (result[row.employe_id] ?? 0) + Number(row.montant_mga);
      }
    }
    return result;
  },

  async create(payload: AvanceSalaireCreateData): Promise<AvanceSalaire> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data, error } = await supabase
      .from('avances_salaires')
      .insert({ ...payload, saisie_par_id: user.id, statut: 'en_attente' })
      .select('*, employe:employe_id(full_name, email)')
      .single();
    if (error) throw error;
    return data;
  },

  async marquerRembourse(id: number): Promise<void> {
    const { data: updatedRows, error } = await supabase
      .from('avances_salaires')
      .update({ statut: 'rembourse', date_remboursement: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible de marquer l\'avance comme remboursée (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },
};

// ==========================================
// Clients (lecture basique sans filtre shipping marks)
// ==========================================

export interface ClientBasic {
  id: number;
  pseudo: string;
  nom: string | null;
  prenom: string;
  entreprise: string | null;
  telephone?: string | null;
  statut_contact?: string | null;
}

export const clientBasicsService = {
  async getAll(): Promise<ClientBasic[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, pseudo, nom, prenom, entreprise, telephone, statut_contact')
      .order('nom', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};

// ==========================================
// Notes débit non payées (pour le formulaire mouvement)
// ==========================================

export interface NoteDebitNonPayee {
  id: number;
  reference: string;
  client_pseudo: string | null;
  client_nom: string | null;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  statut_paiement: 'impayee' | 'payee' | 'partielle';
  total_paye: number | null;
  volume_total_tana: number | null;
  apure_externe: boolean;
}

export interface NoteDebitRapport {
  id: number;
  reference: string;
  depart_id: number;
  client_pseudo: string | null;
  client_nom: string | null;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  statut_paiement: 'impayee' | 'payee' | 'partielle';
  created_at: string;
  depart: { id: number; num_bl: string } | null;
}

export const noteDebitComptaService = {
  async getForRapport(annee: number, mois: number): Promise<NoteDebitRapport[]> {
    const dateFrom = new Date(annee, mois - 1, 1).toISOString();
    const dateTo = new Date(annee, mois, 1).toISOString();
    const { data, error } = await supabase
      .from('notes_debit')
      .select('id, reference, depart_id, client_pseudo, client_nom, montant_total_ariary, frais_livraison_ariary, statut_paiement, created_at, depart:depart_id(id, num_bl)')
      .gte('created_at', dateFrom)
      .lt('created_at', dateTo)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NoteDebitRapport[];
  },

  async getNonPayees(): Promise<NoteDebitNonPayee[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('id, reference, client_pseudo, client_nom, montant_total_ariary, frais_livraison_ariary, statut_paiement, total_paye, apure_externe')
      .in('statut_paiement', ['impayee', 'partielle'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getAll(): Promise<NoteDebitNonPayee[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('id, reference, client_pseudo, client_nom, montant_total_ariary, frais_livraison_ariary, statut_paiement, total_paye, volume_total_tana, created_at, apure_externe')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async toggleApureExterne(noteDebitId: number, apureExtrene: boolean): Promise<void> {
    const { data: updatedRows, error } = await supabase
      .from('notes_debit')
      .update({ apure_externe: apureExtrene })
      .eq('id', noteDebitId)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible de modifier le statut apuré externe (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },

  async marquerPayee(noteDebitId: number, mouvementCaisseId: number, modePaiement: ModePaiement): Promise<void> {
    // Récupérer la note de débit pour connaître le montant total
    const { data: note, error: noteErr } = await supabase
      .from('notes_debit')
      .select('montant_total_ariary, frais_livraison_ariary')
      .eq('id', noteDebitId)
      .maybeSingle();
    if (noteErr) throw noteErr;
    if (!note) throw new Error('Note de débit introuvable');

    // Récupérer tous les mouvements de caisse non annulés liés à cette note
    const { data: mouvements, error: mouvErr } = await supabase
      .from('mouvements_caisse')
      .select('montant_mga')
      .eq('note_debit_id', noteDebitId)
      .eq('est_annule', false);
    if (mouvErr) throw mouvErr;

    const totalPaye = (mouvements ?? []).reduce((sum, m) => sum + Number(m.montant_mga), 0);
    const montantNote = Number(note.montant_total_ariary) + Number(note.frais_livraison_ariary ?? 0);

    const nouveauStatut = totalPaye >= montantNote ? 'payee' : 'partielle';

    const { data: updatedRows, error } = await supabase
      .from('notes_debit')
      .update({
        statut_paiement: nouveauStatut,
        mouvement_caisse_id: mouvementCaisseId,
        mode_paiement_nd: modePaiement,
        date_paiement: new Date().toISOString().split('T')[0],
        total_paye: totalPaye,
      })
      .eq('id', noteDebitId)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible de mettre à jour le statut de la note de débit (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },
};

// ==========================================
// Devis (demandes_achat) payables — pour le formulaire mouvement
// ==========================================

export interface DevisPayable {
  id: number;
  nom_article: string;
  date_creation: string;
  taux_change_vendu: number | null;
  frais_port_locaux_rmb: number | null;
  client: { pseudo: string | null; nom: string | null; prenom: string | null } | null;
  achat_articles: { prix_unitaire_rmb: number | null; quantite: number }[];
}

export const devisPayableService = {
  async getPayables(): Promise<DevisPayable[]> {
    const { data, error } = await supabase
      .from('demandes_achat')
      .select('id, nom_article, date_creation, taux_change_vendu, frais_port_locaux_rmb, client:clients(pseudo, nom, prenom), achat_articles(prix_unitaire_rmb, quantite)')
      .eq('statut', 'Devis Prêt')
      .order('date_creation', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DevisPayable[];
  },

  async marquerPayé(demandeAchatId: number): Promise<void> {
    const { data: updatedRows, error } = await supabase
      .from('demandes_achat')
      .update({ statut: 'Payé' })
      .eq('id', demandeAchatId)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible de marquer le devis comme payé (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },
};

// ==========================================
// Dette Fournisseur Service
// ==========================================

export type StatutDetteFournisseur = 'en_attente' | 'partiellement_remboursee' | 'remboursee';

export interface DetteFournisseur {
  id: number;
  reference: string;
  client_id: number;
  montant_usd: number;
  taux_usd_mga: number;
  montant_mga_equivalent: number;
  description: string;
  date_paiement: string;
  statut: StatutDetteFournisseur;
  montant_rembourse_mga: number;
  notes: string | null;
  saisie_par_id: string;
  est_annule: boolean;
  annule_par_id: string | null;
  annule_at: string | null;
  motif_annulation: string | null;
  created_at: string;
  updated_at: string;
  client?: { pseudo: string; nom: string | null; prenom: string; entreprise: string | null } | null;
  saisie_par?: { full_name: string | null } | null;
}

export interface DetteFournisseurCreateData {
  client_id: number;
  montant_usd: number;
  taux_usd_mga: number;
  montant_mga_equivalent: number;
  description: string;
  date_paiement: string;
  notes?: string | null;
}

export const detteFournisseurService = {
  async getAll(filters?: { statut?: StatutDetteFournisseur | ''; client_id?: number; date_from?: string; date_to?: string }): Promise<DetteFournisseur[]> {
    let query = supabase
      .from('dettes_fournisseur')
      .select(`
        *,
        client:clients(pseudo, nom, prenom, entreprise),
        saisie_par:saisie_par_id(full_name)
      `)
      .order('date_paiement', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.statut) query = query.eq('statut', filters.statut);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    if (filters?.date_from) query = query.gte('date_paiement', filters.date_from);
    if (filters?.date_to) query = query.lte('date_paiement', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getRemboursables(): Promise<DetteFournisseur[]> {
    const { data, error } = await supabase
      .from('dettes_fournisseur')
      .select(`*, client:clients(pseudo, nom, prenom, entreprise)`)
      .in('statut', ['en_attente', 'partiellement_remboursee'])
      .eq('est_annule', false)
      .order('date_paiement', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getRemboursements(detteId: number): Promise<MouvementCaisse[]> {
    const { data, error } = await supabase
      .from('mouvements_caisse')
      .select(`
        *,
        saisie_par:saisie_par_id(full_name)
      `)
      .eq('dette_fournisseur_id', detteId)
      .eq('est_annule', false)
      .order('date_mouvement', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('dettes_fournisseur')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const nextNum = (data?.id ?? 0) + 1;
    const num = String(nextNum).padStart(3, '0');
    return `DF-${year}-${num}`;
  },

  async create(data: DetteFournisseurCreateData): Promise<DetteFournisseur> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const reference = await detteFournisseurService.generateReference();
    const { data: result, error } = await supabase
      .from('dettes_fournisseur')
      .insert({ ...data, reference, saisie_par_id: user.id })
      .select(`*, client:clients(pseudo, nom, prenom, entreprise), saisie_par:saisie_par_id(full_name)`)
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: number, payload: {
    montant_usd?: number;
    taux_usd_mga?: number;
    montant_mga_equivalent?: number;
    date_paiement?: string;
    description?: string;
    notes?: string | null;
  }): Promise<DetteFournisseur> {
    const { data, error } = await supabase
      .from('dettes_fournisseur')
      .update(payload)
      .eq('id', id)
      .select(`*, client:clients(pseudo, nom, prenom, entreprise), saisie_par:saisie_par_id(full_name)`)
      .single();
    if (error) throw error;

    // Recalculate remboursement statut since montant_mga_equivalent may have changed
    await supabase.rpc('recalc_dette_fournisseur_remboursement', { dette_id: id });

    return data;
  },

  async annuler(id: number, motif: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: updatedRows, error } = await supabase
      .from('dettes_fournisseur')
      .update({ est_annule: true, annule_par_id: user.id, annule_at: new Date().toISOString(), motif_annulation: motif })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible d\'annuler la dette fournisseur (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },
};

// ==========================================
// Alipay Service
// ==========================================

export interface CompteAlipay {
  id: number;
  nom: string;
  responsable_id: string | null;
  solde_initial_rmb: number;
  date_solde_initial: string;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
  responsable?: { full_name: string | null; email: string | null } | null;
}

export type TypeMouvementAlipay = 'approvisionnement' | 'achat_fournisseur' | 'autre_entree' | 'autre_sortie';

export interface MouvementAlipay {
  id: number;
  compte_alipay_id: number;
  type_mouvement: TypeMouvementAlipay;
  sens: 'entree' | 'sortie';
  montant_rmb: number;
  taux_rmb_mga: number | null;
  caisse_mouvement_id: number | null;
  demande_achat_id: number | null;
  tiers_nom: string | null;
  description: string;
  reference_externe: string | null;
  date_mouvement: string;
  saisie_par_id: string;
  est_annule: boolean;
  annule_par_id: string | null;
  annule_at: string | null;
  motif_annulation: string | null;
  created_at: string;
  updated_at: string;
  saisie_par?: { full_name: string | null } | null;
  demande_achat?: { id: number; nom_article: string; date_creation: string; client: { pseudo: string | null; nom: string | null; prenom: string | null } | null } | null;
}

export interface MouvementAlipayCreateData {
  compte_alipay_id: number;
  type_mouvement: TypeMouvementAlipay;
  sens: 'entree' | 'sortie';
  montant_rmb: number;
  taux_rmb_mga?: number | null;
  caisse_mouvement_id?: number | null;
  demande_achat_id?: number | null;
  tiers_nom?: string | null;
  description: string;
  reference_externe?: string | null;
  date_mouvement?: string;
}

export const compteAlipayService = {
  async getAll(): Promise<CompteAlipay[]> {
    const { data, error } = await supabase
      .from('comptes_alipay')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_actif', true)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getMine(): Promise<CompteAlipay[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('comptes_alipay')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_actif', true)
      .eq('responsable_id', user.id)
      .order('nom');
    if (error) throw error;
    return data ?? [];
  },

  async getArchived(): Promise<CompteAlipay[]> {
    const { data, error } = await supabase
      .from('comptes_alipay')
      .select('*, responsable:responsable_id(full_name, email)')
      .eq('est_actif', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: { nom: string; responsable_id?: string | null; solde_initial_rmb?: number; date_solde_initial?: string }): Promise<CompteAlipay> {
    const { data, error } = await supabase
      .from('comptes_alipay')
      .insert(payload)
      .select('*, responsable:responsable_id(full_name, email)')
      .single();
    if (error) throw error;
    return data;
  },

  async setResponsable(compteId: number, responsableId: string | null): Promise<CompteAlipay> {
    const { data, error } = await supabase
      .from('comptes_alipay')
      .update({ responsable_id: responsableId })
      .eq('id', compteId)
      .select('*, responsable:responsable_id(full_name, email)')
      .single();
    if (error) throw error;
    return data;
  },

  async archive(id: number): Promise<void> {
    const { error } = await supabase.from('comptes_alipay').update({ est_actif: false }).eq('id', id);
    if (error) throw error;
  },

  async restore(id: number): Promise<void> {
    const { error } = await supabase.from('comptes_alipay').update({ est_actif: true }).eq('id', id);
    if (error) throw error;
  },

  async getSolde(compteId: number): Promise<number> {
    const { data: compte, error: errCompte } = await supabase
      .from('comptes_alipay')
      .select('solde_initial_rmb')
      .eq('id', compteId)
      .maybeSingle();
    if (errCompte) throw errCompte;
    if (!compte) return 0;

    const { data, error } = await supabase
      .from('mouvements_alipay')
      .select('sens, montant_rmb')
      .eq('compte_alipay_id', compteId)
      .eq('est_annule', false);
    if (error) throw error;
    const mouvements = data ?? [];
    const totalEntrees = mouvements.filter(m => m.sens === 'entree').reduce((s, m) => s + Number(m.montant_rmb), 0);
    const totalSorties = mouvements.filter(m => m.sens === 'sortie').reduce((s, m) => s + Number(m.montant_rmb), 0);
    return Number(compte.solde_initial_rmb) + totalEntrees - totalSorties;
  },
};

const MOUVEMENT_ALIPAY_SELECT = `
  *,
  saisie_par:saisie_par_id(full_name),
  demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom))
`;

export const mouvementAlipayService = {
  async getAll(filters?: { compte_alipay_id?: number; date_from?: string; date_to?: string }): Promise<MouvementAlipay[]> {
    let query = supabase
      .from('mouvements_alipay')
      .select(MOUVEMENT_ALIPAY_SELECT)
      .order('date_mouvement', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.compte_alipay_id) query = query.eq('compte_alipay_id', filters.compte_alipay_id);
    if (filters?.date_from) query = query.gte('date_mouvement', filters.date_from);
    if (filters?.date_to) query = query.lte('date_mouvement', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: MouvementAlipayCreateData): Promise<MouvementAlipay> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data, error } = await supabase
      .from('mouvements_alipay')
      .insert({ ...payload, saisie_par_id: user.id })
      .select(MOUVEMENT_ALIPAY_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async annuler(id: number, motif: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: updatedRows, error } = await supabase
      .from('mouvements_alipay')
      .update({ est_annule: true, annule_par_id: user.id, annule_at: new Date().toISOString(), motif_annulation: motif })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Impossible d\'annuler le mouvement Alipay (modification bloquée par la sécurité). Contactez un administrateur.');
    }
  },

  async createFromAchatRmb(params: {
    caisseMouvementId: number;
    montantRmb: number;
    tauxRmbMga: number;
    dateMouvement: string;
    responsableId: string;
  }): Promise<MouvementAlipay | null> {
    const { data: comptes, error: errComptes } = await supabase
      .from('comptes_alipay')
      .select('id')
      .eq('responsable_id', params.responsableId)
      .eq('est_actif', true)
      .limit(1);
    if (errComptes || !comptes?.length) return null;

    const compteId = comptes[0].id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('mouvements_alipay')
      .insert({
        compte_alipay_id: compteId,
        type_mouvement: 'approvisionnement',
        sens: 'entree',
        montant_rmb: params.montantRmb,
        taux_rmb_mga: params.tauxRmbMga,
        caisse_mouvement_id: params.caisseMouvementId,
        description: `Approvisionnement depuis caisse`,
        date_mouvement: params.dateMouvement,
        saisie_par_id: user.id,
      })
      .select(MOUVEMENT_ALIPAY_SELECT)
      .single();
    if (error) throw error;
    return data;
  },
};

// ==========================================
// Cheques Service
// ==========================================

export type StatutCheque = 'en_attente' | 'verse' | 'annule';

export interface Cheque {
  id: number;
  numero_cheque: string;
  montant_mga: number;
  payeur: string;
  date_reception: string;
  date_echeance: string;
  statut: StatutCheque;
  description: string | null;
  note_debit_id: number | null;
  mouvement_caisse_id: number | null;
  mouvement_bancaire_id: number | null;
  compte_bancaire_id: number | null;
  date_versement: string | null;
  motif_annulation: string | null;
  saisie_par_id: string;
  created_at: string;
  updated_at: string;
  note_debit?: { reference: string; client_pseudo: string | null } | null;
  compte_bancaire?: { nom: string; banque: string } | null;
}

export interface ChequeCreateData {
  numero_cheque: string;
  montant_mga: number;
  payeur: string;
  date_reception?: string;
  date_echeance: string;
  description?: string | null;
  note_debit_id?: number | null;
  mouvement_caisse_id?: number | null;
}

const CHEQUE_SELECT = `
  *,
  note_debit:note_debit_id(reference, client_pseudo),
  compte_bancaire:compte_bancaire_id(nom, banque)
`;

export const chequeService = {
  async getAll(filters?: { statut?: StatutCheque | ''; search?: string }): Promise<Cheque[]> {
    let query = supabase
      .from('cheques')
      .select(CHEQUE_SELECT)
      .order('date_echeance', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.statut) query = query.eq('statut', filters.statut);
    if (filters?.search) {
      const s = filters.search.trim();
      if (s) query = query.or(`numero_cheque.ilike.%${s}%,payeur.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Cheque[];
  },

  async create(data: ChequeCreateData): Promise<Cheque> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: result, error } = await supabase
      .from('cheques')
      .insert({
        numero_cheque: data.numero_cheque.trim(),
        montant_mga: data.montant_mga,
        payeur: data.payeur.trim(),
        date_reception: data.date_reception ?? new Date().toISOString().split('T')[0],
        date_echeance: data.date_echeance,
        description: data.description ?? null,
        note_debit_id: data.note_debit_id ?? null,
        mouvement_caisse_id: data.mouvement_caisse_id ?? null,
        saisie_par_id: user.id,
      })
      .select(CHEQUE_SELECT)
      .single();
    if (error) throw error;
    return result as Cheque;
  },

  async changerStatut(
    id: number,
    nouveauStatut: StatutCheque,
    options?: { compteBancaireId?: number; dateVersement?: string; motif?: string; mouvementCaisseId?: number; description?: string }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    if (nouveauStatut === 'verse') {
      if (!options?.compteBancaireId) throw new Error('Compte bancaire requis pour le versement');
      const dateVersement = options.dateVersement ?? new Date().toISOString().split('T')[0];

      const { error: rpcErr } = await supabase
        .rpc('verser_cheque_en_banque', {
          p_cheque_id: id,
          p_compte_bancaire_id: options.compteBancaireId,
          p_date_versement: dateVersement,
          p_mouvement_caisse_id: options.mouvementCaisseId ?? null,
          p_description: options.description ?? null,
        });
      if (rpcErr) throw new Error(rpcErr.message || 'Échec du versement du chèque en banque');
    } else if (nouveauStatut === 'annule') {
      const { error } = await supabase
        .from('cheques')
        .update({
          statut: 'annule',
          motif_annulation: options?.motif ?? null,
        })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { data: cheque } = await supabase
        .from('cheques')
        .select('mouvement_bancaire_id')
        .eq('id', id)
        .maybeSingle();

      if (cheque?.mouvement_bancaire_id) {
        await supabase
          .from('mouvements_bancaires')
          .update({
            est_annule: true,
            annule_par_id: user.id,
            annule_at: new Date().toISOString(),
            motif_annulation: 'Remise en attente du chèque',
          })
          .eq('id', cheque.mouvement_bancaire_id);
      }

      const { error } = await supabase
        .from('cheques')
        .update({
          statut: 'en_attente',
          mouvement_bancaire_id: null,
          compte_bancaire_id: null,
          date_versement: null,
          motif_annulation: null,
        })
        .eq('id', id);
      if (error) throw error;
    }
  },

  async verserViaMouvementBancaire(
    id: number,
    mouvementBancaireId: number,
    compteBancaireId: number,
    dateVersement: string
  ): Promise<void> {
    // This method is kept for backward compatibility but now delegates to the
    // atomic RPC. The mouvementBancaireId parameter is no longer used because
    // the RPC creates the bank movement internally.
    void mouvementBancaireId;
    const { error: rpcErr } = await supabase
      .rpc('verser_cheque_en_banque', {
        p_cheque_id: id,
        p_compte_bancaire_id: compteBancaireId,
        p_date_versement: dateVersement,
        p_mouvement_caisse_id: null,
        p_description: null,
      });
    if (rpcErr) throw new Error(rpcErr.message || 'Échec du versement du chèque en banque');
  },

  async updateDetails(
    id: number,
    data: { numero_cheque?: string; payeur?: string; date_echeance?: string; description?: string | null }
  ): Promise<Cheque> {
    const { data: result, error } = await supabase
      .from('cheques')
      .update({
        ...(data.numero_cheque !== undefined ? { numero_cheque: data.numero_cheque.trim() } : {}),
        ...(data.payeur !== undefined ? { payeur: data.payeur.trim() } : {}),
        ...(data.date_echeance !== undefined ? { date_echeance: data.date_echeance } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      })
      .eq('id', id)
      .select(CHEQUE_SELECT)
      .single();
    if (error) throw error;
    return result as Cheque;
  },
};

// ==========================================
// Relevé client détaillé (factures + encaissements + paiements fournisseur)
// ==========================================

export interface NoteDebitClient {
  id: number;
  reference: string;
  client_pseudo: string | null;
  client_nom: string | null;
  montant_total_ariary: number;
  frais_livraison_ariary: number | null;
  volume_total_tana: number | null;
  prix_cbm_usd: number | null;
  statut_paiement: 'impayee' | 'payee' | 'partielle';
  total_paye: number | null;
  apure_externe: boolean;
  created_at: string;
}

export const releveClientService = {
  async getNotesDebitByPseudo(pseudo: string): Promise<NoteDebitClient[]> {
    const { data, error } = await supabase
      .from('notes_debit')
      .select('id, reference, client_pseudo, client_nom, montant_total_ariary, frais_livraison_ariary, volume_total_tana, prix_cbm_usd, statut_paiement, total_paye, apure_externe, created_at')
      .eq('client_pseudo', pseudo)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NoteDebitClient[];
  },

  async getMouvementsByClient(pseudo: string, noteDebitIds: number[], demandeAchatIds: number[], detteFournisseurIds: number[]): Promise<MouvementCaisse[]> {
    if (!pseudo && noteDebitIds.length === 0 && demandeAchatIds.length === 0 && detteFournisseurIds.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('mouvements_caisse')
      .select(`
        *,
        saisie_par:saisie_par_id(full_name),
        employe_beneficiaire:employe_beneficiaire_id(full_name),
        note_debit:note_debit_id(reference, client_pseudo),
        compte_bancaire:compte_bancaire_id(nom, devise),
        caisse_destination:caisse_destination_id(id, nom, type_caisse),
        caisse:caisse_id(nom),
        demande_achat:demande_achat_id(id, nom_article, date_creation, client:clients(pseudo, nom, prenom)),
        dette_fournisseur:dette_fournisseur_id(reference, client_id)
      `)
      .order('date_mouvement', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;

    const all = (data ?? []) as (MouvementCaisse & { caisse?: { nom: string } })[];
    const pseudoLower = pseudo.toLowerCase();
    return all.filter(m => {
      if (m.note_debit_id && noteDebitIds.includes(m.note_debit_id)) return true;
      if (m.demande_achat_id && demandeAchatIds.includes(m.demande_achat_id)) return true;
      if (m.dette_fournisseur_id && detteFournisseurIds.includes(m.dette_fournisseur_id)) return true;
      if (m.tiers_nom && m.tiers_nom.toLowerCase() === pseudoLower) return true;
      if (m.note_debit?.client_pseudo && m.note_debit.client_pseudo.toLowerCase() === pseudoLower) return true;
      if (m.demande_achat?.client?.pseudo && m.demande_achat.client.pseudo.toLowerCase() === pseudoLower) return true;
      return false;
    });
  },

  async getDettesFournisseurByClientId(clientId: number): Promise<DetteFournisseur[]> {
    const { data, error } = await supabase
      .from('dettes_fournisseur')
      .select(`*, client:clients(pseudo, nom, prenom, entreprise), saisie_par:saisie_par_id(full_name)`)
      .eq('client_id', clientId)
      .order('date_paiement', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DetteFournisseur[];
  },
};
