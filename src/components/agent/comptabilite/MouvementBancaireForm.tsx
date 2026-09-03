import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateMouvementBancaire } from '../../../hooks/useComptabilite';
import { TypeMouvementBancaire, ModePaiementBancaire } from '../../../services/comptabiliteService';

const TYPE_LABELS: Record<TypeMouvementBancaire, { label: string; sens: 'entree' | 'sortie' }> = {
  versement_caisse: { label: 'Versement depuis caisse', sens: 'entree' },
  virement_entrant: { label: 'Virement entrant', sens: 'entree' },
  virement_sortant: { label: 'Virement sortant', sens: 'sortie' },
  frais_bancaires: { label: 'Frais bancaires', sens: 'sortie' },
  interets: { label: 'Intérêts créditeurs', sens: 'entree' },
  autre_entree: { label: 'Autre entrée', sens: 'entree' },
  autre_sortie: { label: 'Autre sortie', sens: 'sortie' },
  approvisionnement: { label: 'Approvisionnement', sens: 'sortie' },
};

const TYPES_SORTIE: TypeMouvementBancaire[] = ['virement_sortant', 'frais_bancaires', 'autre_sortie', 'approvisionnement'];

const MODE_OPTIONS: Record<'entree' | 'sortie', { value: ModePaiementBancaire; label: string }[]> = {
  entree: [
    { value: 'depot_especes', label: 'Dépôt espèces' },
    { value: 'depot_cheque', label: 'Dépôt chèque' },
    { value: 'virement_recu', label: 'Virement reçu' },
    { value: 'autre', label: 'Autre' },
  ],
  sortie: [
    { value: 'virement_emis', label: 'Virement émis' },
    { value: 'cheque_emis', label: 'Chèque émis' },
    { value: 'prelevement', label: 'Prélèvement' },
    { value: 'autre', label: 'Autre' },
  ],
};

const REFERENCE_PLACEHOLDER: Partial<Record<ModePaiementBancaire, string>> = {
  depot_cheque: 'N° de chèque',
  cheque_emis: 'N° de chèque',
  virement_recu: 'N° de virement / référence bancaire',
  virement_emis: 'N° de virement / référence bancaire',
  depot_especes: 'N° de bordereau de dépôt',
  prelevement: 'Référence prélèvement',
};

interface MouvementBancaireFormProps {
  compteId: number;
  devise: string;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MouvementBancaireForm({ compteId, devise, isAdmin, onClose, onSuccess }: MouvementBancaireFormProps) {
  const [type, setType] = useState<TypeMouvementBancaire>('virement_entrant');
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiementBancaire | ''>('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [dateMouvement, setDateMouvement] = useState(new Date().toISOString().split('T')[0]);

  const createMouvement = useCreateMouvementBancaire();
  const sens = TYPE_LABELS[type].sens;
  const modeOptions = MODE_OPTIONS[sens];

  const typesDisponibles = (Object.entries(TYPE_LABELS) as [TypeMouvementBancaire, { label: string }][])
    .filter(([k]) => {
      if (k === 'approvisionnement') return false; // géré par le formulaire dédié
      if (k === 'versement_caisse' && devise !== 'MGA') return false;
      if (!isAdmin && TYPES_SORTIE.includes(k)) return false;
      return true;
    });

  const referencePlaceholder = useMemo(() => {
    if (!modePaiement) return 'N° virement, chèque, bordereau…';
    return REFERENCE_PLACEHOLDER[modePaiement] ?? 'Référence (optionnel)';
  }, [modePaiement]);

  const handleTypeChange = (newType: TypeMouvementBancaire) => {
    setType(newType);
    setModePaiement('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      toast.error('Montant invalide');
      return;
    }
    try {
      await createMouvement.mutateAsync({
        compte_bancaire_id: compteId,
        type_mouvement: type,
        sens,
        montant: Number(montant),
        description: description || TYPE_LABELS[type].label,
        reference_externe: reference || null,
        mode_paiement: modePaiement || null,
        date_mouvement: dateMouvement,
      });
      toast.success('Mouvement enregistré');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau mouvement bancaire</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => handleTypeChange(e.target.value as TypeMouvementBancaire)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typesDisponibles.map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className={`text-center py-2 rounded-lg text-sm font-medium ${sens === 'entree' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {sens === 'entree' ? '+ ENTRÉE' : '− SORTIE'}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode de paiement <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <select
              value={modePaiement}
              onChange={e => setModePaiement(e.target.value as ModePaiementBancaire | '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Non précisé —</option>
              {modeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant ({devise}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" step="0.01" value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="0" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modePaiement && REFERENCE_PLACEHOLDER[modePaiement]
                ? REFERENCE_PLACEHOLDER[modePaiement]
                : 'Référence'}
              <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
            </label>
            <input
              value={reference} onChange={e => setReference(e.target.value)}
              placeholder={referencePlaceholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="Détail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date" value={dateMouvement}
              onChange={e => setDateMouvement(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMouvement.isPending}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors ${
                sens === 'entree' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {createMouvement.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
