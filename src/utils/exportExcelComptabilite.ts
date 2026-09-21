import * as XLSX from 'xlsx';
import type {
  MouvementCaisse,
  MouvementBancaire,
  MouvementAlipay,
  Caisse,
  CompteBancaire,
  CompteAlipay,
  NoteDebitRapport,
} from '../services/comptabiliteService';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const TYPE_LABELS_CAISSE: Record<string, string> = {
  entree_client: 'Encaissement client',
  paiement_note_debit: 'Paiement note de débit',
  achat_rmb: 'Achat RMB',
  frais_annexe: 'Frais annexes',
  loyer: 'Loyer',
  achat_materiel: 'Achat matériel',
  salaire: 'Salaire',
  avance_salaire: 'Avance salaire',
  transfert_interne: 'Transfert interne',
  remboursement_dette_fournisseur: 'Remb. dette fournisseur',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
};

const TYPE_LABELS_BANQUE: Record<string, string> = {
  versement_caisse: 'Versement caisse',
  virement_entrant: 'Virement entrant',
  virement_sortant: 'Virement sortant',
  frais_bancaires: 'Frais bancaires',
  interets: 'Intérêts',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
  approvisionnement: 'Approvisionnement',
};

const TYPE_LABELS_ALIPAY: Record<string, string> = {
  approvisionnement: 'Approvisionnement',
  achat_fournisseur: 'Achat fournisseur',
  autre_entree: 'Autre entrée',
  autre_sortie: 'Autre sortie',
};

export interface CompteAvecMouvements {
  type: 'caisse' | 'banque' | 'alipay';
  nom: string;
  devise: string;
  mouvements: MouvementCaisse[] | MouvementBancaire[] | MouvementAlipay[];
}

function sanitizeSheetName(name: string): string {
  // Excel sheet names: max 31 chars, no special chars
  return name.replace(/[:\\/?*[\]]/g, '-').substring(0, 31);
}

function buildCaisseRows(mouvements: MouvementCaisse[]) {
  const headers = [
    'Date', 'Type de mouvement', 'Description',
    'Montant RMB (¥)', 'Taux RMB/MGA',
    'Mode de paiement',
    'Tiers / Bénéficiaire', 'Compte / Destination', 'Réf. / Note de débit',
    'Saisi par',
    'Entrée (Ar)', 'Sortie (Ar)',
    'Statut', 'Motif annulation',
  ];
  const rows = mouvements.map(m => {
    const destination = m.caisse_destination?.nom ?? m.compte_bancaire?.nom ?? '';
    const refNoteDebit = m.note_debit?.reference
      ?? (m.demande_achat ? `Achat #${m.demande_achat.id}` : '')
      ?? m.reference_externe
      ?? '';
    const beneficiaire = m.tiers_nom
      ?? m.employe_beneficiaire?.full_name
      ?? m.dette_fournisseur?.reference
      ?? '';
    return [
      m.date_mouvement,
      TYPE_LABELS_CAISSE[m.type_mouvement] ?? m.type_mouvement,
      m.description,
      m.montant_rmb != null ? Number(m.montant_rmb) : '',
      m.taux_rmb_mga != null ? Number(m.taux_rmb_mga) : '',
      m.mode_paiement ?? '',
      beneficiaire,
      destination,
      refNoteDebit,
      m.saisie_par?.full_name ?? '',
      m.sens === 'entree' ? Number(m.montant_mga) : '',
      m.sens === 'sortie' ? Number(m.montant_mga) : '',
      m.est_annule ? 'Annulé' : 'Actif',
      m.motif_annulation ?? '',
    ];
  });
  return [headers, ...rows];
}

function buildBanqueRows(mouvements: MouvementBancaire[], devise: string) {
  const headers = [
    'Date', 'Type de mouvement', 'Mode de paiement', 'Description',
    'Référence externe', 'Taux de change', 'Saisi par',
    `Entrée (${devise})`, `Sortie (${devise})`,
    'Statut', 'Motif annulation',
  ];
  const rows = mouvements.map(m => [
    m.date_mouvement,
    TYPE_LABELS_BANQUE[m.type_mouvement] ?? m.type_mouvement,
    m.mode_paiement ?? '',
    m.description,
    m.reference_externe ?? '',
    m.taux_change != null ? Number(m.taux_change) : '',
    m.saisie_par?.full_name ?? '',
    m.sens === 'entree' ? Number(m.montant) : '',
    m.sens === 'sortie' ? Number(m.montant) : '',
    m.est_annule ? 'Annulé' : 'Actif',
    m.motif_annulation ?? '',
  ]);
  return [headers, ...rows];
}

