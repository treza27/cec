import React, { useState, useMemo } from 'react';
import { X, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateApprovisionnementBancaire } from '../../../hooks/useComptabilite';
import { CompteBancaire } from '../../../services/comptabiliteService';

interface ApprovisionnementAgmaFormProps {
  compteSource: CompteBancaire;
  comptesDestination: CompteBancaire[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApprovisionnementAgmaForm({
  compteSource,
  comptesDestination,
  onClose,
  onSuccess,
}: ApprovisionnementAgmaFormProps) {
  const [compteDestId, setCompteDestId] = useState<number>(
    comptesDestination.length > 0 ? comptesDestination[0].id : 0
  );
  const [montantSource, setMontantSource] = useState('');
  const [tauxChange, setTauxChange] = useState('');
  const [description, setDescription] = useState('');
  const [dateMouvement, setDateMouvement] = useState(new Date().toISOString().split('T')[0]);

  const createApprovisionnement = useCreateApprovisionnementBancaire();

  const compteDest = comptesDestination.find(c => c.id === compteDestId);

  const montantDest = useMemo(() => {
    const src = Number(montantSource);
    const taux = Number(tauxChange);
    if (!src || !taux || isNaN(src) || isNaN(taux)) return null;
    return src / taux;
  }, [montantSource, tauxChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const src = Number(montantSource);
    const taux = Number(tauxChange);
    if (!src || src <= 0 || !taux || taux <= 0) {
      toast.error('Montant et taux de change requis et positifs');
      return;
    }
    if (!compteDestId || !compteDest) {
      toast.error('Compte de destination invalide');
      return;
    }
    try {
      await createApprovisionnement.mutateAsync({
        compte_source_id: compteSource.id,
        compte_destination_id: compteDestId,
        montant_source: src,
        montant_destination: Number(montantDest?.toFixed(2) ?? 0),
        taux_change: taux,
        description: description || `Approvisionnement ${compteSource.nom} → ${compteDest.nom}`,
        date_mouvement: dateMouvement,
      });
      toast.success('Approvisionnement enregistré');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <RefreshCw className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Approvisionnement inter-banques</h2>
              <p className="text-xs text-gray-500">Conversion MGA → devises étrangères</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Comptes source → destination */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">Compte source (sortie)</p>
                <p className="text-sm font-semibold text-gray-900">{compteSource.nom}</p>
                <p className="text-xs text-gray-500">{compteSource.banque} · {compteSource.devise}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">Compte destination (entrée)</p>
                {comptesDestination.length > 1 ? (
                  <select
                    value={compteDestId}
                    onChange={e => setCompteDestId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-center"
                  >
                    {comptesDestination.map(c => (
                      <option key={c.id} value={c.id}>{c.nom} ({c.devise})</option>
                    ))}
                  </select>
                ) : compteDest ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{compteDest.nom}</p>
                    <p className="text-xs text-gray-500">{compteDest.banque} · {compteDest.devise}</p>
                  </>
                ) : (
                  <p className="text-xs text-red-500">Aucun compte disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Montant MGA débité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant débité ({compteSource.devise}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" step="1" value={montantSource}
              onChange={e => setMontantSource(e.target.value)}
              placeholder="0"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
            />
            {montantSource && !isNaN(Number(montantSource)) && (
              <p className="text-xs text-gray-500 mt-1">{Number(montantSource).toLocaleString('fr-MG')} {compteSource.devise}</p>
            )}
          </div>

          {/* Taux de change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux de change (1 {compteDest?.devise ?? '?'} = ? {compteSource.devise}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" step="0.0001" value={tauxChange}
              onChange={e => setTauxChange(e.target.value)}
              placeholder="ex: 4500"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ex : si 1 USD = 4 500 MGA, saisir 4500
            </p>
          </div>

          {/* Récapitulatif montant destination */}
          {montantDest !== null && compteDest && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-medium text-green-700 mb-1">Montant crédité sur {compteDest.nom}</p>
              <p className="text-2xl font-bold text-green-800 font-mono">
                {montantDest.toLocaleString('fr-MG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {compteDest.devise}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {Number(montantSource).toLocaleString('fr-MG')} {compteSource.devise} ÷ {Number(tauxChange).toLocaleString('fr-MG')} = {montantDest.toFixed(4)} {compteDest.devise}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={compteDest ? `Approvisionnement ${compteSource.nom} → ${compteDest.nom}` : 'Description...'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date */}
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
              disabled={createApprovisionnement.isPending || !montantDest || comptesDestination.length === 0}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {createApprovisionnement.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              Valider l'approvisionnement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
