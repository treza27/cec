import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  caisseService,
  compteBancaireService,
  mouvementCaisseService,
  mouvementBancaireService,
  avanceSalaireService,
  noteDebitComptaService,
  devisPayableService,
  detteFournisseurService,
  compteAlipayService,
  mouvementAlipayService,
  MouvementCaisseCreateData,
  MouvementCaisse,
  MouvementBancaireCreateData,
  ApprovisionnementCreateData,
  AvanceSalaireCreateData,
  DetteFournisseurCreateData,
  MouvementAlipayCreateData,
  StatutDetteFournisseur,
  ModePaiement,
  NoteDebitRapport,
  clientBasicsService,
  ClientBasic,
  chequeService,
  Cheque,
  ChequeCreateData,
  StatutCheque,
  releveClientService,
} from '../services/comptabiliteService';

export type { NoteDebitRapport, ClientBasic };


// ==========================================
// Query keys
// ==========================================

export const comptabiliteKeys = {
  caisses: ['caisses'] as const,
  caisseMine: ['caisses', 'mine'] as const,
  caisseActives: ['caisses', 'actives'] as const,
  caisseSolde: (id: number) => ['caisses', 'solde', id] as const,
  comptesBancaires: ['comptes_bancaires'] as const,
  compteBancaireSolde: (id: number) => ['comptes_bancaires', 'solde', id] as const,
  mouvementsCaisse: (filters?: object) => ['mouvements_caisse', filters] as const,
  mouvementsBancaires: (filters?: object) => ['mouvements_bancaires', filters] as const,
  avancesSalaires: ['avances_salaires'] as const,
  avancesSoldes: ['avances_salaires', 'soldes'] as const,
  notesDebitNonPayees: ['notes_debit', 'non_payees'] as const,
  notesDebitAll: ['notes_debit', 'all'] as const,
  clientsBasic: ['clients', 'basic'] as const,
  notesDebitRapport: (annee: number, mois: number) => ['notes_debit', 'rapport', annee, mois] as const,
  devisPayables: ['demandes_achat', 'payables'] as const,
  dettesFournisseur: (filters?: object) => ['dettes_fournisseur', filters] as const,
  dettesFournisseurRemboursables: ['dettes_fournisseur', 'remboursables'] as const,
  dettesFournisseurRemboursements: (id: number) => ['dettes_fournisseur', 'remboursements', id] as const,
  comptesAlipay: ['comptes_alipay'] as const,
  comptesAlipayMine: ['comptes_alipay', 'mine'] as const,
  compteAlipaySolde: (id: number) => ['comptes_alipay', 'solde', id] as const,
  mouvementsAlipay: (filters?: object) => ['mouvements_alipay', filters] as const,
  cheques: (filters?: object) => ['cheques', filters] as const,
};

// ==========================================
// Caisses
// ==========================================

export function useCaisses() {
  return useQuery({
    queryKey: comptabiliteKeys.caisses,
    queryFn: caisseService.getAll,
  });
}

export function useCaisseMine() {
  return useQuery({
    queryKey: comptabiliteKeys.caisseMine,
    queryFn: caisseService.getMine,
  });
}

export function useCaisseSolde(caisseId: number) {
  return useQuery({
    queryKey: comptabiliteKeys.caisseSolde(caisseId),
    queryFn: () => caisseService.getSolde(caisseId),
    enabled: !!caisseId,
  });
}

export function useCaissesActives() {
  return useQuery({
    queryKey: comptabiliteKeys.caisseActives,
    queryFn: caisseService.getActives,
  });
}

export function useCreateCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: caisseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisses });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseMine });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseActives });
    },
  });
}

export function useSetResponsableCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caisseId, responsableId }: { caisseId: number; responsableId: string | null }) =>
      caisseService.setResponsable(caisseId, responsableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisses });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseMine });
    },
  });
}

export function useCaissesArchivees() {
  return useQuery({
    queryKey: [...comptabiliteKeys.caisses, 'archived'],
    queryFn: caisseService.getArchived,
  });
}

export function useArchiveCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => caisseService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisses });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseMine });
    },
  });
}

