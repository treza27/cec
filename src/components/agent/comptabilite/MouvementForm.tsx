import React, { useState, useEffect } from 'react';
import { X, Plus, Search, AlertCircle, ShoppingCart, Wallet, Building2, ArrowRight, DollarSign, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCreateMouvementCaisse,
  useCreateMouvementBancaire,
  useCreateAvanceSalaire,
  useMarquerNoteDebitPayee,
  useNotesDebitNonPayees,
  useCaissesActives,
  useAllEmployees,
  useDevisPayables,
  useMarquerDevisPayé,
  useComptesBancairesActifs,
  useDettesFournisseurRemboursables,
  useComptesAlipay,
} from '../../../hooks/useComptabilite';
import { TypeMouvementCaisse, ModePaiement, DevisPayable, mouvementAlipayService, chequeService, Cheque } from '../../../services/comptabiliteService';
import { supabase } from '../../../utils/supabase';
import { useCreateCheque, useVerserChequeViaBancaire, useChequesEnAttente } from '../../../hooks/useComptabilite';

const TYPE_LABELS: Record<TypeMouvementCaisse, { label: string; sens: 'entree' | 'sortie' }> = {
  entree_client: { label: 'Règlement achat client', sens: 'entree' },
  paiement_note_debit: { label: 'Paiement note de débit (fret)', sens: 'entree' },
  achat_rmb: { label: 'Achat de devises RMB', sens: 'sortie' },
  frais_annexe: { label: 'Frais annexes', sens: 'sortie' },
  loyer: { label: 'Loyer', sens: 'sortie' },
  achat_materiel: { label: 'Achat matériel', sens: 'sortie' },
  salaire: { label: 'Salaire', sens: 'sortie' },
  avance_salaire: { label: 'Avance sur salaire', sens: 'sortie' },
  transfert_interne: { label: 'Transfert interne (sortie)', sens: 'sortie' },
  remboursement_dette_fournisseur: { label: 'Remboursement dette fournisseur', sens: 'entree' },
  autre_entree: { label: 'Autre entrée', sens: 'entree' },
  autre_sortie: { label: 'Autre sortie', sens: 'sortie' },
};

const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement' },
];

const ENTREE_TYPES: TypeMouvementCaisse[] = ['paiement_note_debit', 'entree_client', 'remboursement_dette_fournisseur', 'autre_entree'];
const SORTIE_TYPES: TypeMouvementCaisse[] = ['achat_rmb', 'frais_annexe', 'loyer', 'achat_materiel', 'salaire', 'avance_salaire', 'transfert_interne', 'autre_sortie'];

function devisRef(d: Pick<DevisPayable, 'id' | 'date_creation'>): string {
  const yy = new Date(d.date_creation).getFullYear().toString().slice(-2);
  return `SA${yy}${String(d.id).padStart(3, '0')}`;
}

function clientLabel(d: DevisPayable): string {
  const c = d.client;
  if (!c) return '';
  return c.pseudo ?? [c.prenom, c.nom].filter(Boolean).join(' ') ?? '';
}

function devisMontantMga(d: DevisPayable): number | null {
  if (!d.taux_change_vendu || !d.achat_articles?.length) return null;
  const sousTotalRmb = d.achat_articles.reduce(
    (sum, a) => sum + (a.prix_unitaire_rmb ?? 0) * a.quantite,
    0
  );
  if (sousTotalRmb === 0) return null;
  const totalRmb = sousTotalRmb + (d.frais_port_locaux_rmb ?? 0);
  return Math.round(totalRmb * d.taux_change_vendu);
}

