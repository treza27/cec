import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Package, Weight, Truck, Check, Search, ArrowUpDown, Hash, Clock } from 'lucide-react';
import { InventoryItem } from '../../types';
import { calculateSelectionStats } from '../../utils/calculations';
import { getEntrepotColor } from '../../utils/statusHelpers';

type SortField = 'id' | 'dateEntree' | 'shippingMark' | 'trackingNumber' | 'description' | 'pseudo' | 'nbPalettes' | 'nbCartons' | 'poids' | 'volume' | 'bl';
type SortOrder = 'asc' | 'desc';

interface ScanEntry {
  id: number;
  shippingMark: string | null;
  trackingNumber: string | null;
  timestamp: number;
}

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: number[], stats: any) => void;
  inventoryItems: InventoryItem[];
  initialSelectedIds: number[];
  departureKey?: string;
}

const MAX_HISTORY = 5;

function loadHistory(key: string): ScanEntry[] {
  try {
    const raw = localStorage.getItem(`scan_history_${key}`);
    if (!raw) return [];
    return JSON.parse(raw) as ScanEntry[];
  } catch {
    return [];
  }
}

function saveHistory(key: string, entries: ScanEntry[]) {
  try {
    localStorage.setItem(`scan_history_${key}`, JSON.stringify(entries));
  } catch {}
}