export function useRestoreCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => caisseService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisses });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseMine });
    },
  });
}

// ==========================================
// Comptes bancaires
// ==========================================

export function useComptesBancaires() {
  return useQuery({
    queryKey: comptabiliteKeys.comptesBancaires,
    queryFn: compteBancaireService.getAll,
  });
}

export function useComptesBancairesActifs() {
  return useQuery({
    queryKey: [...comptabiliteKeys.comptesBancaires, 'actifs'],
    queryFn: compteBancaireService.getActifs,
  });
}

export function useComptesBancairesMine() {
  return useQuery({
    queryKey: [...comptabiliteKeys.comptesBancaires, 'mine'],
    queryFn: compteBancaireService.getMesComptes,
  });
}

export function useSetResponsableCompte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ compteId, responsableId }: { compteId: number; responsableId: string | null }) =>
      compteBancaireService.setResponsable(compteId, responsableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useCompteBancaireSolde(compteId: number) {
  return useQuery({
    queryKey: comptabiliteKeys.compteBancaireSolde(compteId),
    queryFn: () => compteBancaireService.getSolde(compteId),
    enabled: !!compteId,
  });
}

export function useCreateCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: compteBancaireService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useComptesBancairesArchives() {
  return useQuery({
    queryKey: [...comptabiliteKeys.comptesBancaires, 'archived'],
    queryFn: compteBancaireService.getArchived,
  });
}

export function useArchiveCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => compteBancaireService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useRestoreCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => compteBancaireService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

// ==========================================
// Mouvements caisse
// ==========================================

export function useMouvementsCaisse(filters?: { caisse_id?: number; date_from?: string; date_to?: string; type_mouvement?: string }) {
  return useQuery({
    queryKey: comptabiliteKeys.mouvementsCaisse(filters),
    queryFn: () => mouvementCaisseService.getAll(filters),
    enabled: !!filters?.caisse_id,
    refetchInterval: 15000,
  });
}

export function useCreateMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MouvementCaisseCreateData) => mouvementCaisseService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsCaisse() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseSolde(data.caisse_id) });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseMine });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.notesDebitNonPayees });
      if (variables.dette_fournisseur_id) {
        queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
      }
      if (variables.caisse_destination_id) {
        queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseSolde(variables.caisse_destination_id) });
      }
    },
  });
}

export function useAnnulerMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => mouvementCaisseService.annuler(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsCaisse() });
      queryClient.invalidateQueries({ queryKey: ['caisses', 'solde'] });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
      queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
    },
  });
}

export function useUpdateMouvementCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof mouvementCaisseService.update>[1] }) =>
      mouvementCaisseService.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsCaisse() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.caisseSolde(data.caisse_id) });
      queryClient.invalidateQueries({ queryKey: ['caisses', 'solde'] });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: ['comptes_bancaires', 'solde'] });
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSalaires });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSoldes });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.notesDebitNonPayees });
      queryClient.invalidateQueries({ queryKey: ['notes_debit'] });
      queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
      queryClient.invalidateQueries({ queryKey: ['mouvements_alipay'] });
    },
  });
}

// ==========================================
// Mouvements bancaires
// ==========================================

export function useMouvementsBancaires(filters?: { compte_bancaire_id?: number; date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: comptabiliteKeys.mouvementsBancaires(filters),
    queryFn: () => mouvementBancaireService.getAll(filters),
    enabled: !!filters?.compte_bancaire_id,
    refetchInterval: 15000,
  });
}

export function useCreateMouvementBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MouvementBancaireCreateData) => mouvementBancaireService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.compteBancaireSolde(data.compte_bancaire_id) });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useAnnulerMouvementBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => mouvementBancaireService.annuler(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
      queryClient.invalidateQueries({ queryKey: ['comptes_bancaires', 'solde'] });
    },
  });
}

export function useCreateApprovisionnementBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApprovisionnementCreateData) => mouvementBancaireService.createApprovisionnement(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.compteBancaireSolde(data.sortie.compte_bancaire_id) });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.compteBancaireSolde(data.entree.compte_bancaire_id) });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

// ==========================================
// Avances salaires
// ==========================================