interface MouvementFormProps {
  caisseId: number;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MouvementForm({ caisseId, isAdmin, onClose, onSuccess }: MouvementFormProps) {
  const [direction, setDirection] = useState<'entree' | 'sortie'>('entree');
  const [type, setType] = useState<TypeMouvementCaisse>('paiement_note_debit');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');
  const [dateMouvement, setDateMouvement] = useState(new Date().toISOString().split('T')[0]);

  const [montantRmb, setMontantRmb] = useState('');
  const [tauxRmb, setTauxRmb] = useState('');
  const [compteAlipayId, setCompteAlipayId] = useState<number | null>(null);

  const [noteDebitId, setNoteDebitId] = useState<number | null>(null);
  const [searchNd, setSearchNd] = useState('');
  const [ndFocused, setNdFocused] = useState(false);

  const [employeId, setEmployeId] = useState('');
  const [notesAvance, setNotesAvance] = useState('');

  // Transfert interne: destination type + IDs
  const [transfertDestType, setTransfertDestType] = useState<'meme_caisse' | 'autre_caisse' | 'banque'>('meme_caisse');
  const [compteBancaireId, setCompteBancaireId] = useState<number | null>(null);
  const [caisseDestinationId, setCaisseDestinationId] = useState<number | null>(null);
  // Modes source/destination pour les transferts internes
  const [modePaiementSource, setModePaiementSource] = useState<ModePaiement>('especes');
  const [modePaiementDest, setModePaiementDest] = useState<ModePaiement>('cheque');

  // Banque de destination pour paiement par virement
  const [virementBancaireId, setVirementBancaireId] = useState<number | null>(null);

  const [tiersNom, setTiersNom] = useState('');

  const [demandeAchatId, setDemandeAchatId] = useState<number | null>(null);
  const [searchDevis, setSearchDevis] = useState('');

  const [detteFournisseurId, setDetteFournisseurId] = useState<number | null>(null);
  const [searchDette, setSearchDette] = useState('');

  // Chèque — champs supplémentaires quand mode_paiement = cheque
  const [chequeNumero, setChequeNumero] = useState('');
  const [chequeEcheance, setChequeEcheance] = useState('');

  // Chèque à verser lors d'un transfert interne vers banque
  const [chequeAVerserId, setChequeAVerserId] = useState<number | null>(null);
  const [searchChequeAVerser, setSearchChequeAVerser] = useState('');

  const createMouvement = useCreateMouvementCaisse();
  const createMouvBancaire = useCreateMouvementBancaire();
  const createCheque = useCreateCheque();
  const verserChequeBancaire = useVerserChequeViaBancaire();
  const createAvance = useCreateAvanceSalaire();
  const marquerPayee = useMarquerNoteDebitPayee();
  const marquerDevisPayé = useMarquerDevisPayé();
  const { data: notesDebitNonPayees = [] } = useNotesDebitNonPayees();
  const { data: caissesActives = [] } = useCaissesActives();
  const { data: comptesBancaires = [] } = useComptesBancairesActifs();
  const { data: employees = [] } = useAllEmployees();
  const { data: devisPayables = [] } = useDevisPayables();
  const { data: dettesFournisseur = [] } = useDettesFournisseurRemboursables();
  const { data: comptesAlipay = [] } = useComptesAlipay();
  const { data: chequesEnAttente = [] } = useChequesEnAttente();

  const caissesDestination = caissesActives.filter(c => c.id !== caisseId);
  const comptesBancairesVisibles = comptesBancaires;

  const sens = TYPE_LABELS[type].sens;

  useEffect(() => {
    const types = direction === 'entree' ? ENTREE_TYPES : SORTIE_TYPES;
    if (!types.includes(type)) setType(types[0]);
  }, [direction]);

  useEffect(() => {
    setNoteDebitId(null);
    setSearchNd('');
    setEmployeId('');
    setCompteBancaireId(null);
    setCaisseDestinationId(null);
    setMontantRmb('');
    setTauxRmb('');
    setDescription('');
    setTiersNom('');
    setDemandeAchatId(null);
    setSearchDevis('');
    setDetteFournisseurId(null);
    setSearchDette('');
    setModePaiementSource('especes');
    setModePaiementDest('cheque');
    setTransfertDestType('meme_caisse');
    setChequeNumero('');
    setChequeEcheance('');
    setChequeAVerserId(null);
    setSearchChequeAVerser('');
  }, [type]);

  useEffect(() => {
    setVirementBancaireId(null);
    setChequeNumero('');
    setChequeEcheance('');
  }, [modePaiement]);

  // Reset destination IDs when destination type toggles
  useEffect(() => {
    setCompteBancaireId(null);
    setCaisseDestinationId(null);
    setChequeAVerserId(null);
    setSearchChequeAVerser('');
  }, [transfertDestType]);

  // Reset selected cheque when source mode changes (transfert→banque)
  useEffect(() => {
    setChequeAVerserId(null);
    setSearchChequeAVerser('');
  }, [modePaiementSource]);

  const filteredNd = notesDebitNonPayees.filter(n => {
    const q = searchNd.toLowerCase();
    return (
      n.reference.toLowerCase().includes(q) ||
      (n.client_pseudo ?? '').toLowerCase().includes(q) ||
      (n.client_nom ?? '').toLowerCase().includes(q)
    );
  });

  const selectedNd = notesDebitNonPayees.find(n => n.id === noteDebitId);

  const handleSelectNd = (nd: typeof notesDebitNonPayees[0]) => {
    setNoteDebitId(nd.id);
    const total = Number(nd.montant_total_ariary) + Number(nd.frais_livraison_ariary ?? 0);
    const dejaPaye = Number(nd.total_paye ?? 0);
    const restant = total - dejaPaye;
    setMontant(String(restant > 0 ? restant : total));
    setDescription(`Paiement note de débit ${nd.reference} - ${nd.client_pseudo ?? nd.client_nom ?? ''}`);
    setSearchNd('');
    setNdFocused(false);
  };

  const filteredDevis = devisPayables.filter(d => {
    const q = searchDevis.toLowerCase();
    return (
      devisRef(d).toLowerCase().includes(q) ||
      d.nom_article.toLowerCase().includes(q) ||
      clientLabel(d).toLowerCase().includes(q)
    );
  });

  const selectedDevis = devisPayables.find(d => d.id === demandeAchatId);

  const handleSelectDevis = (d: DevisPayable) => {
    setDemandeAchatId(d.id);
    setTiersNom(clientLabel(d));
    setDescription(`Règlement devis ${devisRef(d)} — ${d.nom_article}`);
    const montantCalculé = devisMontantMga(d);
    if (montantCalculé !== null) setMontant(String(montantCalculé));
    setSearchDevis('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (type === 'paiement_note_debit' && !noteDebitId) {
      toast.error('Veuillez sélectionner une note de débit');
      return;
    }
    if (type === 'avance_salaire' && !employeId) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }
    if (type === 'transfert_interne') {
      if (transfertDestType === 'meme_caisse' && modePaiementSource === modePaiementDest) {
        toast.error('Le mode source et le mode destination doivent être différents');
        return;
      }
      if (transfertDestType === 'autre_caisse' && !caisseDestinationId) {
        toast.error('Veuillez sélectionner une caisse de destination');
        return;
      }
      if (transfertDestType === 'banque' && !compteBancaireId) {
        toast.error('Veuillez sélectionner un compte bancaire de destination');
        return;
      }
      if (transfertDestType === 'banque' && modePaiementSource === 'cheque' && !chequeAVerserId) {
        toast.error('Veuillez sélectionner le chèque à verser');
        return;
      }
    }
    if (modePaiement === 'virement' && type !== 'transfert_interne' && !virementBancaireId) {
      toast.error('Veuillez sélectionner la banque de destination du virement');
      return;
    }
    if (type === 'remboursement_dette_fournisseur' && !detteFournisseurId) {
      toast.error('Veuillez sélectionner la dette fournisseur à rembourser');
      return;
    }
    // For transfert_interne use dedicated source mode, otherwise use the regular mode
    const effectiveMode = type === 'transfert_interne' ? modePaiementSource : modePaiement;

    if (effectiveMode === 'cheque' && type !== 'transfert_interne' && sens === 'entree') {
      if (!chequeNumero.trim()) { toast.error('Numéro de chèque requis'); return; }
      if (!chequeEcheance) { toast.error('Date d\'échéance du chèque requise'); return; }
    }

    try {
      const virementBanque = modePaiement === 'virement' && type !== 'transfert_interne'
        ? comptesBancaires.find(c => c.id === virementBancaireId)
        : null;

      const modeLabel = (m: ModePaiement) =>
        ({ especes: 'Espèces', cheque: 'Chèque', virement: 'Virement', mvola: 'MVola', orange_money: 'Orange Money' }[m]);

      const autoDesc = (() => {
        if (type !== 'transfert_interne') {
          return virementBanque ? `Virement vers ${virementBanque.nom} — ${virementBanque.banque}` : TYPE_LABELS[type].label;
        }
        if (transfertDestType === 'meme_caisse') {
          return `Transfert ${modeLabel(modePaiementSource)} → ${modeLabel(modePaiementDest)}`;
        }
        if (transfertDestType === 'autre_caisse') {
          const destNom = caissesActives.find(c => c.id === caisseDestinationId)?.nom ?? '';
          return `Transfert vers ${destNom} (${modeLabel(modePaiementSource)} → ${modeLabel(modePaiementDest)})`;
        }
        const banqueNom = comptesBancaires.find(c => c.id === compteBancaireId)?.nom ?? '';
        return `Dépôt ${modeLabel(modePaiementSource)} → Banque ${banqueNom}`;
      })();

      const payload = {
        caisse_id: caisseId,
        type_mouvement: type,
        sens,
        montant_mga: Number(montant),
        mode_paiement: effectiveMode,
        mode_paiement_destination: type === 'transfert_interne' && transfertDestType !== 'banque' ? modePaiementDest : null,
        description: description || autoDesc,
        date_mouvement: dateMouvement,
        note_debit_id: type === 'paiement_note_debit' ? noteDebitId : null,
        demande_achat_id: type === 'entree_client' ? demandeAchatId : null,
        employe_beneficiaire_id: type === 'avance_salaire' ? employeId : null,
        compte_bancaire_id: type === 'transfert_interne' && transfertDestType === 'banque'
          ? compteBancaireId
          : virementBancaireId,
        caisse_destination_id: type === 'transfert_interne' && transfertDestType === 'autre_caisse' ? caisseDestinationId : null,
        montant_rmb: type === 'achat_rmb' && montantRmb ? Number(montantRmb) : null,
        taux_rmb_mga: type === 'achat_rmb' && tauxRmb ? Number(tauxRmb) : null,
        tiers_nom: tiersNom.trim() || null,
        dette_fournisseur_id: type === 'remboursement_dette_fournisseur' ? detteFournisseurId : null,
      };

      const mouvement = await createMouvement.mutateAsync(payload);

      // Créer le mouvement bancaire lié au virement IMMÉDIATEMENT après le
      // mouvement de caisse, et avant toute autre opération. Si cette création
      // échoue, on annule le mouvement de caisse pour ne pas laisser d'entrée
      // orpheline pointant vers un compte bancaire sans mouvement bancaire.
      if (modePaiement === 'virement' && type !== 'transfert_interne' && virementBancaireId) {
        try {
          await createMouvBancaire.mutateAsync({
            compte_bancaire_id: virementBancaireId,
            type_mouvement: 'virement_entrant',
            sens: 'entree',
            montant: Number(montant),
            description: payload.description,
            mode_paiement: 'virement_recu',
            mouvement_caisse_id: mouvement.id,
            date_mouvement: dateMouvement,
          });
        } catch (banqueErr) {
          // Rollback: annuler le mouvement de caisse pour éviter une entrée orpheline
          const { error: rollbackErr } = await supabase
            .from('mouvements_caisse')
            .update({ est_annule: true })
            .eq('id', mouvement.id);
          if (rollbackErr) {
            throw new Error('Le mouvement bancaire n\'a pas pu être créé ET l\'annulation du mouvement de caisse a échoué. Le mouvement de caisse #' + mouvement.id + ' est orphelin — contactez un administrateur.');
          }
          throw new Error('Le mouvement bancaire n\'a pas pu être créé. Le mouvement de caisse a été annulé. Veuillez réessayer.');
        }
      }

      // Créer un mouvement Alipay (approvisionnement) si un compte Alipay a été sélectionné
      if (type === 'achat_rmb' && compteAlipayId && montantRmb && tauxRmb) {
        await mouvementAlipayService.create({
          compte_alipay_id: compteAlipayId,
          type_mouvement: 'approvisionnement',
          sens: 'entree',
          montant_rmb: Number(montantRmb),
          taux_rmb_mga: Number(tauxRmb),
          date_mouvement: dateMouvement,
          caisse_mouvement_id: mouvement.id,
          description: description,
        });
      }

      if (type === 'paiement_note_debit' && noteDebitId) {
        await marquerPayee.mutateAsync({ noteDebitId, mouvementCaisseId: mouvement.id, modePaiement });
      }

      // Créer un chèque reçu (entrée) si le mode de paiement est chèque
      // (hors transfert interne et uniquement pour les entrées — les sorties
      // par chèque sont des chèques émis, non suivis dans cet onglet)
      if (effectiveMode === 'cheque' && type !== 'transfert_interne' && sens === 'entree') {
        const payeurNom = tiersNom.trim()
          || (type === 'paiement_note_debit' && selectedNd ? (selectedNd.client_pseudo ?? selectedNd.client_nom ?? '') : '')
          || '';
        await createCheque.mutateAsync({
          numero_cheque: chequeNumero.trim(),
          montant_mga: Number(montant),
          payeur: payeurNom || 'N/A',
          date_reception: dateMouvement,
          date_echeance: chequeEcheance,
          description: description || undefined,
          note_debit_id: type === 'paiement_note_debit' ? noteDebitId : null,
          mouvement_caisse_id: mouvement.id,
        });
      }

      if (type === 'entree_client' && demandeAchatId) {
        await marquerDevisPayé.mutateAsync(demandeAchatId);
      }

      if (type === 'avance_salaire' && employeId) {
        await createAvance.mutateAsync({
          employe_id: employeId,
          montant_mga: Number(montant),
          notes: notesAvance || undefined,
          mouvement_caisse_id: mouvement.id,
          date_avance: dateMouvement,
        });
      }

      if (type === 'transfert_interne') {
        const sourceNom = caissesActives.find(c => c.id === caisseId)?.nom ?? '';

        if (transfertDestType === 'meme_caisse') {
          // Intra-caisse: create entry in same caisse with destination mode
          await createMouvement.mutateAsync({
            caisse_id: caisseId,
            type_mouvement: 'transfert_interne',
            sens: 'entree',
            montant_mga: Number(montant),
            mode_paiement: modePaiementDest,
            mode_paiement_destination: modePaiementSource,
            description: description || `Transfert reçu ${modeLabel(modePaiementSource)} → ${modeLabel(modePaiementDest)}`,
            tiers_nom: sourceNom,
            caisse_destination_id: caisseId,
            date_mouvement: dateMouvement,
          });
        } else if (transfertDestType === 'autre_caisse' && caisseDestinationId) {
          // Cross-caisse: create entry in destination caisse with destination mode
          await createMouvement.mutateAsync({
            caisse_id: caisseDestinationId,
            type_mouvement: 'transfert_interne',
            sens: 'entree',
            montant_mga: Number(montant),
            mode_paiement: modePaiementDest,
            mode_paiement_destination: modePaiementSource,
            description: description || `Transfert reçu de ${sourceNom} (${modeLabel(modePaiementSource)} → ${modeLabel(modePaiementDest)})`,
            tiers_nom: sourceNom,
            caisse_destination_id: caisseId,
            date_mouvement: dateMouvement,
          });
        } else if (transfertDestType === 'banque' && compteBancaireId) {
          // To bank: if a cheque was selected, use the atomic RPC to create
          // the bank movement AND mark the cheque as versé in one operation.
          // For non-cheque transfers (espèces etc.), still create the bank
          // movement the old way. If either path fails, roll back the caisse
          // movement so we don't leave an orphaned debit.
          try {
            if (modePaiementSource === 'cheque' && chequeAVerserId) {
              const selectedCheque = chequesEnAttente.find(c => c.id === chequeAVerserId);
              await verserChequeBancaire.mutateAsync({
                chequeId: chequeAVerserId,
                compteBancaireId,
                dateVersement: dateMouvement,
                mouvementCaisseId: mouvement.id,
                description: description || (selectedCheque
                  ? `Dépôt chèque n°${selectedCheque.numero_cheque} — ${selectedCheque.payeur} depuis caisse`
                  : `Dépôt chèque depuis caisse`),
              });
              toast.success(`Chèque n°${selectedCheque?.numero_cheque ?? ''} versé en banque`);
            } else {
              await createMouvBancaire.mutateAsync({
                compte_bancaire_id: compteBancaireId,
                type_mouvement: 'versement_caisse',
                sens: 'entree',
                montant: Number(montant),
                mode_paiement: modePaiementSource === 'cheque' ? 'depot_cheque' : 'depot_especes',
                description: description || `Dépôt ${modeLabel(modePaiementSource)} depuis caisse`,
                mouvement_caisse_id: mouvement.id,
                date_mouvement: dateMouvement,
              });
            }
          } catch (banqueErr) {
            const { error: rollbackErr } = await supabase
              .from('mouvements_caisse')
              .update({ est_annule: true })
              .eq('id', mouvement.id);
            if (rollbackErr) {
              throw new Error('Le versement en banque a échoué ET l\'annulation du mouvement de caisse a échoué. Le mouvement de caisse #' + mouvement.id + ' est orphelin — contactez un administrateur.');
            }
            throw new Error('Le versement en banque a échoué. Le mouvement de caisse a été annulé. Veuillez réessayer.');
          }
        }
      }

      toast.success('Mouvement enregistré');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    }
  };