function buildAlipayRows(mouvements: MouvementAlipay[]) {
  const headers = [
    'Date', 'Type de mouvement', 'Description', 'Référence externe',
    'Devis lié', 'Fournisseur / Tiers', 'Taux (MGA/¥)',
    'Entrée (¥)', 'Sortie (¥)',
    'Saisi par', 'Statut', 'Motif annulation',
  ];
  const rows = mouvements.map(m => {
    const devisRef = m.demande_achat
      ? `SA${String(new Date(m.demande_achat.date_creation).getFullYear()).slice(2)}${String(m.demande_achat.id).padStart(4, '0')}`
      : '';
    return [
      m.date_mouvement,
      TYPE_LABELS_ALIPAY[m.type_mouvement] ?? m.type_mouvement,
      m.description,
      m.reference_externe ?? '',
      devisRef,
      m.tiers_nom ?? '',
      m.taux_rmb_mga != null ? Number(m.taux_rmb_mga) : '',
      m.sens === 'entree' ? Number(m.montant_rmb) : '',
      m.sens === 'sortie' ? Number(m.montant_rmb) : '',
      m.saisie_par?.full_name ?? '',
      m.est_annule ? 'Annulé' : 'Actif',
      m.motif_annulation ?? '',
    ];
  });
  return [headers, ...rows];
}

function getMontant(m: MouvementCaisse | MouvementBancaire | MouvementAlipay, type: 'caisse' | 'banque' | 'alipay'): number {
  if (type === 'caisse') return Number((m as MouvementCaisse).montant_mga);
  if (type === 'banque') return Number((m as MouvementBancaire).montant);
  return Number((m as MouvementAlipay).montant_rmb);
}

function applyHeaderStyle(ws: XLSX.WorkSheet, numCols: number) {
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let c = 0; c <= numCols - 1; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1D4ED8' } },
      alignment: { horizontal: 'center' },
    };
  }
  // Set column widths
  ws['!cols'] = Array(numCols).fill({ wch: 22 });
  return range;
}

function buildNotesDebitRows(notes: NoteDebitRapport[]) {
  const headers = ['Référence', 'Départ (BL)', 'Client', 'Statut', 'Montant fret (Ar)', 'Frais livraison (Ar)', 'Total (Ar)', 'Date création'];
  const rows = notes.map(n => {
    const total = Number(n.montant_total_ariary) + Number(n.frais_livraison_ariary ?? 0);
    const statut = n.statut_paiement === 'payee' ? 'Payée' : n.statut_paiement === 'partielle' ? 'Partielle' : 'Impayée';
    return [
      n.reference,
      n.depart?.num_bl ?? `Départ #${n.depart_id}`,
      n.client_pseudo ?? n.client_nom ?? '',
      statut,
      Number(n.montant_total_ariary),
      n.frais_livraison_ariary != null ? Number(n.frais_livraison_ariary) : '',
      total,
      n.created_at ? n.created_at.slice(0, 10) : '',
    ];
  });
  return [headers, ...rows];
}

export function exportExcelComptabilite(
  comptes: CompteAvecMouvements[],
  annee: number,
  mois: number,
  notesDebit?: NoteDebitRapport[],
) {
  const wb = XLSX.utils.book_new();
  const moisLabel = MOIS_LABELS[mois - 1];

  // ---- Onglet Résumé (premier) ----
  const resumeHeaders = ['Compte', 'Type', 'Devise', 'Mouvements actifs', 'Entrées', 'Sorties', 'Solde net'];
  const resumeRows = comptes.map(c => {
    const actifs = c.mouvements.filter(m => !m.est_annule);
    const entrees = actifs
      .filter(m => m.sens === 'entree')
      .reduce((s, m) => s + getMontant(m, c.type), 0);
    const sorties = actifs
      .filter(m => m.sens === 'sortie')
      .reduce((s, m) => s + getMontant(m, c.type), 0);
    return [c.nom, c.type === 'caisse' ? 'Caisse' : c.type === 'banque' ? 'Banque' : 'Alipay', c.devise, actifs.length, entrees, sorties, entrees - sorties];
  });

  const resumeData = [resumeHeaders, ...resumeRows];
  const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
  applyHeaderStyle(wsResume, resumeHeaders.length);
  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

  // ---- Un onglet par compte ----
  for (const c of comptes) {
    let data: unknown[][];
    if (c.type === 'caisse') {
      data = buildCaisseRows(c.mouvements as MouvementCaisse[]);
    } else if (c.type === 'banque') {
      data = buildBanqueRows(c.mouvements as MouvementBancaire[], c.devise);
    } else {
      data = buildAlipayRows(c.mouvements as MouvementAlipay[]);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    applyHeaderStyle(ws, data[0].length);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(c.nom));
  }

  // ---- Onglet Notes de débit ----
  if (notesDebit && notesDebit.length > 0) {
    const ndData = buildNotesDebitRows(notesDebit);
    const wsNd = XLSX.utils.aoa_to_sheet(ndData);
    applyHeaderStyle(wsNd, ndData[0].length);
    XLSX.utils.book_append_sheet(wb, wsNd, 'Notes de débit');
  }

  const fileName = `Rapport_${moisLabel}_${annee}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