export function useAvancesSalaires() {
  return useQuery({
    queryKey: comptabiliteKeys.avancesSalaires,
    queryFn: avanceSalaireService.getAll,
  });
}

export function useAvancesSoldes() {
  return useQuery({
    queryKey: comptabiliteKeys.avancesSoldes,
    queryFn: avanceSalaireService.getSoldesByEmploye,
  });
}

export function useCreateAvanceSalaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AvanceSalaireCreateData) => avanceSalaireService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSalaires });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSoldes });
    },
  });
}

export function useMarquerAvanceRembourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => avanceSalaireService.marquerRembourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSalaires });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.avancesSoldes });
    },
  });
}

// ==========================================
// Notes débit non payées
// ==========================================

export function useNotesDebitNonPayees() {
  return useQuery({
    queryKey: comptabiliteKeys.notesDebitNonPayees,
    queryFn: noteDebitComptaService.getNonPayees,
  });
}

export function useNotesDebitAll() {
  return useQuery({
    queryKey: comptabiliteKeys.notesDebitAll,
    queryFn: noteDebitComptaService.getAll,
  });
}

export function useClientsBasic() {
  return useQuery({
    queryKey: comptabiliteKeys.clientsBasic,
    queryFn: clientBasicsService.getAll,
  });
}

export function useNotesDebitRapport(annee: number, mois: number) {
  return useQuery({
    queryKey: comptabiliteKeys.notesDebitRapport(annee, mois),
    queryFn: () => noteDebitComptaService.getForRapport(annee, mois),
  });
}

export function useMarquerNoteDebitPayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteDebitId, mouvementCaisseId, modePaiement }: { noteDebitId: number; mouvementCaisseId: number; modePaiement: ModePaiement }) =>
      noteDebitComptaService.marquerPayee(noteDebitId, mouvementCaisseId, modePaiement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.notesDebitNonPayees });
      queryClient.invalidateQueries({ queryKey: ['notes_debit'] });
    },
  });
}

// ==========================================
// Devis payables (demandes_achat au statut "Devis Prêt")
// ==========================================

export function useDevisPayables() {
  return useQuery({
    queryKey: comptabiliteKeys.devisPayables,
    queryFn: devisPayableService.getPayables,
  });
}

export function useMarquerDevisPayé() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (demandeAchatId: number) => devisPayableService.marquerPayé(demandeAchatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.devisPayables });
      queryClient.invalidateQueries({ queryKey: ['demandes_achat'] });
    },
  });
}

// ==========================================
// Rapport mensuel (calculé côté client)
// ==========================================

