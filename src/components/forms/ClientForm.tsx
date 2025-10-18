import React, { useState, useEffect } from 'react';
import { Save, X, Tag, User, Building, Phone, MapPin, Plus } from 'lucide-react';
import { clientService, ClientFormData } from '../../services/clientService';
import { clientShippingMarkService } from '../../services/clientShippingMarkService';
import { validateClientData, formatShippingMark, formatPhoneNumber } from '../../utils/clientValidation';
import toast from 'react-hot-toast';

interface ClientFormState {
  nom: string;
  prenom: string;
  pseudo: string;
  entreprise: string;
  quartier_ville: string;
  telephone: string;
  shipping_marks: string[];
}

interface ClientFormProps {
  isEditing?: boolean;
  initialData?: Partial<ClientFormState>;
  onCancel: () => void;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

export default function ClientForm({
  isEditing = false,
  initialData,
  onCancel,
  onSuccess,
  isSubmitting: externalSubmitting = false
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormState>({
    nom: '',
    prenom: '',
    pseudo: '',
    entreprise: '',
    quartier_ville: '',
    telephone: '',
    shipping_marks: []
  });
  const [newShippingMark, setNewShippingMark] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const isSubmitting = externalSubmitting || internalSubmitting;

  // Initialiser le formulaire avec les données initiales
  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        pseudo: initialData.pseudo || `${initialData.prenom || ''} ${initialData.nom || ''}`.trim(),
        entreprise: initialData.entreprise || '',
        quartier_ville: initialData.quartier_ville || '',
        telephone: initialData.telephone || '',
        shipping_marks: initialData.shipping_marks || []
      });
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      pseudo: '',
      entreprise: '',
      quartier_ville: '',
      telephone: '',
      shipping_marks: []
    });
    setNewShippingMark('');
    setValidationErrors([]);
  };

  const handleInputChange = (field: keyof ClientFormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddShippingMark = async () => {
    const formattedMark = formatShippingMark(newShippingMark);
    
    if (!formattedMark) {
      return;
    }
    
    if (formData.shipping_marks.includes(formattedMark)) {
      setValidationErrors(['Cette shipping mark existe déjà']);
      return;
    }
    
    try {
      // Vérifier si la shipping mark existe déjà dans la base de données
      const exists = await clientShippingMarkService.checkShippingMarkExists(formattedMark);
      if (exists) {
        setValidationErrors(['Cette shipping mark est déjà utilisée par un autre client']);
        return;
      }
      
      // Ajouter la shipping mark au formulaire
      setFormData(prev => ({
        ...prev,
        shipping_marks: [...prev.shipping_marks, formattedMark]
      }));
      setNewShippingMark('');
      setValidationErrors([]);
    } catch (error: any) {
      setValidationErrors([`Erreur lors de la vérification: ${error.message}`]);
    }
  };

  const handleRemoveShippingMark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shipping_marks: prev.shipping_marks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Soumission du formulaire client:', { isEditing, formData });
    
    // Validation côté client
    const validation = validateClientData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setValidationErrors([]);
    setInternalSubmitting(true);
    
    try {
      // Formater les données avant envoi
      const formattedData: ClientFormData = {
        ...formData,
        telephone: formData.telephone ? formatPhoneNumber(formData.telephone) : '',
        shipping_marks: formData.shipping_marks.map(formatShippingMark)
      };
      
      console.log('📤 Données formatées à envoyer:', formattedData);
      
      if (isEditing && initialData?.id) {
        // Mise à jour
        console.log('🔄 Mise à jour du client ID:', initialData.id);
        await clientService.update(initialData.id as number, formattedData);
        toast.success('Client mis à jour avec succès !');
      } else {
        // Création
        console.log('➕ Création d\'un nouveau client');
        await clientService.create(formattedData);
        toast.success('Client créé avec succès !');
      }
      
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('❌ Erreur lors de la soumission:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setInternalSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <User className="w-5 h-5 text-blue-600" />
        <span>{isEditing ? 'Modifier le client' : 'Nouveau client'}</span>
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom du client"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.prenom}
              onChange={(e) => handleInputChange('prenom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Prénom du client"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Pseudo pour le suivi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pseudo (pour le suivi) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.pseudo}
            onChange={(e) => handleInputChange('pseudo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pseudo unique pour le suivi des colis"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Ce pseudo sera utilisé par le client pour suivre ses colis
          </p>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entreprise
            </label>
            <input
              type="text"
              value={formData.entreprise}
              onChange={(e) => handleInputChange('entreprise', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom de l'entreprise"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quartier / Ville
            </label>
            <input
              type="text"
              value={formData.quartier_ville}
              onChange={(e) => handleInputChange('quartier_ville', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Quartier ou ville"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => handleInputChange('telephone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+261 34 12 345 67"
            disabled={isSubmitting}
          />
        </div>

        {/* Messages d'erreur de validation */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gestion des shipping marks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Shipping Marks</span>
          </label>
          
          {/* Ajouter une nouvelle shipping mark */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newShippingMark}
              onChange={(e) => setNewShippingMark(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddShippingMark();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ajouter une shipping mark..."
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={handleAddShippingMark}
              disabled={!newShippingMark.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Liste des shipping marks */}
          {formData.shipping_marks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Shipping marks associées :</p>
              <div className="flex flex-wrap gap-2">
                {formData.shipping_marks.map((mark, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200"
                  >
                    <Tag className="w-3 h-3" />
                    <span className="font-medium">{mark}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveShippingMark(index)}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-800 ml-1 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer le client')}
          </button>
        </div>
      </form>
    </div>
  );
}