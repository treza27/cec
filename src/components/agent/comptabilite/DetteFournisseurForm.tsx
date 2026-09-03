import React, { useState, useMemo, useEffect } from 'react';
import { X, DollarSign, Search, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateDetteFournisseur, useUpdateDetteFournisseur } from '../../../hooks/useComptabilite';
import { type DetteFournisseur } from '../../../services/comptabiliteService';
import { supabase } from '../../../utils/supabase';

interface Client {
  id: number;
  pseudo: string;
  nom: string | null;
  prenom: string;
  entreprise: string | null;
}

interface DetteFournisseurFormProps {
  onClose: () => void;
  onSuccess: () => void;
  dette?: DetteFournisseur | null;
}

export default function DetteFournisseurForm({ onClose, onSuccess, dette }: DetteFournisseurFormProps) {
  const isEdit = !!dette;

  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    dette?.client
      ? { id: 0, pseudo: dette.client.pseudo, nom: dette.client.nom, prenom: dette.client.prenom, entreprise: dette.client.entreprise }
      : null
  );
  const [montantUsd, setMontantUsd] = useState(dette ? String(dette.montant_usd) : '');
  const [tauxUsdMga, setTauxUsdMga] = useState(dette ? String(dette.taux_usd_mga) : '');
  const [datePaiement, setDatePaiement] = useState(dette?.date_paiement ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(dette?.description ?? '');
  const [notes, setNotes] = useState(dette?.notes ?? '');
  const [showClientList, setShowClientList] = useState(false);

  const createDette = useCreateDetteFournisseur();
  const updateDette = useUpdateDetteFournisseur();

  useEffect(() => {
    if (isEdit) return;
    if (clientSearch.length < 2) { setClients([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, pseudo, nom, prenom, entreprise')
        .or(`pseudo.ilike.%${clientSearch}%,nom.ilike.%${clientSearch}%,prenom.ilike.%${clientSearch}%`)
        .limit(10);
      setClients(data ?? []);
      setShowClientList(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [clientSearch, isEdit]);

  const montantMgaEquivalent = useMemo(() => {
    const usd = parseFloat(montantUsd);
    const taux = parseFloat(tauxUsdMga);
    if (isNaN(usd) || isNaN(taux) || usd <= 0 || taux <= 0) return null;
    return usd * taux;
  }, [montantUsd, tauxUsdMga]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(montantUsd);
    const taux = parseFloat(tauxUsdMga);
    if (isNaN(usd) || usd <= 0) { toast.error('Montant USD invalide'); return; }
    if (isNaN(taux) || taux <= 0) { toast.error('Taux USD/MGA invalide'); return; }
    if (!description.trim()) { toast.error('La description est obligatoire'); return; }

    try {
      if (isEdit && dette) {
        await updateDette.mutateAsync({
          id: dette.id,
          payload: {
            montant_usd: usd,
            taux_usd_mga: taux,
            montant_mga_equivalent: usd * taux,
            date_paiement: datePaiement,
            description: description.trim(),
            notes: notes.trim() || null,
          },
        });
        toast.success('Paiement fournisseur modifié');
      } else {
        if (!selectedClient || !selectedClient.id) { toast.error('Veuillez sélectionner un client'); return; }
        const result = await createDette.mutateAsync({
          client_id: selectedClient.id,
          montant_usd: usd,
          taux_usd_mga: taux,
          montant_mga_equivalent: usd * taux,
          description: description.trim(),
          date_paiement: datePaiement,
          notes: notes.trim() || null,
        });
        toast.success(`Dette créée — Référence : ${result.reference}`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  const clientLabel = (c: Client) => {
    const name = [c.prenom, c.nom].filter(Boolean).join(' ');
    return `${c.pseudo}${name ? ` — ${name}` : ''}${c.entreprise ? ` (${c.entreprise})` : ''}`;
  };

  const isPending = createDette.isPending || updateDette.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEdit ? 'Modifier le paiement fournisseur' : 'Nouveau paiement fournisseur'}
              </h2>
              <p className="text-xs text-gray-500">Paiement USD effectué pour le compte d'un client</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Client */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Client <span className="text-red-500">*</span>
            </label>
            {isEdit || (selectedClient && !selectedClient.id) ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedClient?.pseudo ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    {[selectedClient?.prenom, selectedClient?.nom].filter(Boolean).join(' ')}
                    {selectedClient?.entreprise && ` — ${selectedClient.entreprise}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400">Non modifiable</span>
              </div>
            ) : selectedClient ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{selectedClient.pseudo}</p>
                  <p className="text-xs text-blue-600">
                    {[selectedClient.prenom, selectedClient.nom].filter(Boolean).join(' ')}
                    {selectedClient.entreprise && ` — ${selectedClient.entreprise}`}
                  </p>
                </div>
                <button type="button" onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="text-xs text-blue-400 hover:text-blue-600">
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                  onFocus={() => clientSearch.length >= 2 && setShowClientList(true)}
                  placeholder="Rechercher par pseudo, nom…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showClientList && clients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {clients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientList(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm transition-colors"
                      >
                        <span className="font-medium text-gray-900">{c.pseudo}</span>
                        <span className="text-gray-500 ml-2 text-xs">{[c.prenom, c.nom].filter(Boolean).join(' ')}</span>
                        {c.entreprise && <span className="text-gray-400 ml-1 text-xs">({c.entreprise})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Montant USD + Taux */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Montant USD <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                <input
                  type="number"
                  value={montantUsd}
                  onChange={e => setMontantUsd(e.target.value)}
                  min="0.01" step="0.01" placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Taux USD/MGA <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={tauxUsdMga}
                onChange={e => setTauxUsdMga(e.target.value)}
                min="1" step="1" placeholder="Ex: 4500"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Équivalent MGA */}
          {montantMgaEquivalent !== null && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Calculator className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                Équivalent MGA : <span className="font-bold">{montantMgaEquivalent.toLocaleString('fr-MG')} Ar</span>
              </span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Date du paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={e => setDatePaiement(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description / Objet du paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Achat marchandise Guangzhou — Lot vêtements"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes internes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Informations complémentaires (optionnel)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !montantUsd || !tauxUsdMga || !description.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? (isEdit ? 'Modification…' : 'Création…') : (isEdit ? 'Enregistrer' : 'Créer la dette')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
