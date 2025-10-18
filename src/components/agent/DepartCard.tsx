import React, { useState } from 'react';
import { Edit, Save, X, Calendar, Package, Weight, Truck, Users, Ship, MapPin, Clock, Archive, AlertTriangle, Download } from 'lucide-react';
import { DepartItem, InventoryItem } from '../../types';
import { getDepartureStatusLabel, getDepartureStatusColor, departureToPackageStatusMap } from '../../utils/statusHelpers';
import DepartureForm from '../forms/DepartureForm';
import DepartImageUpload from './DepartImageUpload';

interface DepartCardProps {
  depart: DepartItem;
  inventoryItems: InventoryItem[];
  isEditing: boolean;
  isReadOnly?: boolean;
  isUpdating?: boolean;
  isArchiving?: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<DepartItem>) => void;
  onCancel: () => void;
  onArchive?: () => void;
}

// Fonction pour obtenir la couleur de fond et les styles selon le statut
const getDepartureCardStyle = (statut: string) => {
  switch (statut) {
    case 'preparation_depart':
      return {
        bgGradient: 'from-gray-100 via-gray-50 to-white',
        borderColor: 'border-gray-300',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        progressColor: 'bg-gray-400',
        progressWidth: '10%'
      };
    case 'conteneur_charge':
      return {
        bgGradient: 'from-orange-100 via-orange-50 to-white',
        borderColor: 'border-orange-300',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        progressColor: 'bg-orange-400',
        progressWidth: '25%'
      };
    case 'depart_chine':
      return {
        bgGradient: 'from-blue-100 via-blue-50 to-white',
        borderColor: 'border-blue-300',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        progressColor: 'bg-blue-400',
        progressWidth: '40%'
      };
    case 'arrivee_toamasina':
      return {
        bgGradient: 'from-cyan-100 via-cyan-50 to-white',
        borderColor: 'border-cyan-300',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        progressColor: 'bg-cyan-400',
        progressWidth: '60%'
      };
    case 'dedouanement_en_cours':
      return {
        bgGradient: 'from-purple-100 via-purple-50 to-white',
        borderColor: 'border-purple-300',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        progressColor: 'bg-purple-400',
        progressWidth: '75%'
      };
    case 'arrivee_antananarivo':
      return {
        bgGradient: 'from-indigo-100 via-indigo-50 to-white',
        borderColor: 'border-indigo-300',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        progressColor: 'bg-indigo-400',
        progressWidth: '90%'
      };
    case 'decharge_trie':
      return {
        bgGradient: 'from-green-100 via-green-50 to-white',
        borderColor: 'border-green-300',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        progressColor: 'bg-green-400',
        progressWidth: '100%'
      };
    default:
      return {
        bgGradient: 'from-gray-100 via-gray-50 to-white',
        borderColor: 'border-gray-300',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        progressColor: 'bg-gray-400',
        progressWidth: '0%'
      };
  }
};

// Fonction pour obtenir l'icône selon le statut
const getStatusIcon = (statut: string) => {
  switch (statut) {
    case 'preparation_depart':
      return Package;
    case 'conteneur_charge':
      return Truck;
    case 'depart_chine':
      return Ship;
    case 'arrivee_toamasina':
    case 'dedouanement_en_cours':
      return MapPin;
    case 'arrivee_antananarivo':
    case 'decharge_trie':
      return Clock;
    default:
      return Package;
  }
};

