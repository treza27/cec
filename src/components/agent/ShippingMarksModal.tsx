import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientShippingMarkService } from '../../services/clientShippingMarkService';

interface ShippingMarksModalProps {
  shippingMarks: string[];
  onUpdate: (marks: string[]) => void;
  onClose: () => void;
}

const ShippingMarksModal: React.FC<ShippingMarksModalProps> = ({
  shippingMarks,
  onUpdate,
  onClose,
}) => {
  const [marks, setMarks] = useState<string[]>(shippingMarks);
  const [newMark, setNewMark] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleAddMark = useCallback(async () => {
    const trimmedMark = newMark.trim().toUpperCase();

    if (!trimmedMark) {
      toast.error('Veuillez entrer une shipping mark');
      return;
    }

    if (marks.includes(trimmedMark)) {
      toast.error('Cette shipping mark est déjà dans la liste');
      return;
    }

    setIsChecking(true);
    try {
      const exists = await clientShippingMarkService.checkShippingMarkExists(trimmedMark);
      if (exists) {
        toast.error('Cette shipping mark est déjà utilisée par un autre client');
        return;
      }

      setMarks([...marks, trimmedMark]);
      setNewMark('');
      toast.success('Shipping mark ajoutée');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  }, [newMark, marks]);

  const handleRemoveMark = useCallback((mark: string) => {
    setMarks(marks.filter(m => m !== mark));
    toast.success('Shipping mark retirée');
  }, [marks]);

  const handleSave = useCallback(() => {
    onUpdate(marks);
    onClose();
  }, [marks, onUpdate, onClose]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMark();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleAddMark, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Tag className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Gérer les Shipping Marks</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Add new shipping mark */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ajouter une Shipping Mark
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMark}
                onChange={(e) => setNewMark(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Ex: ABC123"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isChecking}
              />
              <button
                onClick={handleAddMark}
                disabled={isChecking || !newMark.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Appuyez sur Entrée pour ajouter rapidement
            </p>
          </div>

          {/* List of shipping marks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Shipping Marks Actuelles ({marks.length})
            </label>

            {marks.length > 0 ? (
              <div className="space-y-2">
                {marks.map((mark, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg px-4 py-3 group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{mark}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMark(mark)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Aucune shipping mark. Ajoutez-en une ci-dessus.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingMarksModal;
