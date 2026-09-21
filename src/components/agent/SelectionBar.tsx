import React from 'react';
import { Package, Weight, Truck, Download } from 'lucide-react';
import { InventoryItem } from '../../types';

interface SelectionBarProps {
  selectedColis: InventoryItem[];
  totalColis: number;
  onExport: () => void;
}

export default function SelectionBar({ selectedColis, totalColis, onExport }: SelectionBarProps) {
  const calculateTotals = () => {
    return selectedColis.reduce((totals, colis) => {
      return {
        nbPalettes: totals.nbPalettes + (parseInt(colis.nbPalettes) || 0),
        nbCartons: totals.nbCartons + (parseInt(colis.nbCartons) || 0),
        poids: totals.poids + (parseFloat(colis.poids) || 0),
        volume: totals.volume + (parseFloat(colis.volume) || 0)
      };
    }, { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl border-t-4 border-blue-400 rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-0">
          <div className="flex flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-1">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
                <Package className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <p className="text-xs font-medium opacity-90">Colis sélectionnés</p>
                <p className="text-base md:text-xl font-bold leading-tight">{selectedColis.length} / {totalColis}</p>
              </div>
            </div>

            <div className="hidden md:block h-12 w-px bg-white/30"></div>

            <div className="flex flex-wrap items-center gap-x-3 md:gap-x-6 gap-y-1">
              <div className="flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-75" />
                <div>
                  <p className="text-[10px] md:text-xs opacity-75">Palettes</p>
                  <p className="text-sm md:text-lg font-bold leading-tight">{totals.nbPalettes}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-75" />
                <div>
                  <p className="text-[10px] md:text-xs opacity-75">Cartons</p>
                  <p className="text-sm md:text-lg font-bold leading-tight">{totals.nbCartons}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <Weight className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-75" />
                <div>
                  <p className="text-[10px] md:text-xs opacity-75">Poids</p>
                  <p className="text-sm md:text-lg font-bold leading-tight">{totals.poids.toFixed(1)} kg</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-75" />
                <div>
                  <p className="text-[10px] md:text-xs opacity-75">Volume</p>
                  <p className="text-sm md:text-lg font-bold leading-tight">{totals.volume.toFixed(3)} m³</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onExport}
            className="flex items-center space-x-1.5 md:space-x-2 bg-white text-blue-600 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg text-sm md:text-base"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Exporter</span>
            <span className="hidden md:inline"> la sélection (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