export default function DepartCard({
  depart,
  inventoryItems,
  isEditing,
  isReadOnly = false,
  isUpdating = false,
  isArchiving = false,
  onEdit,
  onSave,
  onCancel,
  onArchive
}: DepartCardProps) {
  const handleFormSubmit = (formData: any) => {
    onSave(formData);
  };

  const getColisForDepart = () => {
    return inventoryItems.filter(item => depart.colisAssocies.includes(item.id));
  };

  const associatedColis = getColisForDepart();

  // Calculer les totaux réels des colis associés
  const calculateRealTotals = () => {
    return associatedColis.reduce((totals, colis) => {
      return {
        nbPalettes: totals.nbPalettes + (parseInt(colis.nbPalettes) || 0),
        nbCartons: totals.nbCartons + (parseInt(colis.nbCartons) || 0),
        poids: totals.poids + (parseFloat(colis.poids) || 0),
        volume: totals.volume + (parseFloat(colis.volume) || 0)
      };
    }, { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 });
  };

  const realTotals = calculateRealTotals();

  const handleExportCsv = () => {
    // Préparer les données pour l'export CSV
    const csvHeaders = [
      'Num BL',
      'Num Conteneur',
      'Date Chargement',
      'Date Départ Chine',
      'Date Arrivée Tamatave',
      'Date Arrivée Tana',
      'Date Réception Colis',
      'ID Colis',
      'Shipping Mark',
      'Description',
      'Nb Palettes',
      'Nb Cartons',
      'Poids (kg)',
      'Volume (m³)',
      'Nb Palettes Tana',
      'Nb Cartons Tana',
      'Poids (kg) Tana',
      'Volume (m³) Tana',
      'Nature',
      'MSDS',
      'Statut Colis'
    ];

    // Fonction pour échapper les valeurs CSV
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Si la valeur contient des virgules, guillemets ou retours à la ligne, l'entourer de guillemets
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Fonction pour formater les dates
    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    };

    // Créer les lignes de données
    const csvRows = [csvHeaders.join(',')];
    
    associatedColis.forEach(colis => {
      const row = [
        escapeCsvValue(depart.numBL),
        escapeCsvValue(depart.numTC || ''),
        escapeCsvValue(formatDate(depart.dateChargement)),
        escapeCsvValue(formatDate(depart.dateDepartChine)),
        escapeCsvValue(formatDate(depart.dateArriveTamatave)),
        escapeCsvValue(formatDate(depart.dateArriveTana)),
        escapeCsvValue(formatDate(depart.dateReceptionColis)),
        escapeCsvValue(colis.id),
        escapeCsvValue(colis.shippingMark || ''),
        escapeCsvValue(colis.description),
        escapeCsvValue(colis.nbPalettes),
        escapeCsvValue(colis.nbCartons),
        escapeCsvValue(colis.poids),
        escapeCsvValue(colis.volume),
        escapeCsvValue(colis.nbPalettesTana || ''),
        escapeCsvValue(colis.nbCartonsTana || ''),
        escapeCsvValue(colis.poidsTana || ''),
        escapeCsvValue(colis.volumeTana || ''),
        escapeCsvValue(colis.nature || ''),
        escapeCsvValue(colis.msds ? 'Oui' : 'Non'),
        escapeCsvValue(colis.statut)
      ];
      csvRows.push(row.join(','));
    });

    // Créer le contenu CSV
    const csvContent = csvRows.join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `depart_${depart.id}_BL_${depart.numBL}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isEditing) {
    const cardStyle = getDepartureCardStyle(depart.statut);
    
    return (
      <div className={`bg-gradient-to-br ${cardStyle.bgGradient} rounded-2xl shadow-lg border-2 ${cardStyle.borderColor} p-3 relative overflow-hidden`}>
        {/* Décoration de fond */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-lg"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`p-2 ${cardStyle.iconBg} rounded-xl shadow-md`}>
                <Edit className={`w-6 h-6 ${cardStyle.iconColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Départ #{depart.id} - BL: {depart.numBL}
                </h3>
                <p className="text-sm text-gray-600">
                  BL: {depart.numBL} • 
                  {depart.numTC ? `Conteneur: ${depart.numTC}` : 'Modification en cours'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onCancel}
              disabled={isUpdating}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
              title="Annuler les modifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <DepartureForm
            initialData={depart}
            onSubmit={handleFormSubmit}
            onCancel={onCancel}
            isSubmitting={isUpdating}
            submitLabel="Sauvegarder les modifications"
          />
        </div>
      </div>
    );
  }

  const cardStyle = getDepartureCardStyle(depart.statut);
  const StatusIcon = getStatusIcon(depart.statut);

  return (
    <div className={`bg-gradient-to-br ${cardStyle.bgGradient} rounded-2xl shadow-lg border-2 ${cardStyle.borderColor} p-3 relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Décoration de fond */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-lg"></div>
      
      <div className="relative z-10">
        {/* Barre de progression */}
        <div className="mb-2">
          <div className="w-full bg-white/50 rounded-full h-2 shadow-inner">
            <div
              className={`h-2 ${cardStyle.progressColor} rounded-full transition-all duration-1000 ease-out shadow-sm`}
              style={{ width: cardStyle.progressWidth }} // Utilisez la largeur calculée
            ></div>
          </div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className={`p-2 ${cardStyle.iconBg} rounded-xl shadow-md border border-white/50`}>
              <StatusIcon className={`w-6 h-6 ${cardStyle.iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Départ #{depart.id} - BL: {depart.numBL}
              </h3>
              <p className="text-sm text-gray-600">
                {associatedColis.length} colis associés
              </p>
              {depart.numTC && (
                <p className="text-sm text-blue-600 font-medium">Conteneur: {depart.numTC}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-2 py-0.5 rounded-xl text-xs font-bold border-2 shadow-md ${getDepartureStatusColor(depart.statut)} backdrop-blur-sm`}>
              {getDepartureStatusLabel(depart.statut)}
            </span>
            
            <div className="flex items-center space-x-2">
              {!isReadOnly && (
                <button
                  onClick={onEdit}
                  disabled={isUpdating || isArchiving}
                  className={`${cardStyle.iconColor} hover:scale-110 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50`}
                  title="Modifier le départ"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              
              {!isReadOnly && onArchive && depart.statut !== 'archive' && (
                <button
                  onClick={onArchive}
                  disabled={isUpdating || isArchiving}
                  className="text-orange-600 hover:text-orange-800 hover:scale-110 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50"
                  title="Archiver le départ"
                >
                  {isArchiving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                  ) : (
                    <Archive className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats avec design amélioré */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 mb-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 shadow-md border border-white/50 hover:bg-white/90 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Palettes</span>
                <p className="text-lg font-bold text-gray-900">{realTotals.nbPalettes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 shadow-md border border-white/50 hover:bg-white/90 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Cartons</span>
                <p className="text-lg font-bold text-gray-900">{realTotals.nbCartons}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 shadow-md border border-white/50 hover:bg-white/90 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Weight className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Poids</span>
                <p className="text-lg font-bold text-gray-900">{realTotals.poids.toFixed(1)} kg</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 shadow-md border border-white/50 hover:bg-white/90 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">Volume</span>
                <p className="text-lg font-bold text-gray-900">{realTotals.volume.toFixed(1)} m³</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates avec design amélioré */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 mb-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1 bg-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Chargement</span>
            </div>
            <p className="text-xs font-bold text-gray-900">
              {depart.dateChargement ? new Date(depart.dateChargement).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1 bg-orange-100 rounded-lg">
                <Ship className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Départ Chine</span>
            </div>
            <p className="text-xs font-bold text-gray-900">
              {depart.dateDepartChine ? new Date(depart.dateDepartChine).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1 bg-cyan-100 rounded-lg">
                <MapPin className="w-4 h-4 text-cyan-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Arrivée Tamatave</span>
            </div>
            <p className="text-xs font-bold text-gray-900">
              {depart.dateArriveTamatave ? new Date(depart.dateArriveTamatave).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1 bg-green-100 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Arrivée Tana</span>
            </div>
            <p className="text-xs font-bold text-gray-900">
              {depart.dateArriveTana ? new Date(depart.dateArriveTana).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1 bg-emerald-100 rounded-lg">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Réception Colis</span>
            </div>
            <p className="text-xs font-bold text-gray-900">
              {depart.dateReceptionColis ? new Date(depart.dateReceptionColis).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
        </div>

        {/* Liste des colis associés */}
        {associatedColis.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1 bg-blue-100 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between w-full">
                <h4 className="text-sm font-bold text-gray-800">Colis associés ({associatedColis.length})</h4>
                {associatedColis.length > 0 && (
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                    title="Exporter la liste des colis en CSV"
                  >
                    <Download className="w-3 h-3" />
                    <span>Exporter</span>
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 max-h-32 overflow-y-auto border border-white/50 shadow-inner">
              <div className="space-y-0">
                {associatedColis.map((colis) => (
                  <div key={colis.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 items-start sm:items-center text-xs bg-white/50 rounded-lg px-1 py-0.5 hover:bg-white/70 transition-colors duration-200">
                    <div className="sm:col-span-6 flex items-center space-x-1 min-w-0 w-full">
                      <span className="font-bold text-gray-900 bg-white/70 px-1 py-0.5 rounded-md">#{colis.id}</span>
                      <span className="text-blue-700 font-medium truncate">{colis.shippingMark || 'Sans shipping mark'}</span>
                      <span className="text-gray-600 truncate hidden sm:inline">{colis.description}</span>
                    </div>
                    <div className="sm:col-span-6 grid grid-cols-4 gap-1 text-xs text-gray-600 font-medium w-full">
                      <div className="text-center sm:text-center">
                        <span className="bg-white/70 px-2 py-1 rounded block">{colis.nbPalettes} pal.</span>
                      </div>
                      <div className="text-center sm:text-center">
                        <span className="bg-white/70 px-2 py-1 rounded block">{colis.nbCartons} cart.</span>
                      </div>
                      <div className="text-center sm:text-center">
                        <span className="bg-white/70 px-2 py-1 rounded block">{colis.poids} kg</span>
                      </div>
                      <div className="text-center sm:text-center">
                        <span className="bg-white/70 px-2 py-1 rounded block">{colis.volume} m³</span>
                      </div>
                    </div>
                    {/* Description visible sur mobile */}
                    <div className="sm:hidden w-full mt-1">
                      <span className="text-xs text-gray-600 italic">{colis.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section d'upload d'images */}
        {!isReadOnly && depart.statut !== 'archive' && (
          <div className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Images de chargement */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center space-x-1">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Images de chargement</span>
              </h4>
              <DepartImageUpload
                departId={depart.id}
                imageType="chargement"
                maxImages={3}
                className="compact-mode"
              />
            </div>

            {/* Images de suivi maritime */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center space-x-1">
                <Ship className="w-4 h-4 text-cyan-600" />
                <span>Suivi maritime</span>
              </h4>
              <DepartImageUpload
                departId={depart.id}
                imageType="suivi_maritime"
                maxImages={5}
                className="compact-mode"
              />
            </div>

            {/* Images de réception */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 shadow-md">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center space-x-1">
                <Package className="w-4 h-4 text-green-600" />
                <span>Réception colis</span>
              </h4>
              <DepartImageUpload
                departId={depart.id}
                imageType="reception"
                maxImages={5}
                className="compact-mode"
              />
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}