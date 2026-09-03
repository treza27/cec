import React, { memo } from 'react';
import { Package } from 'lucide-react';

interface GlobalStats {
  totalPalettes: number;
  totalCartons: number;
  totalPoids: number;
  totalVolume: number;
}

interface InventoryStatisticsProps {
  globalStats: GlobalStats | null;
  isLoading?: boolean;
}

const InventoryStatistics = memo(function InventoryStatistics({ globalStats, isLoading }: InventoryStatisticsProps) {
  const stats = globalStats ?? { totalPalettes: 0, totalCartons: 0, totalPoids: 0, totalVolume: 0 };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-purple-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Palettes</p>
            {isLoading ? (
              <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalPalettes}</p>
            )}
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
            {isLoading ? (
              <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalCartons}</p>
            )}
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
            {isLoading ? (
              <div className="h-7 w-20 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalPoids.toFixed(1)} kg</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-4 sm:w-6 h-4 sm:h-6 text-blue-600" />
          </div>
          <div className="ml-2 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Volume Total</p>
            {isLoading ? (
              <div className="h-7 w-20 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalVolume.toFixed(1)} m³</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default InventoryStatistics;
