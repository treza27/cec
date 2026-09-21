import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Download, AlertCircle, CheckCircle, User } from 'lucide-react';
import { deliveryReceiptService, DeliveryReceiptUpload as DeliveryReceiptUploadType } from '../../services/deliveryReceiptService';
import { DeliveryReceipt } from '../../types';
import toast from 'react-hot-toast';

interface DeliveryReceiptUploadProps {
  departId: number;
  clientId: number;
  pseudo: string;
  colisIds: number[];
  shippingMarks: string[];
  existingReceipts: DeliveryReceipt[];
  onReceiptUploaded: () => void;
  className?: string;
}

export default function DeliveryReceiptUpload({
  departId,
  clientId,
  pseudo,
  colisIds,
  shippingMarks,
  existingReceipts,
  onReceiptUploaded,
  className = ''
}: DeliveryReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const uploadData: DeliveryReceiptUploadType = {
        depart_id: departId,
        client_id: clientId,
        client_name: pseudo,
        colis_ids: colisIds,
        shipping_marks: shippingMarks,
        file
      };

      await deliveryReceiptService.uploadDeliveryReceipt(uploadData);
      toast.success(`Bon de livraison uploadé pour ${pseudo}`);
      onReceiptUploaded();
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'upload';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadReceipt = async (receipt: DeliveryReceipt) => {
    try {
      const url = await deliveryReceiptService.getDeliveryReceiptUrl(receipt.file_path);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = receipt.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bon de livraison ?')) {
      return;
    }

    try {
      await deliveryReceiptService.deleteDeliveryReceipt(receiptId);
      toast.success('Bon de livraison supprimé');
      onReceiptUploaded(); // Refresh la liste
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec info client */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{pseudo}</h4>
            <p className="text-xs text-gray-600">
              {colisIds.length} colis • {shippingMarks.join(', ')}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {existingReceipts.length} bon{existingReceipts.length > 1 ? 's' : ''} de livraison
        </div>
      </div>

      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="space-y-2">
          <FileText className="w-6 h-6 text-gray-400 mx-auto" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {uploading ? 'Upload en cours...' : 'Ajouter un bon de livraison'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Fichier PDF uniquement, max 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des bons de livraison existants */}
      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-700 flex items-center space-x-2">
            <FileText className="w-3 h-3" />
            <span>Bons de livraison ({existingReceipts.length})</span>
          </h5>
          
          <div className="space-y-2">
            {existingReceipts.map((receipt) => (
              <div key={receipt.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {receipt.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(receipt.file_size)} • {new Date(receipt.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleDownloadReceipt(receipt)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReceipt(receipt.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-green-600 text-xs mt-2">
                  <CheckCircle className="w-3 h-3" />
                  <span>Bon de livraison uploadé</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}