export default function PackageSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  inventoryItems,
  initialSelectedIds,
  departureKey
}: PackageSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [numberInput, setNumberInput] = useState('');
  const [numberSelectorFeedback, setNumberSelectorFeedback] = useState<{ found: number; notFound: number[] } | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ colisId: number; shippingMark: string | null; trackingNumber: string | null } | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const scanFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      if (departureKey) {
        setRecentScans(loadHistory(departureKey));
      }
    }
  }, [isOpen]);

  const addToHistory = (colis: InventoryItem) => {
    if (!departureKey) return;
    setRecentScans(prev => {
      const filtered = prev.filter(e => e.id !== colis.id);
      const entry: ScanEntry = {
        id: colis.id,
        shippingMark: colis.shippingMark || null,
        trackingNumber: colis.trackingNumber || null,
        timestamp: Date.now()
      };
      const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(departureKey, updated);
      return updated;
    });
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = inventoryItems.filter(item =>
      item.shippingMark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.pseudo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.client_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'dateEntree':
          aVal = new Date(a.dateEntree).getTime();
          bVal = new Date(b.dateEntree).getTime();
          break;
        case 'shippingMark':
          aVal = (a.shippingMark || '').toLowerCase();
          bVal = (b.shippingMark || '').toLowerCase();
          break;
        case 'trackingNumber':
          aVal = (a.trackingNumber || '').toLowerCase();
          bVal = (b.trackingNumber || '').toLowerCase();
          break;
        case 'description':
          aVal = a.description.toLowerCase();
          bVal = b.description.toLowerCase();
          break;
        case 'pseudo':
          aVal = (a.pseudo || a.client_nom || '').toLowerCase();
          bVal = (b.pseudo || b.client_nom || '').toLowerCase();
          break;
        case 'nbPalettes':
          aVal = parseInt(a.nbPalettes) || 0;
          bVal = parseInt(b.nbPalettes) || 0;
          break;
        case 'nbCartons':
          aVal = parseInt(a.nbCartons) || 0;
          bVal = parseInt(b.nbCartons) || 0;
          break;
        case 'poids':
          aVal = parseFloat(a.poids) || 0;
          bVal = parseFloat(b.poids) || 0;
          break;
        case 'volume':
          aVal = parseFloat(a.volume) || 0;
          bVal = parseFloat(b.volume) || 0;
          break;
        case 'bl':
          aVal = a.bl.toLowerCase();
          bVal = b.bl.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [inventoryItems, searchTerm, sortField, sortOrder]);

  const stats = calculateSelectionStats(selectedIds, inventoryItems);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const isSelected = (colisId: number) => selectedIds.some(id => Number(id) === Number(colisId));

  const handleToggleSelection = (colisId: number) => {
    const numId = Number(colisId);
    const currentlySelected = isSelected(numId);
    setSelectedIds(prev =>
      currentlySelected
        ? prev.filter(id => Number(id) !== numId)
        : [...prev, numId]
    );
    if (!currentlySelected) {
      const colis = inventoryItems.find(item => Number(item.id) === numId);
      if (colis) addToHistory(colis);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredAndSortedItems.map(item => Number(item.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedIds, stats);
    onClose();
  };

  const parseNumberInput = (input: string): number[] => {
    const result: number[] = [];
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes(':')) {
        const [startStr, endStr] = part.split(':').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) result.push(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) result.push(num);
      }
    }
    return [...new Set(result)];
  };

  const handleApplyNumberSelector = () => {
    const requestedIds = parseNumberInput(numberInput);
    const availableIds = new Set(inventoryItems.map(item => item.id));
    const found = requestedIds.filter(id => availableIds.has(id));
    const notFound = requestedIds.filter(id => !availableIds.has(id));
    setSelectedIds(prev => [...new Set([...prev, ...found])]);
    setNumberSelectorFeedback({ found: found.length, notFound });
  };

  const handleToggleNumberSelector = () => {
    setShowNumberSelector(prev => !prev);
    setNumberInput('');
    setNumberSelectorFeedback(null);
    if (!showNumberSelector) {
      setTimeout(() => numberInputRef.current?.focus(), 50);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAndSortedItems.length === 1) {
        const colis = filteredAndSortedItems[0];
        const numId = Number(colis.id);
        setSelectedIds(prev =>
          prev.some(id => Number(id) === numId) ? prev : [...prev, numId]
        );
        addToHistory(colis);
        if (scanFeedbackTimerRef.current) clearTimeout(scanFeedbackTimerRef.current);
        setScanFeedback({ colisId: colis.id, shippingMark: colis.shippingMark || null, trackingNumber: colis.trackingNumber || null });
        scanFeedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2000);
        setSearchTerm('');
      }
    }
  };

  const selectedIdSet = useMemo(() => new Set(selectedIds.map(Number)), [selectedIds]);
  const allSelected = filteredAndSortedItems.length > 0 && filteredAndSortedItems.every(item => selectedIdSet.has(Number(item.id)));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </th>
  );

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900">Sélectionner les colis</h2>
              <p className="text-xs md:text-sm text-gray-600">{selectedIds.length} colis sélectionné{selectedIds.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Stats + Historique */}
        <div className="px-3 py-2 md:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:items-stretch">
            {/* Bloc stats compact */}
            <div className="flex-shrink-0">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Totaux sélectionnés</p>
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="grid grid-cols-4 md:grid-cols-2 divide-x divide-blue-50 md:divide-y">
                  <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2">
                    <div className="p-1 md:p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
                      <Package className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase leading-none">Palettes</p>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-tight">{stats.nbPalettes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 border-l md:border-l-0 divide-blue-50">
                    <div className="p-1 md:p-1.5 bg-orange-50 rounded-lg flex-shrink-0">
                      <Package className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase leading-none">Cartons</p>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-tight">{stats.nbCartons}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 border-l md:border-l-0 md:border-t border-blue-50">
                    <div className="p-1 md:p-1.5 bg-cyan-50 rounded-lg flex-shrink-0">
                      <Weight className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase leading-none">Poids</p>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-tight">{stats.poids.toFixed(1)} <span className="text-[10px] md:text-xs font-normal text-gray-500">kg</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 border-l md:border-l-0 md:border-t border-blue-50">
                    <div className="p-1 md:p-1.5 bg-teal-50 rounded-lg flex-shrink-0">
                      <Truck className="w-3 h-3 md:w-3.5 md:h-3.5 text-teal-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase leading-none">Volume</p>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-tight">{stats.volume.toFixed(1)} <span className="text-[10px] md:text-xs font-normal text-gray-500">m³</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloc historique */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Derniers colis scannés</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col justify-center">
                {recentScans.length === 0 ? (
                  <div className="flex items-center justify-center py-3 px-4">
                    <p className="text-xs text-gray-400 italic">Aucun scan pour ce départ</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentScans.map((entry, idx) => (
                      <div
                        key={`${entry.id}-${entry.timestamp}`}
                        className={`flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1 md:py-1.5 ${idx === 0 ? 'bg-blue-50/50' : ''}`}
                      >
                        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          #{entry.id}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {entry.shippingMark || <span className="text-gray-400 font-normal italic">Sans SM</span>}
                        </span>
                        {entry.trackingNumber && (
                          <span className="text-[10px] font-mono text-gray-400 truncate hidden sm:block">{entry.trackingNumber}</span>
                        )}
                        <span className="ml-auto flex-shrink-0 text-[10px] text-gray-400">{formatTime(entry.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et actions */}
        <div className="px-3 py-2 md:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-stretch sm:items-center justify-between">
            <div className="flex-1 max-w-full sm:max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID, Shipping Mark, Description, Pseudo ou BL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-row flex-wrap gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={handleToggleNumberSelector}
                className={`px-2.5 md:px-3 py-1.5 md:py-2 text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 md:space-x-1.5 border ${
                  showNumberSelector
                    ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                    : 'bg-white text-teal-700 border-teal-500 hover:bg-teal-50'
                }`}
              >
                <Hash className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="whitespace-nowrap">Sélect. par N°</span>
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 md:px-3 py-1.5 md:py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 md:px-3 py-1.5 md:py-2 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Feedback scan */}
          {scanFeedback && (
            <div className="mt-3 flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 animate-pulse-once">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>
                Colis <span className="font-bold">#{scanFeedback.colisId}</span>
                {scanFeedback.shippingMark && <> — <span className="font-medium text-green-700">{scanFeedback.shippingMark}</span></>}
                {scanFeedback.trackingNumber && <> <span className="text-green-600 font-mono text-xs">({scanFeedback.trackingNumber})</span></>}
                {' '}ajouté à la sélection
              </span>
            </div>
          )}

          {/* Panneau de saisie par numéros */}
          {showNumberSelector && (
            <div className="mt-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <p className="text-xs font-semibold text-teal-800 mb-2">Saisie rapide par numéro de colis</p>
              <p className="text-xs text-teal-600 mb-3">
                Plage : <code className="bg-teal-100 px-1 py-0.5 rounded font-mono">1:52</code> &nbsp;&bull;&nbsp;
                Numéros individuels : <code className="bg-teal-100 px-1 py-0.5 rounded font-mono">4,6,8</code> &nbsp;&bull;&nbsp;
                Combiné : <code className="bg-teal-100 px-1 py-0.5 rounded font-mono">1:10, 15, 20, 50:60</code>
              </p>
              <div className="flex gap-2">
                <input
                  ref={numberInputRef}
                  type="text"
                  value={numberInput}
                  onChange={(e) => { setNumberInput(e.target.value); setNumberSelectorFeedback(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyNumberSelector()}
                  placeholder="ex: 1:52, 4, 6, 8, 100:120"
                  className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyNumberSelector}
                  disabled={!numberInput.trim()}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Appliquer</span>
                </button>
              </div>
              {numberSelectorFeedback && (
                <div className="mt-2 text-xs">
                  {numberSelectorFeedback.found > 0 && (
                    <span className="text-teal-700 font-medium">
                      {numberSelectorFeedback.found} colis ajouté{numberSelectorFeedback.found > 1 ? 's' : ''} à la sélection.
                    </span>
                  )}
                  {numberSelectorFeedback.notFound.length > 0 && (
                    <span className="text-amber-700 ml-2">
                      Introuvables : {numberSelectorFeedback.notFound.map(n => `#${n}`).join(', ')}
                    </span>
                  )}
                  {numberSelectorFeedback.found === 0 && numberSelectorFeedback.notFound.length === 0 && (
                    <span className="text-gray-500">Aucun numéro valide saisi.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tableau des colis */}
        <div className="px-2 md:px-4 py-2 md:py-3 flex-1 overflow-auto min-h-0">
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'Aucun colis ne correspond à votre recherche.' : 'Aucun colis disponible dans l\'inventaire.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      readOnly
                      tabIndex={-1}
                      className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded opacity-40 cursor-not-allowed pointer-events-none"
                    />
                  </th>
                  <SortableHeader field="id">ID</SortableHeader>
                  <SortableHeader field="dateEntree">Date</SortableHeader>
                  <SortableHeader field="shippingMark">Shipping Mark</SortableHeader>
                  <SortableHeader field="trackingNumber">Tracking</SortableHeader>
                  <SortableHeader field="description">Description</SortableHeader>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Entrepot
                  </th>
                  <SortableHeader field="pseudo">Pseudo</SortableHeader>
                  <SortableHeader field="nbPalettes">Pal.</SortableHeader>
                  <SortableHeader field="nbCartons">Cart.</SortableHeader>
                  <SortableHeader field="poids">Poids (kg)</SortableHeader>
                  <SortableHeader field="volume">Vol. (m³)</SortableHeader>
                  <SortableHeader field="bl">BL</SortableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedItems.map((colis) => (
                  <tr
                    key={colis.id}
                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                      selectedIdSet.has(Number(colis.id)) ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleToggleSelection(colis.id)}
                  >
                    <td className="px-2 md:px-4 py-2 md:py-3">
                      <input
                        type="checkbox"
                        checked={selectedIdSet.has(Number(colis.id))}
                        onChange={() => {}}
                        className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-bold text-gray-900">#{colis.id}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {new Date(colis.dateEntree).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-blue-600 font-medium">
                      {colis.shippingMark || 'N/A'}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 font-mono whitespace-nowrap">
                      {colis.trackingNumber || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 max-w-[120px] md:max-w-xs truncate" title={colis.description}>
                      {colis.description}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                      {colis.entrepot && (
                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium border ${getEntrepotColor(colis.entrepot)}`}>
                          {colis.entrepot}
                        </span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">
                      {colis.pseudo || colis.client_nom || 'N/A'}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 text-center font-medium">
                      {colis.nbPalettes}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 text-center font-medium">
                      {colis.nbCartons}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 text-center font-medium">
                      {colis.poids}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-900 text-center font-medium">
                      {colis.volume}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 font-medium">
                      {colis.bl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="flex flex-row items-center justify-between px-3 py-2 md:p-4 border-t border-gray-200 bg-gray-50 gap-2 flex-shrink-0">
          <div className="text-xs md:text-sm text-gray-600">
            {selectedIds.length} colis sél. sur {inventoryItems.length}
          </div>

          <div className="flex flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 md:px-4 py-1.5 md:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs md:text-sm whitespace-nowrap"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1.5 text-xs md:text-sm whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Confirmer la sélection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
