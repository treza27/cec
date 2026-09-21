import React, { useState, useEffect } from 'react';
import { CreditCard as Edit, Save, X, Calendar, Package, Weight, Truck, Users, Ship, MapPin, Clock, Archive, AlertTriangle, Download, Eye } from 'lucide-react';
import { DepartItem, InventoryItem } from '../../types';
import { getDepartureStatusLabel, getDepartureStatusColor, departureToPackageStatusMap } from '../../utils/statusHelpers';
import DepartureForm from '../forms/DepartureForm';
import DepartImageUpload from './DepartImageUpload';
import ColisModal from './ColisModal';
import DepartDetailsPanel from './DepartDetailsPanel';
import { inventoryService } from '../../services/inventoryService';

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
  const [isColisModalOpen, setIsColisModalOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [extraColis, setExtraColis] = useState<InventoryItem[]>([]);

  const handleFormSubmit = (formData: any) => {
    onSave(formData);
  };

  const colisIdSet = new Set(depart.colisAssocies.map(Number));
  const colisFromInventory = inventoryItems.filter(item => colisIdSet.has(Number(item.id)));
  const foundIds = new Set(colisFromInventory.map(c => Number(c.id)));
  const missingIds = depart.colisAssocies.filter(id => !foundIds.has(Number(id)));

  useEffect(() => {
    if (missingIds.length === 0) {
      setExtraColis([]);
      return;
    }
    inventoryService.getByIds(missingIds).then(setExtraColis).catch(() => setExtraColis([]));
  }, [depart.colisAssocies.join(','), missingIds.join(',')]);

  const associatedColis = [...colisFromInventory, ...extraColis];

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

  const formatShortDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '-';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${cardStyle.bgGradient} rounded-xl shadow-md border-2 ${cardStyle.borderColor} p-2 relative hover:shadow-lg transition-all duration-300 ${isDetailsPanelOpen ? 'z-50' : 'z-0'}`}>
      <div className="relative z-10">
        {/* Barre de progression */}
        <div className="mb-1.5">
          <div className="w-full bg-white/50 rounded-full h-1.5 shadow-inner">
            <div
              className={`h-1.5 ${cardStyle.progressColor} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: cardStyle.progressWidth }}
            ></div>
          </div>
        </div>

        {/* Header compact */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 ${cardStyle.iconBg} rounded-lg`}>
              <StatusIcon className={`w-4 h-4 ${cardStyle.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-gray-900">
                  Départ #{depart.id} - BL: {depart.numBL}
                </h3>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${getDepartureStatusColor(depart.statut)}`}>
                  {getDepartureStatusLabel(depart.statut)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>{depart.colisAssocies.length} colis</span>
                {depart.numTC && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-blue-600 font-medium">{depart.numTC}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {!isReadOnly && (
              <button
                onClick={onEdit}
                disabled={isUpdating || isArchiving}
                className={`${cardStyle.iconColor} p-1.5 hover:bg-white/50 rounded-md transition-all disabled:opacity-50`}
                title="Modifier le départ"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {!isReadOnly && onArchive && depart.statut !== 'archive' && (
              <button
                onClick={onArchive}
                disabled={isUpdating || isArchiving}
                className="text-orange-600 hover:text-orange-800 p-1.5 hover:bg-white/50 rounded-md transition-all disabled:opacity-50"
                title="Archiver le départ"
              >
                {isArchiving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dates de transit en ligne */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 mb-2 border border-white/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 group" title="Chargement">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Charg.</span>
              <span className="font-semibold text-gray-900">{formatShortDate(depart.dateChargement)}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-1 group" title="Départ Chine">
              <Ship className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">Dép.</span>
              <span className="font-semibold text-gray-900">{formatShortDate(depart.dateDepartChine)}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-1 group" title="Arrivée Tamatave">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span className="text-gray-600">TM</span>
              <span className="font-semibold text-gray-900">{formatShortDate(depart.dateArriveTamatave)}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-1 group" title="Arrivée Tana">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">TN</span>
              <span className="font-semibold text-gray-900">{formatShortDate(depart.dateArriveTana)}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-1 group" title="Réception Colis">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600">Récep.</span>
              <span className="font-semibold text-gray-900">{formatShortDate(depart.dateReceptionColis)}</span>
            </div>
          </div>
        </div>

        {/* Stats compacts en une seule ligne */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 mb-2 border border-white/50">
          <div className="flex items-center justify-around text-sm">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">Pal.</span>
              <span className="font-bold text-gray-900">{depart.nbPalettesTotal ?? 0}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">Cart.</span>
              <span className="font-bold text-gray-900">{depart.nbCartonsTotal ?? 0}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-1">
              <Weight className="w-4 h-4 text-cyan-600" />
              <span className="font-bold text-gray-900">{Number(depart.poidsTotal ?? 0).toFixed(1)} kg</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-1">
              <Truck className="w-4 h-4 text-green-600" />
              <span className="font-bold text-gray-900">{Number(depart.volumeTotal ?? 0).toFixed(1)} m³</span>
            </div>
          </div>
        </div>

        {/* Lien discret pour voir les colis + Panneau de détails */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsColisModalOpen(true)}
            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Voir les {depart.colisAssocies.length} colis</span>
          </button>

          {!isReadOnly && depart.statut !== 'archive' && (
            <DepartDetailsPanel
              depart={depart}
              isOpen={isDetailsPanelOpen}
              onToggle={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
              isReadOnly={isReadOnly}
            />
          )}
        </div>
      </div>

      {/* Modale des colis */}
      <ColisModal
        isOpen={isColisModalOpen}
        onClose={() => setIsColisModalOpen(false)}
        depart={depart}
        colis={associatedColis}
      />
    </div>
  );
}