import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, AlertTriangle, Package, Calculator, User, Search, CheckCircle2, StickyNote } from 'lucide-react';
import { InventoryItem } from '../../../types';
import { NoteDebit, NoteDebitCreateData, NoteDebitColisDetail, NoteDebitUpdateData } from '../../../services/noteDebitService';
import { useClients } from '../../../hooks/useClients';
import { calculateWFI, getWFIColor } from '../../../utils/calculations';

interface NoteDebitConfigModalProps {
  departId: number;
  colis: InventoryItem[];
  alreadyInvoicedColisIds: Set<number>;
  onClose: () => void;
  onGenerate: (data: NoteDebitCreateData, details: NoteDebitColisDetail[]) => void;
  isCreating: boolean;
  editNote?: NoteDebit | null;
  onEdit?: (id: number, data: NoteDebitUpdateData, details: NoteDebitColisDetail[]) => void;
  isEditing?: boolean;
}

type Step = 1 | 2 | 3;

export default function NoteDebitConfigModal({
  departId,
  colis,
  alreadyInvoicedColisIds,
  onClose,
  onGenerate,
  isCreating,
  editNote,
  onEdit,
  isEditing,
}: NoteDebitConfigModalProps) {
  const isEditMode = !!editNote;
  const [step, setStep] = useState<Step>(1);
  const [colisSearch, setColisSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [prixCbmUsd, setPrixCbmUsd] = useState<string>('');
  const [tauxChange, setTauxChange] = useState<string>('');
  const [fraisLivraison, setFraisLivraison] = useState<string>('');

  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [newClientNom, setNewClientNom] = useState<string>('');
  const [noteExterne, setNoteExterne] = useState<string>('');

  const { clients } = useClients();

  // Pre-fill fields when in edit mode
  useEffect(() => {
    if (!editNote) return;
    setSelectedIds(new Set(editNote.colis_ids.map(Number)));
    setPrixCbmUsd(String(editNote.prix_cbm_usd ?? ''));
    setTauxChange(String(editNote.taux_change ?? ''));
    setFraisLivraison(editNote.frais_livraison_ariary != null ? String(editNote.frais_livraison_ariary) : '');
    setNoteExterne(editNote.note_externe ?? '');
    if (editNote.client_pseudo) {
      const match = clients.find((c) => c.pseudo === editNote.client_pseudo);
      if (match) {
        setClientMode('existing');
        setSelectedClientId(match.id);
      } else if (editNote.client_nom) {
        setClientMode('new');
        setNewClientNom(editNote.client_nom);
      }
    } else if (editNote.client_nom) {
      setClientMode('new');
      setNewClientNom(editNote.client_nom);
    }
  }, [editNote, clients]);

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

  // In edit mode, colis belonging to the note being edited are always selectable
  const editableColisIds = useMemo(() => {
    if (!editNote) return new Set<number>();
    return new Set(editNote.colis_ids.map(Number));
  }, [editNote]);

  const toggleColis = (id: number) => {
    if (alreadyInvoicedColisIds.has(id) && !editableColisIds.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedColis = useMemo(
    () => colis.filter((c) => selectedIds.has(c.id)),
    [colis, selectedIds]
  );

  const volumeTotal = useMemo(
    () => selectedColis.reduce((sum, c) => sum + (Number(c.volumeTana) || 0), 0),
    [selectedColis]
  );

  const montantCbm = useMemo(() => {
    const prix = parseFloat(prixCbmUsd);
    const taux = parseFloat(tauxChange);
    if (!prix || !taux || !volumeTotal) return null;
    return prix * taux * volumeTotal;
  }, [prixCbmUsd, tauxChange, volumeTotal]);

  const fraisLivraisonNum = useMemo(() => {
    const v = parseFloat(fraisLivraison);
    return !isNaN(v) && v > 0 ? v : null;
  }, [fraisLivraison]);

  const montantTotal = useMemo(() => {
    if (montantCbm == null) return null;
    return montantCbm + (fraisLivraisonNum || 0);
  }, [montantCbm, fraisLivraisonNum]);

  const resolvedClientNom = useMemo(() => {
    if (clientMode === 'existing') {
      if (!selectedClient) return null;
      return `${selectedClient.prenom || ''} ${selectedClient.nom || ''}`.trim() || selectedClient.pseudo || null;
    }
    return newClientNom.trim() || null;
  }, [clientMode, selectedClient, newClientNom]);

  const resolvedClientPseudo = useMemo(() => {
    if (clientMode === 'existing' && selectedClient) {
      return selectedClient.pseudo || null;
    }
    return null;
  }, [clientMode, selectedClient]);

  const resolvedClientPhone = useMemo(() => {
    if (clientMode === 'existing' && selectedClient) {
      return selectedClient.telephone || null;
    }
    return null;
  }, [clientMode, selectedClient]);

  const colisWithVolume = colis.filter((c) => c.volumeTana != null && Number(c.volumeTana) > 0);
  const colisWithoutVolume = colis.filter((c) => c.volumeTana == null || Number(c.volumeTana) === 0);
  const alreadyInvoicedColis = colis.filter((c) => alreadyInvoicedColisIds.has(c.id) && !editableColisIds.has(c.id));
  const availableColis = colisWithVolume.filter((c) => !alreadyInvoicedColisIds.has(c.id) || editableColisIds.has(c.id));

  const filteredColis = useMemo(() => {
    const q = colisSearch.toLowerCase().trim();
    if (!q) return colis;
    return colis.filter(
      (c) =>
        (c.pseudo && c.pseudo.toLowerCase().includes(q)) ||
        (c.client_pseudo && c.client_pseudo.toLowerCase().includes(q)) ||
        (c.shippingMark && c.shippingMark.toLowerCase().includes(q)) ||
        (c.trackingNumber && c.trackingNumber.toLowerCase().includes(q))
    );
  }, [colis, colisSearch]);

  const canProceedStep1 = selectedIds.size > 0;
  const canProceedStep2 =
    canProceedStep1 &&
    parseFloat(prixCbmUsd) > 0 &&
    parseFloat(tauxChange) > 0 &&
    montantCbm != null;

  const canGenerate = canProceedStep2;

  const handleGenerate = () => {
    if (!canGenerate || montantCbm == null) return;
    const prix = parseFloat(prixCbmUsd);
    const taux = parseFloat(tauxChange);
    const totalAriary = Math.round(montantCbm);

    const colisDetails: NoteDebitColisDetail[] = selectedColis.map((c) => {
      const vol = Number(c.volumeTana) || 0;
      return {
        id: c.id,
        shippingMark: c.shippingMark || '',
        trackingNumber: c.trackingNumber || '',
        description: c.description || '',
        volumeTana: vol,
        montantAriary: Math.round(vol * prix * taux),
        poidsTana: Number(c.poidsTana ?? c.poids) || 0,
        nbCartons: Number(c.nbCartonsTana ?? c.nbCartons) || 0,
        nbPalettes: Number(c.nbPalettesTana ?? c.nbPalettes) || 0,
      };
    });

    if (isEditMode && editNote && onEdit) {
      const updateData: NoteDebitUpdateData = {
        prix_cbm_usd: prix,
        taux_change: taux,
        volume_total_tana: volumeTotal,
        montant_total_ariary: totalAriary,
        frais_livraison_ariary: fraisLivraisonNum,
        client_nom: resolvedClientNom,
        client_pseudo: resolvedClientPseudo,
        client_phone: resolvedClientPhone,
        colis_ids: selectedColis.map((c) => c.id),
        colis_details: colisDetails,
        note_externe: noteExterne.trim() || null,
      };
      onEdit(editNote.id, updateData, colisDetails);
      return;
    }

    const createData: NoteDebitCreateData = {
      depart_id: departId,
      prix_cbm_usd: prix,
      taux_change: taux,
      volume_total_tana: volumeTotal,
      montant_total_ariary: totalAriary,
      frais_livraison_ariary: fraisLivraisonNum,
      client_nom: resolvedClientNom,
      client_pseudo: resolvedClientPseudo,
      client_phone: resolvedClientPhone,
      colis_ids: selectedColis.map((c) => c.id),
      colis_details: colisDetails,
      note_externe: noteExterne.trim() || null,
    };

    onGenerate(createData, colisDetails);
  };

  const stepLabels: Record<Step, string> = {
    1: 'Sélection des colis',
    2: 'Paramètres de prix',
    3: 'Client & frais',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{isEditMode ? 'Modifier la Note de Débit' : 'Nouvelle Note de Débit'}</h2>
              <p className="text-xs text-gray-500">
                {isEditMode && editNote ? `${editNote.reference} — ` : ''}Étape {step} sur 3 — {stepLabels[step]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex px-6 py-3 gap-2 border-b border-gray-100">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>

        {/* Step 1: Select colis */}
        {step === 1 && (
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {colisWithoutVolume.length > 0 && (
              <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>{colisWithoutVolume.length} colis</strong> n'ont pas de volume de contre-mesure (Volume Tana) et ne peuvent pas être sélectionnés.
                </p>
              </div>
            )}

            {alreadyInvoicedColis.length > 0 && (
              <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <strong>{alreadyInvoicedColis.length} colis</strong> ont déjà été facturés dans une note de débit précédente et ne peuvent pas être sélectionnés à nouveau.
                </p>
              </div>
            )}

            {availableColis.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Tous les colis ont déjà été facturés</p>
                <p className="text-xs text-gray-400 mt-1">
                  Aucun colis disponible pour une nouvelle note de débit sur ce départ.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={colisSearch}
                      onChange={(e) => setColisSearch(e.target.value)}
                      placeholder="Filtrer par pseudo, shipping mark ou tracking..."
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {colisSearch && (
                      <button
                        onClick={() => setColisSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {selectedIds.size} sélectionné(s) — <span className="font-bold text-blue-600">{volumeTotal.toFixed(3)} m³</span>
                  </p>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">N°</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Pseudo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Shipping Mark</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tracking</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Volume Tana</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">WFI / Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredColis.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                            Aucun colis ne correspond à "{colisSearch}"
                          </td>
                        </tr>
                      )}
                      {filteredColis.map((c) => {
                        const hasVolume = c.volumeTana != null && Number(c.volumeTana) > 0;
                        const isInvoiced = alreadyInvoicedColisIds.has(c.id) && !editableColisIds.has(c.id);
                        const isSelectable = hasVolume && !isInvoiced;
                        const isSelected = selectedIds.has(c.id);
                        const wfi = calculateWFI(c.volumeTana || '', c.poidsTana || '');
                        return (
                          <tr
                            key={c.id}
                            onClick={() => isSelectable && toggleColis(c.id)}
                            className={`transition-colors ${isSelectable ? 'cursor-pointer hover:bg-blue-50' : 'opacity-50 cursor-not-allowed bg-gray-50'} ${isSelected ? 'bg-blue-50' : ''} ${isInvoiced ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!isSelectable}
                                onChange={() => isSelectable && toggleColis(c.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">#{c.id}</td>
                            <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">{c.pseudo || c.client_pseudo || '—'}</td>
                            <td className="px-4 py-3 font-medium text-blue-700 whitespace-nowrap">{c.shippingMark || '—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{c.trackingNumber || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">{c.description}</td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {hasVolume ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {Number(c.volumeTana).toFixed(3)} m³
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Non mesuré</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {isInvoiced ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Facturé
                                </span>
                              ) : (
                                <span className={`text-xs font-semibold ${getWFIColor(wfi)}`}>{wfi}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Price parameters */}
        {step === 2 && (
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Prix du CBM (en USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prixCbmUsd}
                    onChange={(e) => setPrixCbmUsd(e.target.value)}
                    placeholder="Ex : 450.00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">USD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Taux de change (USD → Ariary)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tauxChange}
                    onChange={(e) => setTauxChange(e.target.value)}
                    placeholder="Ex : 4600"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-14 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Ar/$</span>
                </div>
              </div>
            </div>

            {/* Recap */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Récapitulatif</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Colis sélectionnés</span>
                  <span className="font-medium text-gray-900">{selectedColis.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Volume total (Tana)</span>
                  <span className="font-medium text-gray-900">{volumeTotal.toFixed(3)} m³</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Prix CBM</span>
                  <span className="font-medium text-gray-900">
                    {prixCbmUsd ? `${parseFloat(prixCbmUsd).toFixed(2)} USD` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taux de change</span>
                  <span className="font-medium text-gray-900">
                    {tauxChange ? `${parseInt(tauxChange).toLocaleString('fr-FR')} Ar/USD` : '—'}
                  </span>
                </div>
                <div className="pt-2 mt-1 border-t border-gray-300 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">TOTAL NOTE DE DÉBIT</span>
                  <span className="text-lg font-bold text-blue-700">
                    {montantCbm != null
                      ? `${Math.round(montantCbm).toLocaleString('fr-FR')} Ar`
                      : '—'}
                  </span>
                </div>
              </div>
              {montantCbm != null && (
                <p className="text-xs text-gray-400 mt-3 italic">
                  Formule : {volumeTotal.toFixed(3)} m³ × {parseFloat(prixCbmUsd).toFixed(2)} USD × {parseInt(tauxChange).toLocaleString('fr-FR')} Ar/USD
                </p>
              )}
            </div>

            {/* Note externe — visible et éditable aux étapes 2 et 3 */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <label className="text-sm font-semibold text-gray-700">Note externe (optionnel)</label>
              </div>
              <textarea
                value={noteExterne}
                onChange={(e) => setNoteExterne(e.target.value)}
                placeholder="Ajouter un commentaire ou une note externe visible sur le document..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">Ce texte apparaîtra sur la note de débit imprimée.</p>
            </div>
          </div>
        )}

        {/* Step 3: Client & frais de livraison */}
        {step === 3 && (
          <div className="px-6 py-5 space-y-6">
            {/* Client */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-800">Client (optionnel)</h3>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setClientMode('existing'); setNewClientNom(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${clientMode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  Client existant
                </button>
                <button
                  onClick={() => { setClientMode('new'); setSelectedClientId(null); setClientSearch(''); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${clientMode === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  Nouveau client
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
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={newClientNom}
                    onChange={(e) => setNewClientNom(e.target.value)}
                    placeholder="Ex : Jean Dupont"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
            </div>

            {/* Frais de livraison */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Frais de livraison (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fraisLivraison}
                  onChange={(e) => setFraisLivraison(e.target.value)}
                  placeholder="Ex : 50000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Ar</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Laissez vide si aucun frais de livraison.</p>
            </div>

            {/* Note externe — visible et éditable aux étapes 2 et 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <label className="text-sm font-semibold text-gray-700">Note externe (optionnel)</label>
              </div>
              <textarea
                value={noteExterne}
                onChange={(e) => setNoteExterne(e.target.value)}
                placeholder="Ajouter un commentaire ou une note externe visible sur le document..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">Ce texte apparaîtra sur la note de débit imprimée.</p>
            </div>

            {/* Final recap */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Récapitulatif final</h3>
              <div className="space-y-2">
                {resolvedClientNom && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Client</span>
                    <span className="font-medium text-gray-900">{resolvedClientNom}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant CBM</span>
                  <span className="font-medium text-gray-900">
                    {montantCbm != null ? `${Math.round(montantCbm).toLocaleString('fr-FR')} Ar` : '—'}
                  </span>
                </div>
                {fraisLivraisonNum != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de livraison</span>
                    <span className="font-medium text-gray-900">{fraisLivraisonNum.toLocaleString('fr-FR')} Ar</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300 flex justify-between">
                  <span className="text-sm font-bold text-gray-900">TOTAL</span>
                  <span className="text-base font-bold text-blue-700">
                    {montantTotal != null ? `${Math.round(montantTotal).toLocaleString('fr-FR')} Ar` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={step === 1 ? onClose : () => setStep((step - 1) as Step)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as Step)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isCreating || isEditing}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating || isEditing ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {isEditMode ? 'Enregistrement...' : 'Génération...'}
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  {isEditMode ? 'Enregistrer les modifications' : 'Générer la Note de Débit'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