  const isLoading = createMouvement.isPending || createAvance.isPending || createMouvBancaire.isPending || marquerDevisPayé.isPending || createCheque.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau mouvement de caisse</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Direction buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection('entree')}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                direction === 'entree'
                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600'
              }`}
            >
              ↑ Entrée
            </button>
            <button
              type="button"
              onClick={() => setDirection('sortie')}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                direction === 'sortie'
                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'
              }`}
            >
              ↓ Sortie
            </button>
          </div>

          {/* Type dropdown filtered by direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as TypeMouvementCaisse)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(direction === 'entree' ? ENTREE_TYPES : SORTIE_TYPES).map(k => (
                <option key={k} value={k}>{TYPE_LABELS[k].label}</option>
              ))}
            </select>
          </div>

          {/* Devis (entree_client) */}
          {type === 'entree_client' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                  Devis associé
                  <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                </span>
              </label>
              {selectedDevis ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-800">{devisRef(selectedDevis)}</p>
                    <p className="text-xs text-blue-600 truncate">{selectedDevis.nom_article} — {clientLabel(selectedDevis)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDemandeAchatId(null); setTiersNom(''); setDescription(''); }}
                    className="text-blue-400 hover:text-blue-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchDevis}
                      onChange={e => setSearchDevis(e.target.value)}
                      placeholder="Rechercher par réf. SA…, article ou client..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {searchDevis && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                      {filteredDevis.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500 text-center">Aucun devis en attente de règlement</p>
                      ) : filteredDevis.map(d => {
                        const montantD = devisMontantMga(d);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleSelectDevis(d)}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800">{devisRef(d)}</p>
                              {montantD !== null ? (
                                <span className="text-sm font-semibold text-green-700 flex-shrink-0">{montantD.toLocaleString('fr-MG')} Ar</span>
                              ) : (
                                <span className="text-xs text-gray-400 flex-shrink-0">Prix non défini</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{d.nom_article} — {clientLabel(d)}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {devisPayables.length === 0 && !searchDevis && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Aucun devis au statut "Devis Prêt"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dette fournisseur (remboursement_dette_fournisseur) */}
          {type === 'remboursement_dette_fournisseur' && (() => {
            const selectedDette = dettesFournisseur.find(d => d.id === detteFournisseurId);
            const filteredDettes = dettesFournisseur.filter(d => {
              const q = searchDette.toLowerCase();
              return (
                d.reference.toLowerCase().includes(q) ||
                (d.client?.pseudo ?? '').toLowerCase().includes(q) ||
                (d.client?.nom ?? '').toLowerCase().includes(q)
              );
            });
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                    Référence dette fournisseur <span className="text-red-500">*</span>
                  </span>
                </label>
                {selectedDette ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-800">{selectedDette.reference}</p>
                        <p className="text-xs text-blue-600">
                          {selectedDette.client?.pseudo} — {selectedDette.description}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">
                          Restant : {(Number(selectedDette.montant_mga_equivalent) - Number(selectedDette.montant_rembourse_mga)).toLocaleString('fr-MG')} Ar
                        </p>
                      </div>
                      <button type="button" onClick={() => { setDetteFournisseurId(null); setMontant(''); setDescription(''); }} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={searchDette}
                        onChange={e => setSearchDette(e.target.value)}
                        placeholder="Rechercher par référence DF-… ou client…"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {searchDette && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                        {filteredDettes.length === 0 ? (
                          <p className="p-3 text-sm text-gray-500 text-center">Aucune dette trouvée</p>
                        ) : filteredDettes.map(d => {
                          const restant = Number(d.montant_mga_equivalent) - Number(d.montant_rembourse_mga);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setDetteFournisseurId(d.id);
                                setMontant(String(Math.round(restant)));
                                setDescription(`Remboursement ${d.reference} — ${d.client?.pseudo ?? ''}`);
                                setTiersNom(d.client?.pseudo ?? '');
                                setSearchDette('');
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800">{d.reference}</p>
                                <span className="text-sm font-semibold text-green-700 flex-shrink-0">{restant.toLocaleString('fr-MG')} Ar</span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{d.client?.pseudo} — {d.description}</p>
                              <p className="text-xs text-gray-400">{Number(d.montant_usd).toFixed(2)} USD · taux {Number(d.taux_usd_mga).toLocaleString('fr-MG')}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {dettesFournisseur.length === 0 && !searchDette && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Aucune dette fournisseur en attente de remboursement
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Provenance / Bénéficiaire pour les types sans tiers structuré */}
          {!['avance_salaire', 'transfert_interne', 'paiement_note_debit', 'remboursement_dette_fournisseur'].includes(type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {sens === 'entree' ? 'Provenance' : 'Bénéficiaire'}
                <span className="ml-1 text-xs font-normal text-gray-400">(optionnel)</span>
              </label>
              <input
                type="text"
                value={tiersNom}
                onChange={e => setTiersNom(e.target.value)}
                placeholder={sens === 'entree' ? 'Nom de la personne ou entité qui verse...' : 'Nom de la personne ou entité qui reçoit...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Note de débit */}
          {type === 'paiement_note_debit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note de débit à encaisser</label>
              {selectedNd ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-800">{selectedNd.reference}</p>
                    <p className="text-xs text-blue-600">{selectedNd.client_pseudo ?? selectedNd.client_nom}</p>
                    {selectedNd.statut_paiement === 'partielle' && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Partiellement payée — Restant : {(Number(selectedNd.montant_total_ariary) + Number(selectedNd.frais_livraison_ariary ?? 0) - Number(selectedNd.total_paye ?? 0)).toLocaleString('fr-MG')} Ar
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => { setNoteDebitId(null); setMontant(''); setDescription(''); }} className="text-blue-400 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchNd}
                      onChange={e => setSearchNd(e.target.value)}
                      onFocus={() => setNdFocused(true)}
                      onBlur={() => setTimeout(() => setNdFocused(false), 150)}
                      placeholder="Rechercher par référence ou pseudo client..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {(searchNd || ndFocused) && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y shadow-sm">
                      {filteredNd.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500 text-center">Aucune note de débit en attente de paiement</p>
                      ) : filteredNd.slice(0, 10).map(nd => {
                        const total = Number(nd.montant_total_ariary) + Number(nd.frais_livraison_ariary ?? 0);
                        const dejaPaye = Number(nd.total_paye ?? 0);
                        const restant = total - dejaPaye;
                        return (
                          <button
                            key={nd.id}
                            type="button"
                            onClick={() => handleSelectNd(nd)}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800">{nd.reference}</p>
                              {nd.statut_paiement === 'partielle' ? (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">Partielle</span>
                              ) : (
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">Impayée</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{nd.client_pseudo ?? nd.client_nom}</p>
                            {nd.statut_paiement === 'partielle' ? (
                              <p className="text-xs text-amber-600">Restant : {restant.toLocaleString('fr-MG')} Ar / {total.toLocaleString('fr-MG')} Ar</p>
                            ) : (
                              <p className="text-xs text-gray-400">{total.toLocaleString('fr-MG')} Ar</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {notesDebitNonPayees.length === 0 && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Aucune note de débit en attente de paiement
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Achat RMB */}
          {type === 'achat_rmb' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant RMB ¥</label>
                  <input
                    type="number" step="0.01" value={montantRmb}
                    onChange={e => setMontantRmb(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux RMB/MGA</label>
                  <input
                    type="number" step="0.01" value={tauxRmb}
                    onChange={e => {
                      setTauxRmb(e.target.value);
                      if (montantRmb && e.target.value) {
                        setMontant(String(Math.round(Number(montantRmb) * Number(e.target.value))));
                      }
                    }}
                    placeholder="ex: 660"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte Alipay à approvisionner <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <select
                  value={compteAlipayId ?? ''}
                  onChange={e => setCompteAlipayId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">— Ne pas approvisionner de compte Alipay —</option>
                  {comptesAlipay.filter(c => c.est_actif).map(compte => (
                    <option key={compte.id} value={compte.id}>
                      {compte.nom}{compte.responsable ? ` (${compte.responsable.full_name ?? compte.responsable.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Avance salaire */}
          {type === 'avance_salaire' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé bénéficiaire</label>
                <select
                  value={employeId}
                  onChange={e => setEmployeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un employé...</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.full_name ?? emp.email ?? emp.user_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <input
                  value={notesAvance}
                  onChange={e => setNotesAvance(e.target.value)}
                  placeholder="Motif de l'avance..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Transfert interne — destination + modes source/dest */}
          {type === 'transfert_interne' && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

              {/* 3-way destination toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de transfert</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: 'meme_caisse', icon: <Wallet className="w-3.5 h-3.5" />, label: 'Même caisse' },
                    { value: 'autre_caisse', icon: <ArrowRight className="w-3.5 h-3.5" />, label: 'Autre caisse' },
                    { value: 'banque', icon: <Building2 className="w-3.5 h-3.5" />, label: 'Banque' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setTransfertDestType(opt.value); setCompteBancaireId(null); setCaisseDestinationId(null); }}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        transfertDestType === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode source + mode destination (not shown for banque dest) */}
              {transfertDestType !== 'banque' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poche source <ArrowRight className="inline w-3 h-3 mx-1 text-gray-400" /> Poche destination
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-gray-500 font-medium">De</p>
                      <div className="grid grid-cols-2 gap-1">
                        {(['especes', 'cheque'] as ModePaiement[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setModePaiementSource(m)}
                            className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                              modePaiementSource === m
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
                            }`}
                          >
                            {m === 'especes' ? 'Espèces' : 'Chèque'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-4" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-gray-500 font-medium">Vers</p>
                      <div className="grid grid-cols-2 gap-1">
                        {(['especes', 'cheque'] as ModePaiement[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setModePaiementDest(m)}
                            className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                              modePaiementDest === m
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-green-300'
                            }`}
                          >
                            {m === 'especes' ? 'Espèces' : 'Chèque'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {transfertDestType === 'meme_caisse' && modePaiementSource === modePaiementDest && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5">
                      <AlertCircle className="w-3 h-3" /> Le mode source et destination doivent être différents
                    </p>
                  )}
                </div>
              )}

              {/* Mode source seul pour transfert vers banque */}
              {transfertDestType === 'banque' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode de dépôt</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['especes', 'cheque'] as ModePaiement[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModePaiementSource(m)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          modePaiementSource === m
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {m === 'especes' ? 'Espèces' : 'Chèque'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélecteur autre caisse */}
              {transfertDestType === 'autre_caisse' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caisse destinataire</label>
                  <select
                    value={caisseDestinationId ?? ''}
                    onChange={e => setCaisseDestinationId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Sélectionner une caisse...</option>
                    {caissesDestination.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  {caissesDestination.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">Aucune autre caisse disponible</p>
                  )}
                </div>
              )}

              {/* Sélecteur compte bancaire */}
              {transfertDestType === 'banque' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compte bancaire de destination</label>
                  <select
                    value={compteBancaireId ?? ''}
                    onChange={e => setCompteBancaireId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Sélectionner un compte...</option>
                    {comptesBancairesVisibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nom} — {c.banque} ({c.devise})</option>
                    ))}
                  </select>
                  {comptesBancairesVisibles.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">Aucun compte bancaire actif disponible</p>
                  )}
                </div>
              )}

              {/* Sélecteur de chèque à verser — visible quand transfert vers banque + mode chèque */}
              {transfertDestType === 'banque' && modePaiementSource === 'cheque' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-amber-800">Chèque à verser en banque</span>
                  </div>
                  {chequesEnAttente.length === 0 ? (
                    <p className="text-xs text-amber-600">Aucun chèque en attente. Le dépôt sera enregistré sans chèque associé.</p>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={searchChequeAVerser}
                          onChange={e => setSearchChequeAVerser(e.target.value)}
                          placeholder="Rechercher par n° ou payeur…"
                          className="w-full pl-9 pr-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1.5">
                        {chequesEnAttente
                          .filter(c => {
                            const s = searchChequeAVerser.trim().toLowerCase();
                            if (!s) return true;
                            return c.numero_cheque.toLowerCase().includes(s) || c.payeur.toLowerCase().includes(s);
                          })
                          .map(c => {
                            const overdue = new Date(c.date_echeance) < new Date(new Date().toDateString());
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setChequeAVerserId(c.id);
                                  setMontant(String(c.montant_mga));
                                }}
                                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                                  chequeAVerserId === c.id
                                    ? 'border-amber-500 bg-amber-100'
                                    : 'border-amber-200 bg-white hover:border-amber-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-semibold text-gray-900">n°{c.numero_cheque}</span>
                                  <span className="text-xs font-semibold text-gray-900">{Number(c.montant_mga).toLocaleString('fr-MG')} Ar</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-xs text-gray-500 truncate">{c.payeur}</span>
                                  <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                    Éch. {new Date(c.date_echeance).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                      {chequeAVerserId && (
                        <p className="text-xs text-amber-600">
                          Le chèque passera automatiquement au statut « Versé » après l'enregistrement.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (MGA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" step="1" value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="0"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
            />
            {montant && !isNaN(Number(montant)) && (
              <p className="text-xs text-gray-500 mt-1">{Number(montant).toLocaleString('fr-MG')} Ar</p>
            )}
          </div>

          {/* Mode de paiement — masqué pour transfert_interne (géré dans le bloc ci-dessus) */}
          {type !== 'transfert_interne' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES_PAIEMENT.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setModePaiement(m.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      modePaiement === m.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Champs chèque — visibles quand mode_paiement = cheque pour une entrée (chèque reçu) */}
          {modePaiement === 'cheque' && type !== 'transfert_interne' && sens === 'entree' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-800">Informations du chèque</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Numéro du chèque <span className="text-red-500">*</span></label>
                  <input
                    value={chequeNumero}
                    onChange={e => setChequeNumero(e.target.value)}
                    placeholder="N° du chèque"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">Date d'échéance <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={chequeEcheance}
                    onChange={e => setChequeEcheance(e.target.value)}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-amber-600">Le chèque sera suivi dans l'onglet « Chèques » de la comptabilité.</p>
            </div>
          )}

          {/* Banque de destination — obligatoire si virement (hors transfert interne) */}
          {modePaiement === 'virement' && type !== 'transfert_interne' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <label className="text-sm font-medium text-blue-800">
                  Banque de destination <span className="text-red-500">*</span>
                </label>
              </div>
              <p className="text-xs text-blue-600">
                Le montant sera automatiquement enregistré dans le compte bancaire sélectionné.
              </p>
              <select
                value={virementBancaireId ?? ''}
                onChange={e => setVirementBancaireId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-blue-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Sélectionner un compte bancaire...</option>
                {comptesBancairesVisibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.banque} ({c.devise})
                  </option>
                ))}
              </select>
              {comptesBancairesVisibles.length === 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Aucun compte bancaire actif disponible
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Détail du mouvement..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateMouvement}
              onChange={e => setDateMouvement(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                sens === 'entree' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
