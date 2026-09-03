import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { parseFile } from '../../utils/excelParser';
import { BulkImportRow } from '../../types/bulkImport';

interface BulkImportFileUploadProps {
  onFileLoaded: (rows: BulkImportRow[]) => void;
}

const BulkImportFileUpload: React.FC<BulkImportFileUploadProps> = ({ onFileLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const rows = await parseFile(file);

        if (rows.length === 0) {
          setError('Aucune donnée trouvée dans le fichier');
          return;
        }

        onFileLoaded(rows);
        setSuccess(`${rows.length} lignes chargées avec succès`);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la lecture du fichier');
      } finally {
        setLoading(false);
      }
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: loading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Lecture du fichier en cours...</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <>
                  <Upload className="w-12 h-12 text-blue-600" />
                  <p className="text-lg font-medium text-blue-600">
                    Déposez le fichier ici...
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      Glissez-déposez votre fichier Excel ou CSV ici
                    </p>
                    <p className="text-sm text-gray-500">
                      ou cliquez pour sélectionner un fichier
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>.xlsx</span>
                    <span>•</span>
                    <span>.xls</span>
                    <span>•</span>
                    <span>.csv</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start space-x-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Succès</p>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportFileUpload;
