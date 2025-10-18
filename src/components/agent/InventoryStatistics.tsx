import React, { memo, useMemo } from 'react';
import { Package } from 'lucide-react';

interface InventoryItem {
  id: number;
  nbPalettes: string;
  nbCartons: string;
  poids: string;
  volume: string;
}

interface InventoryStatisticsProps {
  inventoryItems: InventoryItem[];
}

const InventoryStatistics = memo(function InventoryStatistics({ inventoryItems }: InventoryStatisticsProps) {
  // Memoize les calculs pour éviter les recalculs inutiles
  const statistics = useMemo(() => {
    return inventoryItems.reduce((totals, item) => ({
      totalPalettes: totals.totalPalettes + (parseInt(item.nbPalettes) || 0),
      totalCartons: totals.totalCartons + (parseInt(item.nbCartons) || 0),
      totalPoids: totals.totalPoids + (parseFloat(item.poids) || 0),
      totalVolume: totals.totalVolume + (parseFloat(item.volume) || 0)
    }), {
      totalPalettes: 0,
      totalCartons: 0,
      totalPoids: 0,
      totalVolume: 0
    });
  }, [inventoryItems]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-purple-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Palettes</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{statistics.totalPalettes}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-orange-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Cartons</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{statistics.totalCartons}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-cyan-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Poids Total</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{statistics.totalPoids.toFixed(1)} kg</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-indigo-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Volume Total</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{statistics.totalVolume.toFixed(1)} m³</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InventoryStatistics;