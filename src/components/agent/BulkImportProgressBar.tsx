import React from 'react';
import { ImportProgress } from '../../types/bulkImport';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface BulkImportProgressBarProps {
  progress: ImportProgress;
}

const BulkImportProgressBar: React.FC<BulkImportProgressBarProps> = ({ progress }) => {
  if (progress.status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="space-y-4">
          {progress.status === 'importing' && (
            <>
              <div className="flex items-center space-x-3">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900">Import en cours...</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{progress.current} / {progress.total} colis</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              {progress.message && (
                <p className="text-sm text-gray-500 text-center">{progress.message}</p>
              )}
            </>
          )}

          {progress.status === 'completed' && (
            <>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Import terminé</h3>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-green-200 rounded-full h-3">
                  <div className="bg-green-600 h-full" style={{ width: '100%' }} />
                </div>
                {progress.message && (
                  <p className="text-sm text-gray-600 text-center">{progress.message}</p>
                )}
              </div>
            </>
          )}

          {progress.status === 'error' && (
            <>
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Erreur</h3>
              </div>
              {progress.message && (
                <p className="text-sm text-red-600 text-center">{progress.message}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportProgressBar;
