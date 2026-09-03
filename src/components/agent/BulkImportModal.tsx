import React, { useState } from 'react';
import { X, Download, Plus, Trash2, Loader2 } from 'lucide-react';
import { useBulkImport } from '../../hooks/useBulkImport';
import { downloadTemplate } from '../../utils/excelParser';
import BulkImportFileUpload from './BulkImportFileUpload';
import BulkImportTable from './BulkImportTable';
import BulkImportSummary from './BulkImportSummary';
import BulkImportProgressBar from './BulkImportProgressBar';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  existingPseudos: string[];
  existingShippingMarks: string[];
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  existingPseudos,
  existingShippingMarks,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'manual'>('file');
  const {
    rows,
    stats,
    progress,
    importResult,
    isLoadingTrackingNumbers,
    loadRows,
    updateRow,
    deleteRow,
    addEmptyRow,
    duplicateRow,
    clearAll,
    executeImport,
  } = useBulkImport(existingPseudos, existingShippingMarks);

  const [showResults, setShowResults] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    clearAll();
    setShowResults(false);
    setImportCompleted(false);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success('Template téléchargé');
  };

  const handleImport = async () => {
    if (stats.errorRows > 0) {
      toast.error(`Impossible d'importer: ${stats.errorRows} ligne(s) avec des erreurs`);
      return;
    }

    if (stats.validRows === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    try {
      const result = await executeImport();
      setShowResults(true);
      setImportCompleted(true);
      if (result.successCount > 0) {
        setTimeout(() => {
          onImportSuccess();
          handleClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur import:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />

      <div className="fixed inset-4 sm:inset-8 md:inset-12 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Import multiple de colis</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Template Excel</span>
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {showResults && importResult ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Import terminé</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-gray-700">Colis importés avec succès</span>
                    <span className="text-2xl font-bold text-green-600">{importResult.successCount}</span>
                  </div>
                  {importResult.failureCount > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Colis en échec</span>
                      <span className="text-2xl font-bold text-red-600">{importResult.failureCount}</span>
                    </div>
                  )}
                </div>
                {importResult.failures.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Détails des échecs:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {importResult.failures.map((failure, idx) => (
                        <div key={idx} className="p-2 bg-red-50 rounded text-xs text-red-700 border border-red-200">
                          Ligne {failure.rowIndex}: {failure.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Fermeture automatique dans 3 secondes...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200">
              <div className="flex space-x-1 p-2">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Importer fichier Excel/CSV
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Saisie rapide
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeTab === 'file' && rows.length === 0 && (
                <BulkImportFileUpload onFileLoaded={loadRows} />
              )}

              {rows.length > 0 && (
                <>
                  <BulkImportSummary stats={stats} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={addEmptyRow}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter ligne</span>
                      </button>
                      <button
                        onClick={clearAll}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Tout effacer</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {rows.length} ligne{rows.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <BulkImportTable
                    rows={rows}
                    onUpdateRow={updateRow}
                    onDeleteRow={deleteRow}
                    onDuplicateRow={duplicateRow}
                    existingPseudos={existingPseudos}
                    existingShippingMarks={existingShippingMarks}
                  />
                </>
              )}

              {activeTab === 'manual' && rows.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Aucune ligne ajoutée</p>
                  <button
                    onClick={addEmptyRow}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter première ligne</span>
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="text-sm text-gray-600">
                {isLoadingTrackingNumbers && rows.length > 0 && (
                  <span className="flex items-center space-x-1.5 text-amber-600 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Vérification des doublons en cours...</span>
                  </span>
                )}
                {!isLoadingTrackingNumbers && stats.validRows > 0 && (
                  <span className="text-green-600 font-medium">
                    {stats.validRows} ligne{stats.validRows > 1 ? 's' : ''} prête{stats.validRows > 1 ? 's' : ''} à importer
                  </span>
                )}
                {!isLoadingTrackingNumbers && stats.errorRows > 0 && (
                  <span className="text-red-600 font-medium ml-2">
                    • {stats.errorRows} erreur{stats.errorRows > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={isLoadingTrackingNumbers || stats.validRows === 0 || stats.errorRows > 0}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    isLoadingTrackingNumbers || stats.validRows === 0 || stats.errorRows > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoadingTrackingNumbers
                    ? 'Vérification...'
                    : `Importer ${stats.validRows > 0 ? `${stats.validRows} colis` : ''}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <BulkImportProgressBar progress={progress} />
    </>
  );
};

export default BulkImportModal;
