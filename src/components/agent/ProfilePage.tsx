import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Shield, CreditCard as Edit, Save, X, Camera, AlertCircle, Trash2 } from 'lucide-react';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { EmployeeFormData } from '../../services/employeeService';

const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  commercial: 'Commercial',
  acheteur: 'Acheteur',
  logisticien: 'Logisticien',
  tresorier: 'Trésorier',
};

export default function ProfilePage() {
  const {
    profileData,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    createDefaultProfile,
    isUpdating,
    isCreating,
    isUploadingAvatar,
    isDeletingAvatar,
  } = useEmployeeProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EmployeeFormData>({
    full_name: '',
    email: '',
    telephone: '',
    role: '',
    departement: ''
  });

  // Initialiser les données d'édition quand le profil est chargé
  React.useEffect(() => {
    if (profileData) {
      setEditData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        telephone: profileData.telephone || '',
        role: profileData.role || '',
        departement: profileData.departement || ''
      });
    }
  }, [profileData]);

  // Créer un profil par défaut si aucun n'existe
  React.useEffect(() => {
    if (!loading && !profileData && !error) {
      createDefaultProfile();
    }
  }, [loading, profileData, error, createDefaultProfile]);

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // L'erreur sera gérée par le hook et affichée via toast
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profileData) {
      setEditData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        telephone: profileData.telephone || '',
        role: profileData.role || '',
        departement: profileData.departement || ''
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAvatar = async () => {
    await deleteAvatar();
  };

  const isAvatarLoading = isUploadingAvatar || isDeletingAvatar;

  // Affichage du chargement
  if (loading || isCreating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          {isCreating ? 'Création du profil...' : 'Chargement du profil...'}
        </span>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement du profil</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si aucun profil n'existe encore
  if (!profileData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <User className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Profil en cours de création</h3>
            <p className="text-blue-700">Votre profil est en cours de création. Veuillez patienter...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec photo de profil */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 sm:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            {/* Photo de profil */}
            <div className="relative group flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isAvatarLoading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
                ) : profileData?.profile_picture_url ? (
                  <img
                    src={profileData.profile_picture_url}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={isAvatarLoading}
                title="Changer la photo de profil"
                className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 border-2 border-white disabled:opacity-50"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              {profileData?.profile_picture_url && !isAvatarLoading && (
                <button
                  onClick={handleDeleteAvatar}
                  title="Supprimer la photo de profil"
                  className="absolute top-0 right-0 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 border-2 border-white"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>

            {/* Informations principales */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {profileData.full_name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-blue-100">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">{(profileData.role && ROLE_LABELS[profileData.role]) || profileData.role}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>{profileData.email}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center sm:justify-start">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isUpdating}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 border border-white/30 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span>{isEditing ? 'Annuler' : 'Modifier le profil'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <User className="w-6 h-6 text-blue-600" />
              <span>Informations Personnelles</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom complet
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isUpdating}
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{profileData.full_name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isUpdating}
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{profileData.email}</span>
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isUpdating}
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{profileData.telephone}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span>Informations Professionnelles</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Rôle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rôle
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-900 font-medium">{profileData.role}</span>
              </div>
            </div>

            {/* Département */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Département
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900 font-medium">{profileData.departement}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ce champ est géré par l'administration et ne peut être modifié que depuis Supabase
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      {isEditing && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            <span>Annuler</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}