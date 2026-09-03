import React from 'react';
import { BulkImportStats } from '../../types/bulkImport';
import { CheckCircle, AlertTriangle, XCircle, Package, Weight, Truck } from 'lucide-react';

interface BulkImportSummaryProps {
  stats: BulkImportStats;
}

const BulkImportSummary: React.FC<BulkImportSummaryProps> = ({ stats }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de l'import</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500 font-medium">Total lignes</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalRows}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500 font-medium">Valides</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.validRows}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-xs text-gray-500 font-medium">Erreurs</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.errorRows}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-500 font-medium">Avertissements</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.warningRows}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Palettes</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalPalettes}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-500 font-medium">Cartons</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalCartons}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Weight className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500 font-medium">Poids total</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{stats.totalPoids.toFixed(1)} kg</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500 font-medium">Volume total</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{stats.totalVolume.toFixed(3)} m³</p>
          </div>
        </div>
      </div>

      {(stats.guangzhouCount > 0 || stats.yiwuCount > 0) && (
        <div className="mt-4 bg-white rounded-lg p-3 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-2">Répartition par entrepôt</p>
          <div className="flex items-center space-x-4">
            {stats.guangzhouCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  Guangzhou: <strong>{stats.guangzhouCount}</strong>
                </span>
              </div>
            )}
            {stats.yiwuCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  Yiwu: <strong>{stats.yiwuCount}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportSummary;
