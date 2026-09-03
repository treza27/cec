import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCreateMouvementAlipay,
  useDevisPayables,
} from '../../../hooks/useComptabilite';
import { TypeMouvementAlipay, DevisPayable } from '../../../services/comptabiliteService';

const TYPE_LABELS: Record<TypeMouvementAlipay, { label: string; sens: 'entree' | 'sortie' }> = {
  approvisionnement:    { label: 'Approvisionnement (entrée RMB)', sens: 'entree' },
  achat_fournisseur:    { label: 'Achat fournisseur (sortie RMB)', sens: 'sortie' },
  autre_entree:         { label: 'Autre entrée RMB', sens: 'entree' },
  autre_sortie:         { label: 'Autre sortie RMB', sens: 'sortie' },
};

function devisRef(d: Pick<DevisPayable, 'id' | 'date_creation'>): string {
  const yy = new Date(d.date_creation).getFullYear().toString().slice(-2);
  return `SA${yy}${String(d.id).padStart(3, '0')}`;
}

function clientLabel(d: DevisPayable): string {
  const c = d.client;
  if (!c) return '';
  return c.pseudo ?? [c.prenom, c.nom].filter(Boolean).join(' ') ?? '';
}

interface Props {
  compteAlipayId: number;
  compteNom: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AlipayMouvementForm({ compteAlipayId, compteNom, onClose, onSuccess }: Props) {
  const [type, setType] = useState<TypeMouvementAlipay>('achat_fournisseur');
  const [montantRmb, setMontantRmb] = useState('');
  const [tauxRmbMga, setTauxRmbMga] = useState('');
  const [description, setDescription] = useState('');
  const [tiersNom, setTiersNom] = useState('');
  const [referenceExterne, setReferenceExterne] = useState('');
  const [dateMouvement, setDateMouvement] = useState(new Date().toISOString().split('T')[0]);
  const [demandeAchatId, setDemandeAchatId] = useState<number | null>(null);
  const [searchDevis, setSearchDevis] = useState('');
  const [devisFocused, setDevisFocused] = useState(false);

  const createMouvement = useCreateMouvementAlipay();
  const { data: devisPayables = [] } = useDevisPayables();

  const sens = TYPE_LABELS[type].sens;

  useEffect(() => {
    setDemandeAchatId(null);
    setSearchDevis('');
    setTiersNom('');
    setDescription('');
    setMontantRmb('');
    setTauxRmbMga('');
    setReferenceExterne('');
  }, [type]);

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
    setTiersNom('');
    const totalRmb = d.achat_articles.reduce(
      (sum, a) => sum + (a.prix_unitaire_rmb ?? 0) * a.quantite,
      0
    ) + (d.frais_port_locaux_rmb ?? 0);
    if (totalRmb > 0) setMontantRmb(String(totalRmb));
    setDescription(`Achat fournisseur — ${d.nom_article} (${devisRef(d)})`);
    setSearchDevis('');
    setDevisFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rmb = Number(montantRmb);
    if (!montantRmb || isNaN(rmb) || rmb <= 0) {
      toast.error('Montant RMB invalide');
      return;
    }

    try {
      const autoDesc = TYPE_LABELS[type].label;
      await createMouvement.mutateAsync({
        compte_alipay_id: compteAlipayId,
        type_mouvement: type,
        sens,
        montant_rmb: rmb,
        taux_rmb_mga: tauxRmbMga ? Number(tauxRmbMga) : null,
        demande_achat_id: type === 'achat_fournisseur' ? demandeAchatId : null,
        tiers_nom: tiersNom.trim() || null,
        description: description.trim() || autoDesc,
        reference_externe: referenceExterne.trim() || null,
        date_mouvement: dateMouvement,
      });
      toast.success('Mouvement Alipay enregistré');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouveau mouvement Alipay</h2>
            <p className="text-xs text-gray-400 mt-0.5">{compteNom}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as TypeMouvementAlipay)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(Object.entries(TYPE_LABELS) as [TypeMouvementAlipay, { label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className={`text-center py-2 rounded-lg text-sm font-medium ${sens === 'entree' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {sens === 'entree' ? '+ ENTRÉE Alipay ¥' : '− SORTIE Alipay ¥'}
          </div>

          {/* Devis lié (achat_fournisseur) */}
          {type === 'achat_fournisseur' && (
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
                    <p className="text-xs text-blue-600">{selectedDevis.nom_article} — <span className="font-medium">Client :</span> {clientLabel(selectedDevis)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDemandeAchatId(null); setTiersNom(''); setDescription(''); }}
                    className="p-1 rounded hover:bg-blue-100 text-blue-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Référence, article ou client..."
                      value={searchDevis}
                      onChange={e => setSearchDevis(e.target.value)}
                      onFocus={() => setDevisFocused(true)}
                      onBlur={() => setTimeout(() => setDevisFocused(false), 200)}
                      className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
                    />
                  </div>
                  {devisFocused && filteredDevis.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-48 overflow-y-auto">
                      {filteredDevis.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={() => handleSelectDevis(d)}
                          className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                        >
                          <span className="font-mono text-xs font-semibold text-blue-700 mt-0.5 flex-shrink-0">{devisRef(d)}</span>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 truncate">{d.nom_article}</p>
                            <p className="text-xs text-gray-500">{clientLabel(d)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {devisFocused && filteredDevis.length === 0 && searchDevis.trim() && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 px-4 py-3">
                      <p className="text-sm text-gray-500">Aucun devis trouvé</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Montant RMB */}
          <div className={`grid gap-3 ${(type === 'approvisionnement') ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant RMB ¥ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montantRmb}
                onChange={e => setMontantRmb(e.target.value)}
                placeholder="0.00"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {type === 'approvisionnement' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux RMB/MGA
                  <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tauxRmbMga}
                  onChange={e => setTauxRmbMga(e.target.value)}
                  placeholder="ex: 660"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {montantRmb && Number(montantRmb) > 0 && (
            <div className="text-right">
              <span className={`text-base font-bold ${sens === 'entree' ? 'text-green-600' : 'text-red-600'}`}>
                {sens === 'entree' ? '+' : '−'}¥{Number(montantRmb).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Fournisseur / Tiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {sens === 'sortie' ? 'Nom du fournisseur' : 'Provenance'}
              <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
            </label>
            <input
              type="text"
              value={tiersNom}
              onChange={e => setTiersNom(e.target.value)}
              placeholder={sens === 'sortie' ? 'Ex: Alibaba, Fournisseur Guangzhou...' : 'Ex: Virement bureau Chine'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Détails complémentaires..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Référence externe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence externe
              <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span>
            </label>
            <input
              type="text"
              value={referenceExterne}
              onChange={e => setReferenceExterne(e.target.value)}
              placeholder="N° de transaction, commande..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMouvement.isPending}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${
                sens === 'entree'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
              }`}
            >
              {createMouvement.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