export function useRapportMensuel(caisseId: number, annee: number, mois: number) {
  const dateFrom = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const lastDay = new Date(annee, mois, 0).getDate();
  const dateTo = `${annee}-${String(mois).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return useQuery({
    queryKey: ['rapport_mensuel', caisseId, annee, mois],
    queryFn: async () => {
      const mouvements = await mouvementCaisseService.getAll({ caisse_id: caisseId, date_from: dateFrom, date_to: dateTo });
      const actifs = mouvements.filter(m => !m.est_annule);
      const totalEntrees = actifs.filter(m => m.sens === 'entree').reduce((s, m) => s + Number(m.montant_mga), 0);
      const totalSorties = actifs.filter(m => m.sens === 'sortie').reduce((s, m) => s + Number(m.montant_mga), 0);
      const parType: Record<string, number> = {};
      for (const m of actifs) {
        parType[m.type_mouvement] = (parType[m.type_mouvement] ?? 0) + Number(m.montant_mga);
      }
      return { annee, mois, caisseId, totalEntrees, totalSorties, parType, mouvements: actifs };
    },
    enabled: !!caisseId,
  });
}

// ==========================================
// Alias pour AllEmployees (utilisé dans les formulaires)
// ==========================================

export { useAllEmployees } from './useEmployeeProfile';

// ==========================================
// Dettes Fournisseur
// ==========================================

export function useDettesFournisseur(filters?: { statut?: StatutDetteFournisseur | ''; client_id?: number; date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: comptabiliteKeys.dettesFournisseur(filters),
    queryFn: () => detteFournisseurService.getAll(filters),
  });
}

export function useDettesFournisseurRemboursables() {
  return useQuery({
    queryKey: comptabiliteKeys.dettesFournisseurRemboursables,
    queryFn: () => detteFournisseurService.getRemboursables(),
  });
}

export function useDettesFournisseurRemboursements(detteId: number) {
  return useQuery({
    queryKey: comptabiliteKeys.dettesFournisseurRemboursements(detteId),
    queryFn: () => detteFournisseurService.getRemboursements(detteId),
    enabled: !!detteId,
  });
}

export function useCreateDetteFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DetteFournisseurCreateData) => detteFournisseurService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
    },
  });
}

export function useUpdateDetteFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof detteFournisseurService.update>[1] }) =>
      detteFournisseurService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
    },
  });
}

export function useAnnulerDetteFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => detteFournisseurService.annuler(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dettes_fournisseur'] });
    },
  });
}

// ==========================================
// Comptes Alipay
// ==========================================

export function useComptesAlipay() {
  return useQuery({
    queryKey: comptabiliteKeys.comptesAlipay,
    queryFn: compteAlipayService.getAll,
  });
}

export function useComptesAlipayMine() {
  return useQuery({
    queryKey: comptabiliteKeys.comptesAlipayMine,
    queryFn: compteAlipayService.getMine,
  });
}

export function useCompteAlipaySolde(compteId: number) {
  return useQuery({
    queryKey: comptabiliteKeys.compteAlipaySolde(compteId),
    queryFn: () => compteAlipayService.getSolde(compteId),
    enabled: !!compteId,
  });
}

export function useCreateCompteAlipay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: compteAlipayService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesAlipay });
    },
  });
}

export function useSetResponsableCompteAlipay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ compteId, responsableId }: { compteId: number; responsableId: string | null }) =>
      compteAlipayService.setResponsable(compteId, responsableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesAlipay });
    },
  });
}

export function useArchiveCompteAlipay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => compteAlipayService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesAlipay });
    },
  });
}

// ==========================================
// Mouvements Alipay
// ==========================================

export function useMouvementsAlipay(filters?: { compte_alipay_id?: number; date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: comptabiliteKeys.mouvementsAlipay(filters),
    queryFn: () => mouvementAlipayService.getAll(filters),
    enabled: !!filters?.compte_alipay_id,
    refetchInterval: 15000,
  });
}

export function useCreateMouvementAlipay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MouvementAlipayCreateData) => mouvementAlipayService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsAlipay() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.compteAlipaySolde(data.compte_alipay_id) });
    },
  });
}

export function useAnnulerMouvementAlipay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => mouvementAlipayService.annuler(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsAlipay() });
      queryClient.invalidateQueries({ queryKey: ['comptes_alipay', 'solde'] });
    },
  });
}

// ==========================================
// Rapport mensuel complet (toutes sources)
// ==========================================

export function useRapportMensuelComplet(annee: number, mois: number) {
  const dateFrom = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const lastDay = new Date(annee, mois, 0).getDate();
  const dateTo = `${annee}-${String(mois).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: caisses = [], isSuccess: caissesReady } = useCaisses();
  const { data: comptesBancaires = [], isSuccess: banquesReady } = useComptesBancairesActifs();
  const { data: comptesAlipay = [], isSuccess: alipayReady } = useComptesAlipay();

  const allReady = caissesReady && banquesReady && alipayReady;

  const caisseIds = caisses.map(c => c.id);
  const banqueIds = comptesBancaires.map(c => c.id);
  const alipayIds = comptesAlipay.map(c => c.id);

  return useQuery({
    queryKey: ['rapport_mensuel_complet', annee, mois, caisseIds, banqueIds, alipayIds],
    queryFn: async () => {
      const [mouvCaisses, mouvBanques, mouvAlipay] = await Promise.all([
        Promise.all(
          caisses.map(c =>
            mouvementCaisseService.getAll({ caisse_id: c.id, date_from: dateFrom, date_to: dateTo })
              .then(mvts => ({ compte: c, mouvements: mvts }))
          )
        ),
        Promise.all(
          comptesBancaires.map(c =>
            mouvementBancaireService.getAll({ compte_bancaire_id: c.id, date_from: dateFrom, date_to: dateTo })
              .then(mvts => ({ compte: c, mouvements: mvts }))
          )
        ),
        Promise.all(
          comptesAlipay.map(c =>
            mouvementAlipayService.getAll({ compte_alipay_id: c.id, date_from: dateFrom, date_to: dateTo })
              .then(mvts => ({ compte: c, mouvements: mvts }))
          )
        ),
      ]);

      return {
        caisses: mouvCaisses,
        banques: mouvBanques,
        alipay: mouvAlipay,
      };
    },
    enabled: allReady,
  });
}

