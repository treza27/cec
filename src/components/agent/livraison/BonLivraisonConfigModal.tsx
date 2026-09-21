import React, { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Package, Truck, User, Search, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { InventoryItem } from '../../../types';
import { BonLivraisonCreateData, BonLivraisonColisDetail } from '../../../services/bonLivraisonService';
import { useClients } from '../../../hooks/useClients';

interface BonLivraisonConfigModalProps {
  departId: number;
  colis: InventoryItem[];
  onClose: () => void;
  onGenerate: (data: BonLivraisonCreateData) => void;
  isCreating: boolean;
}

type Step = 1 | 2 | 3;

interface ColisEdit {
  id: number;
  shippingMark: string;
  trackingNumber: string;
  description: string;
  nbPalettesTana: number;
  nbCartonsTana: number;
  poidsTana: number;
  volumeTana: number;
  nbCartonsLivres: string;
  poidsLivre: string;
  volumeLivre: string;
}

function buildColisEdit(c: InventoryItem): ColisEdit {
  const nbCartonsTana = Number(c.nbCartonsTana || c.nbCartons) || 0;
  const poidsTana = Number(c.poidsTana || c.poids) || 0;
  const volumeTana = Number(c.volumeTana || c.volume) || 0;
  return {
    id: c.id,
    shippingMark: c.shippingMark || '',
    trackingNumber: c.trackingNumber || '',
    description: c.description || '',
    nbPalettesTana: Number(c.nbPalettesTana || c.nbPalettes) || 0,
    nbCartonsTana,
    poidsTana,
    volumeTana,
    nbCartonsLivres: String(nbCartonsTana),
    poidsLivre: String(poidsTana),
    volumeLivre: String(volumeTana),
  };
}

export default function BonLivraisonConfigModal({
  departId,
  colis,
  onClose,
  onGenerate,
  isCreating,
}: BonLivraisonConfigModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [updateStatusToLivre, setUpdateStatusToLivre] = useState(true);

  // Step 1: colis selection
  const [selectedColisIds, setSelectedColisIds] = useState<Set<number>>(() => new Set());
  const [colisSearch, setColisSearch] = useState('');

  // Step 2: client
  const [clientMode, setClientMode] = useState<'existing' | 'free'>('existing');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [freeClientNom, setFreeClientNom] = useState('');

  // Step 3: quantities — built lazily when entering step 3
  const [colisEdits, setColisEdits] = useState<ColisEdit[]>([]);

  const { clients } = useClients();

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients.slice(0, 20);
    return clients
      .filter(
        (c) =>
          (c.prenom && c.prenom.toLowerCase().includes(q)) ||
          (c.nom && c.nom.toLowerCase().includes(q)) ||
          (c.pseudo && c.pseudo.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [clients, clientSearch]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const resolvedClientNom = useMemo(() => {
    if (clientMode === 'existing') {
      if (!selectedClient) return null;
      return `${selectedClient.prenom || ''} ${selectedClient.nom || ''}`.trim() || selectedClient.pseudo || null;
    }
    return freeClientNom.trim() || null;
  }, [clientMode, selectedClient, freeClientNom]);

  const resolvedClientPseudo = useMemo(() => {
    if (clientMode === 'existing' && selectedClient) {
      return selectedClient.pseudo || null;
    }
    return null;
  }, [clientMode, selectedClient]);

  const selectedColis = useMemo(
    () => colis.filter((c) => selectedColisIds.has(c.id)),
    [colis, selectedColisIds]
  );

  const filteredColis = useMemo(() => {
    const q = colisSearch.toLowerCase().trim();
    if (!q) return colis;
    return colis.filter((c) => {
      const pseudo = (c.pseudo || c.client_nom || '').toLowerCase();
      const tracking = (c.trackingNumber || '').toLowerCase();
      const shippingMark = (c.shippingMark || '').toLowerCase();
      return pseudo.includes(q) || tracking.includes(q) || shippingMark.includes(q);
    });
  }, [colis, colisSearch]);

  const toggleColis = (id: number) => {
    setSelectedColisIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedColisIds.size === colis.length) {
      setSelectedColisIds(new Set());
    } else {
      setSelectedColisIds(new Set(colis.map((c) => c.id)));
    }
  };

  const updateColisField = (
    id: number,
    field: keyof Pick<ColisEdit, 'nbCartonsLivres' | 'poidsLivre' | 'volumeLivre'>,
    value: string
  ) => {
    setColisEdits((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const totals = useMemo(() => {
    return colisEdits.reduce(
      (acc, c) => ({
        volume: acc.volume + (parseFloat(c.volumeLivre) || 0),
        poids: acc.poids + (parseFloat(c.poidsLivre) || 0),
        cartons: acc.cartons + (parseInt(c.nbCartonsLivres) || 0),
      }),
      { volume: 0, poids: 0, cartons: 0 }
    );
  }, [colisEdits]);

  const isPartial = useMemo(() => {
    return colisEdits.some((c) => {
      const vLivre = parseFloat(c.volumeLivre) || 0;
      const pLivre = parseFloat(c.poidsLivre) || 0;
      const cartLivre = parseInt(c.nbCartonsLivres) || 0;
      return vLivre < c.volumeTana || pLivre < c.poidsTana || cartLivre < c.nbCartonsTana;
    });
  }, [colisEdits]);

  const goToStep = (target: Step) => {
    if (target === 3) {
      // Build colisEdits from currently selected colis
      setColisEdits(selectedColis.map(buildColisEdit));
    }
    setStep(target);
  };

  const handleBack = () => {
    if (step === 1) onClose();
    else goToStep((step - 1) as Step);
  };

  const handleNext = () => {
    goToStep((step + 1) as Step);
  };

  const handleGenerate = () => {
    const details: BonLivraisonColisDetail[] = colisEdits.map((c) => ({
      id: c.id,
      shippingMark: c.shippingMark,
      trackingNumber: c.trackingNumber,
      description: c.description,
      nbPalettesTana: c.nbPalettesTana,
      nbCartonsTana: c.nbCartonsTana,
      poidsTana: c.poidsTana,
      volumeTana: c.volumeTana,
      nbCartonsLivres: parseInt(c.nbCartonsLivres) || 0,
      poidsLivre: parseFloat(c.poidsLivre) || 0,
      volumeLivre: parseFloat(c.volumeLivre) || 0,
    }));

    const createData: BonLivraisonCreateData = {
      depart_id: departId,
      client_nom: resolvedClientNom,
      client_pseudo: resolvedClientPseudo,
      colis_ids: colisEdits.map((c) => c.id),
      colis_details: details,
      volume_total_livre: totals.volume,
      poids_total_livre: totals.poids,
      nb_cartons_total_livre: totals.cartons,
      is_partial: isPartial,
      update_status_to_livre: updateStatusToLivre,
    };

    onGenerate(createData);
  };

  const stepLabels: Record<Step, string> = {
    1: 'Sélection des colis',
    2: 'Destinataire',
    3: 'Quantités livrées',
  };

  const allSelected = selectedColisIds.size === colis.length;
  const noneSelected = selectedColisIds.size === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nouveau Bon de Livraison</h2>
              <p className="text-xs text-gray-500">Étape {step} sur 3 — {stepLabels[step]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex px-6 py-3 gap-2 border-b border-gray-100">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>

        {/* Step 1: Colis selection */}
        {step === 1 && (
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-800">
                  Sélectionnez les colis à inclure dans ce bon
                </h3>
              </div>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {allSelected ? (
                  <><CheckSquare className="w-4 h-4" /> Tout désélectionner</>
                ) : (
                  <><Square className="w-4 h-4" /> Tout sélectionner</>
                )}
              </button>
            </div>

            {/* Search bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={colisSearch}
                  onChange={(e) => setColisSearch(e.target.value)}
                  placeholder="Rechercher par Pseudo ou Tracking..."
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {colisSearch && (
                  <button
                    onClick={() => setColisSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {colisSearch && (
                <p className="mt-1.5 text-xs text-gray-500">
                  {filteredColis.length} résultat{filteredColis.length !== 1 ? 's' : ''} sur {colis.length} colis
                </p>
              )}
            </div>

            {colis.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucun colis disponible pour ce départ.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10 px-4 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Shipping Mark</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tracking</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pseudo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Cartons</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Poids</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredColis.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                          Aucun colis ne correspond a votre recherche.
                        </td>
                      </tr>
                    ) : filteredColis.map((c, idx) => {
                      const checked = selectedColisIds.has(c.id);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => toggleColis(c.id)}
                          className={`cursor-pointer transition-colors ${
                            checked
                              ? idx % 2 === 0 ? 'bg-blue-50' : 'bg-blue-50/80'
                              : idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors mx-auto ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {checked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 font-semibold whitespace-nowrap ${checked ? 'text-blue-700' : 'text-gray-500'}`}>
                            {c.shippingMark || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {c.trackingNumber || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-medium">
                            {c.pseudo || c.client_nom || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs">
                            <div className="truncate" title={c.description}>{c.description}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 tabular-nums">
                            {Number(c.nbCartonsTana || c.nbCartons) || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 tabular-nums whitespace-nowrap">
                            {Number(c.poidsTana || c.poids) || 0} kg
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 tabular-nums whitespace-nowrap">
                            {Number(c.volumeTana || c.volume) || 0} m³
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{selectedColisIds.size}</span> colis sélectionné{selectedColisIds.size > 1 ? 's' : ''} sur {colis.length}
              </span>
              {noneSelected && (
                <span className="text-xs text-red-500 font-medium">Sélectionnez au moins un colis</span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Client */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-800">Destinataire (optionnel)</h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setClientMode('existing'); setFreeClientNom(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${clientMode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                Client existant
              </button>
              <button
                onClick={() => { setClientMode('free'); setSelectedClientId(null); setClientSearch(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${clientMode === 'free' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                Saisie libre
              </button>
            </div>

            {clientMode === 'existing' ? (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Rechercher par prénom, nom ou pseudo..."
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  <button
                    onClick={() => setSelectedClientId(null)}
                    className={`w-full text-left px-4 py-2.5 text-xs text-gray-400 italic border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedClientId === null ? 'bg-blue-50 text-blue-600 font-medium not-italic' : ''}`}
                  >
                    Aucun client sélectionné
                  </button>
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors ${selectedClientId === c.id ? 'bg-blue-50' : ''}`}
                    >
                      <span className="font-medium text-gray-900">
                        {[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}
                      </span>
                      {c.pseudo && (
                        <span className="ml-2 text-xs text-gray-400">({c.pseudo})</span>
                      )}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="px-4 py-3 text-xs text-gray-400 italic">Aucun résultat</p>
                  )}
                </div>
                {selectedClient && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    Sélectionné : {[selectedClient.prenom, selectedClient.nom].filter(Boolean).join(' ') || selectedClient.pseudo}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du destinataire</label>
                <input
                  type="text"
                  value={freeClientNom}
                  onChange={(e) => setFreeClientNom(e.target.value)}
                  placeholder="Ex : Jean Dupont"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                À l'étape suivante, vous pourrez ajuster les quantités (cartons, poids, volume) pour les <strong>{selectedColisIds.size} colis</strong> sélectionnés.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Quantities */}
        {step === 3 && (
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {isPartial && (
              <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Les quantités livrées sont inférieures aux valeurs d'origine sur certains colis.
                  Ce bon sera marqué comme <strong>livraison partielle</strong>.
                </p>
              </div>
            )}

            <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Shipping Mark</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                      Cartons livrés
                      <div className="text-gray-400 font-normal normal-case">(total Tana)</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                      Poids livré (kg)
                      <div className="text-gray-400 font-normal normal-case">(total Tana)</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                      Volume livré (m³)
                      <div className="text-gray-400 font-normal normal-case">(total Tana)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {colisEdits.map((c, idx) => {
                    const vLivre = parseFloat(c.volumeLivre) || 0;
                    const pLivre = parseFloat(c.poidsLivre) || 0;
                    const cartLivre = parseInt(c.nbCartonsLivres) || 0;

                    return (
                      <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">{c.shippingMark || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs">
                          <div className="truncate" title={c.description}>{c.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number" min="0" step="1"
                              value={c.nbCartonsLivres}
                              onChange={(e) => updateColisField(c.id, 'nbCartonsLivres', e.target.value)}
                              className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${cartLivre < c.nbCartonsTana ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}
                            />
                            <span className="text-xs text-gray-400">/ {c.nbCartonsTana}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number" min="0" step="0.001"
                              value={c.poidsLivre}
                              onChange={(e) => updateColisField(c.id, 'poidsLivre', e.target.value)}
                              className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${pLivre < c.poidsTana ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}
                            />
                            <span className="text-xs text-gray-400">/ {c.poidsTana} kg</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number" min="0" step="0.001"
                              value={c.volumeLivre}
                              onChange={(e) => updateColisField(c.id, 'volumeLivre', e.target.value)}
                              className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${vLivre < c.volumeTana ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}
                            />
                            <span className="text-xs text-gray-400">/ {c.volumeTana} m³</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Totaux livrés</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Cartons</p>
                  <p className="text-lg font-bold text-gray-900">{totals.cartons}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Poids</p>
                  <p className="text-lg font-bold text-gray-900">{totals.poids.toFixed(3)} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Volume</p>
                  <p className="text-lg font-bold text-gray-900">{totals.volume.toFixed(3)} m³</p>
                </div>
              </div>
              {resolvedClientNom && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Destinataire : <span className="font-semibold text-gray-800">{resolvedClientNom}</span></p>
                </div>
              )}
              {isPartial && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Livraison partielle
                  </span>
                </div>
              )}
            </div>

            {/* Option changement de statut */}
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors select-none ${
                updateStatusToLivre
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setUpdateStatusToLivre((v) => !v)}
            >
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${updateStatusToLivre ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                {updateStatusToLivre && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${updateStatusToLivre ? 'text-blue-900' : 'text-gray-700'}`}>
                  Marquer les colis comme "Livré"
                </p>
                <p className={`text-xs mt-0.5 ${updateStatusToLivre ? 'text-blue-700' : 'text-gray-500'}`}>
                  Le statut des colis sélectionnés passera de "En cours de livraison" à "Livré" lors de la génération du bon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && noneSelected}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isCreating || colisEdits.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Génération...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  Générer le Bon de Livraison
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
