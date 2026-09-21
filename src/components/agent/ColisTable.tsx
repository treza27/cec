import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { InventoryItem } from '../../types';

interface ColisTableProps {
  colis: InventoryItem[];
  selectedIds: Set<number>;
  onSelectAll: (selected: boolean) => void;
  onSelectColis: (id: number) => void;
}

type SortField = 'id' | 'dateEntree' | 'shippingMark' | 'trackingNumber' | 'description' | 'client' | 'nbPalettes' | 'nbCartons' | 'poids' | 'volume';
type SortOrder = 'asc' | 'desc';

export default function ColisTable({ colis, selectedIds, onSelectAll, onSelectColis }: ColisTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const allSelected = colis.length > 0 && selectedIds.size === colis.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < colis.length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedColis = useMemo(() => {
    let filtered = colis.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.id.toString().includes(searchLower) ||
        (item.shippingMark || '').toLowerCase().includes(searchLower) ||
        (item.trackingNumber || '').toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.pseudo || '').toLowerCase().includes(searchLower) ||
        (item.client_nom || '').toLowerCase().includes(searchLower)
      );
    });

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
        case 'client':
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
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [colis, searchTerm, sortField, sortOrder]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, Shipping Mark, Tracking, Description ou Pseudo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full min-w-[700px] divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <SortableHeader field="id">ID</SortableHeader>
              <SortableHeader field="dateEntree">Date</SortableHeader>
              <SortableHeader field="shippingMark">Shipping Mark</SortableHeader>
              <SortableHeader field="trackingNumber">Tracking</SortableHeader>
              <SortableHeader field="description">Description</SortableHeader>
              <SortableHeader field="client">Pseudo</SortableHeader>
              <SortableHeader field="nbPalettes">Palettes</SortableHeader>
              <SortableHeader field="nbCartons">Cartons</SortableHeader>
              <SortableHeader field="poids">Poids (kg)</SortableHeader>
              <SortableHeader field="volume">Volume (m³)</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedColis.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-blue-50 transition-colors ${
                  selectedIds.has(item.id) ? 'bg-blue-100' : ''
                }`}
                onClick={() => onSelectColis(item.id)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">#{item.id}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {new Date(item.dateEntree).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                  {item.shippingMark || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.trackingNumber || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.pseudo || item.client_nom || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                  {item.nbPalettes}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                  {item.nbCartons}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                  {item.poids}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                  {item.volume}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedColis.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Aucun colis ne correspond à votre recherche.' : 'Aucun colis à afficher.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
