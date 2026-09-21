import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ClipboardList } from 'lucide-react';
import { DepartItem, InventoryItem } from '../../types';
import ColisTable from './ColisTable';
import SelectionBar from './SelectionBar';
import { useResizable } from '../../hooks/useResizable';

interface ColisModalProps {
  isOpen: boolean;
  onClose: () => void;
  depart: DepartItem;
  colis: InventoryItem[];
}

export default function ColisModal({ isOpen, onClose, depart, colis }: ColisModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { size, handleMouseDown } = useResizable(1200, window.innerHeight * 0.9);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(colis.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectColis = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportSelection = () => {
    const selectedColis = colis.filter(c => selectedIds.has(c.id));
    exportCsv(selectedColis);
  };

  const handleExportAll = () => {
    exportCsv(colis);
  };

  const handleExportColis = () => {
    const mesureHeaders = [
      'Shipping Mark',
      'Tracking',
      'Pseudo',
      'Nb Cartons',
      'Nb Cartons Tana',
      'Volume Tana',
      'Poids Tana'
    ];

    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [mesureHeaders.join(',')];

    colis.forEach(item => {
      const row = [
        escapeCsvValue(item.shippingMark || ''),
        escapeCsvValue(item.trackingNumber || ''),
        escapeCsvValue(item.pseudo || item.client_nom || ''),
        escapeCsvValue(item.nbCartons),
        escapeCsvValue(item.nbCartonsTana || ''),
        escapeCsvValue(item.volumeTana || ''),
        escapeCsvValue(item.poidsTana || '')
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `mesures_conteneur_${depart.numTC || depart.id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCsv = (colisToExport: InventoryItem[]) => {
    const csvHeaders = [
      'Shipping Mark',
      'ID Colis',
      'Date Entrée',
      'Tracking',
      'Description',
      'Pseudo',
      'Nb Palettes',
      'Nb Cartons',
      'Poids (kg)',
      'Volume (m³)',
      'Nb Palettes Tana',
      'Nb Cartons Tana',
      'Poids (kg) Tana',
      'Volume (m³) Tana',
      'Statut Colis'
    ];

    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    };

    const metaLines = [
      `Num conteneur : ${depart.numTC || ''}`,
      `BL : ${depart.numBL || ''}`,
      `Date arrivee Tana : ${formatDate(depart.dateArriveTana)}`,
      '',
    ];

    const csvRows = [...metaLines, csvHeaders.join(',')];

    colisToExport.forEach(item => {
      const row = [
        escapeCsvValue(item.shippingMark || ''),
        escapeCsvValue(item.id),
        escapeCsvValue(formatDate(item.dateEntree)),
        escapeCsvValue(item.trackingNumber || ''),
        escapeCsvValue(item.description),
        escapeCsvValue(item.pseudo || item.client_nom || ''),
        escapeCsvValue(item.nbPalettes),
        escapeCsvValue(item.nbCartons),
        escapeCsvValue(item.poids),
        escapeCsvValue(item.volume),
        escapeCsvValue(item.nbPalettesTana || ''),
        escapeCsvValue(item.nbCartonsTana || ''),
        escapeCsvValue(item.poidsTana || ''),
        escapeCsvValue(item.volumeTana || ''),
        escapeCsvValue(item.statut)
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = selectedIds.size > 0
      ? `selection_depart_${depart.id}_${selectedIds.size}_colis_${new Date().toISOString().split('T')[0]}.csv`
      : `depart_${depart.id}_BL_${depart.numBL}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedColis = colis.filter(c => selectedIds.has(c.id));

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col relative"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${size.x}px, ${size.y}px)`,
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resize handles */}
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-blue-500 hover:opacity-20 transition-all"
          onMouseDown={handleMouseDown('n')}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-blue-500 hover:opacity-20 transition-all"
          onMouseDown={handleMouseDown('s')}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize hover:bg-blue-500 hover:opacity-20 transition-all"
          onMouseDown={handleMouseDown('w')}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize hover:bg-blue-500 hover:opacity-20 transition-all"
          onMouseDown={handleMouseDown('e')}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-500 hover:opacity-30 transition-all rounded-tl-2xl"
          onMouseDown={handleMouseDown('nw')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-500 hover:opacity-30 transition-all rounded-tr-2xl"
          onMouseDown={handleMouseDown('ne')}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-500 hover:opacity-30 transition-all rounded-bl-2xl"
          onMouseDown={handleMouseDown('sw')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500 hover:opacity-30 transition-all rounded-br-2xl"
          onMouseDown={handleMouseDown('se')}
        />

        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Colis du conteneur</h2>
            <p className="text-sm text-gray-600 mt-1">
              Départ #{depart.id} - BL: {depart.numBL} - Conteneur: {depart.numTC}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportColis}
              className="flex items-center space-x-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
              title="Exporter un tableau de mesures physiques (Num Conteneur, Date Arrivage, Shipping Mark, Tracking, Pseudo, Cartons, Volume, Poids)"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Exporter colis</span>
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center space-x-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Tout exporter</span>
            </button>
            <button
              onClick={onClose}
              className="border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {colis.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg">Aucun colis associé à ce départ</p>
              </div>
            </div>
          ) : (
            <ColisTable
              colis={colis}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectColis={handleSelectColis}
            />
          )}
        </div>

        {selectedIds.size > 0 && (
          <SelectionBar
            selectedColis={selectedColis}
            totalColis={colis.length}
            onExport={handleExportSelection}
          />
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