// ==========================================
// Chèques
// ==========================================

export function useCheques(filters?: { statut?: StatutCheque | ''; search?: string }) {
  return useQuery({
    queryKey: comptabiliteKeys.cheques(filters),
    queryFn: () => chequeService.getAll(filters),
  });
}

export function useCreateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChequeCreateData) => chequeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
    },
  });
}

export function useChangerStatutCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: number;
      statut: StatutCheque;
      compteBancaireId?: number;
      dateVersement?: string;
      motif?: string;
      mouvementCaisseId?: number;
      description?: string;
    }) => chequeService.changerStatut(params.id, params.statut, {
      compteBancaireId: params.compteBancaireId,
      dateVersement: params.dateVersement,
      motif: params.motif,
      mouvementCaisseId: params.mouvementCaisseId,
      description: params.description,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useVerserChequeViaBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      chequeId: number;
      compteBancaireId: number;
      dateVersement: string;
      mouvementCaisseId?: number;
      description?: string;
    }) => chequeService.changerStatut(params.chequeId, 'verse', {
      compteBancaireId: params.compteBancaireId,
      dateVersement: params.dateVersement,
      mouvementCaisseId: params.mouvementCaisseId,
      description: params.description,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.mouvementsBancaires() });
      queryClient.invalidateQueries({ queryKey: comptabiliteKeys.comptesBancaires });
    },
  });
}

export function useChequesEnAttente() {
  return useQuery({
    queryKey: ['cheques', { statut: 'en_attente' }],
    queryFn: () => chequeService.getAll({ statut: 'en_attente' }),
  });
}

export function useUpdateChequeDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: number;
      numero_cheque?: string;
      payeur?: string;
      date_echeance?: string;
      description?: string | null;
    }) => chequeService.updateDetails(params.id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
    },
  });
}

// ==========================================
// Relevé client détaillé
// ==========================================

export const releveClientKeys = {
  notesDebit: (pseudo: string) => ['releve_client', 'notes_debit', pseudo] as const,
  mouvements: (pseudo: string) => ['releve_client', 'mouvements', pseudo] as const,
  dettes: (clientId: number) => ['releve_client', 'dettes_fournisseur', clientId] as const,
  remboursements: (detteId: number) => ['releve_client', 'remboursements', detteId] as const,
};

export function useNotesDebitByPseudo(pseudo: string | null) {
  return useQuery({
    queryKey: releveClientKeys.notesDebit(pseudo ?? ''),
    queryFn: () => releveClientService.getNotesDebitByPseudo(pseudo!),
    enabled: !!pseudo,
  });
}

export function useDettesFournisseurByClientId(clientId: number | null) {
  return useQuery({
    queryKey: releveClientKeys.dettes(clientId ?? 0),
    queryFn: () => releveClientService.getDettesFournisseurByClientId(clientId!),
    enabled: !!clientId,
  });
}

export function useRemboursementsDette(detteId: number | null) {
  return useQuery({
    queryKey: releveClientKeys.remboursements(detteId ?? 0),
    queryFn: () => detteFournisseurService.getRemboursements(detteId!),
    enabled: !!detteId,
  });
}

export function useToggleApureExterne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteDebitId, apure_externe }: { noteDebitId: number; apure_externe: boolean }) =>
      noteDebitComptaService.toggleApureExterne(noteDebitId, apure_externe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releve_client'] });
      queryClient.invalidateQueries({ queryKey: ['notes_debit'] });
    },
  });
}
