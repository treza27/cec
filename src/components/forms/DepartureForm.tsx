import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Package, Weight, Truck } from 'lucide-react';
import { departureSchema, DepartureFormData } from '../../schemas/departureSchema';
import { DepartItem } from '../../types';
import { getDepartureStatusLabel } from '../../utils/statusHelpers';
import { useInventory } from '../../hooks/useInventory';
import { calculateSelectionStats } from '../../utils/calculations';
import PackageSelectionModal from './PackageSelectionModal';

interface DepartureFormProps {
  initialData?: Partial<DepartItem>;
  onSubmit: (data: DepartureFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function DepartureForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Sauvegarder'
}: DepartureFormProps) {
  const { items: inventoryItems } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColisIds, setSelectedColisIds] = useState<number[]>(initialData?.colisAssocies || []);
  const [colisStats, setColisStats] = useState(() => {
    if (inventoryItems.length > 0) {
      return calculateSelectionStats(initialData?.colisAssocies || [], inventoryItems);
    }
    return { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 };
  });

  // Recalculer les stats quand les items de l'inventaire sont chargés
  useEffect(() => {
    if (inventoryItems.length > 0 && selectedColisIds.length > 0) {
      const stats = calculateSelectionStats(selectedColisIds, inventoryItems);
      setColisStats(stats);
    }
  }, [inventoryItems, selectedColisIds]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<DepartureFormData>({
    resolver: zodResolver(departureSchema),
    defaultValues: {
      numBL: initialData?.numBL || '',
      numTC: initialData?.numTC || '',
      dateChargement: initialData?.dateChargement || '',
      dateDepartChine: initialData?.dateDepartChine || '',
      dateArriveTamatave: initialData?.dateArriveTamatave || '',
      dateArriveTana: initialData?.dateArriveTana || '',
      dateReceptionColis: initialData?.dateReceptionColis || '',
      statut: initialData?.statut || 'preparation_depart',
      colisAssocies: selectedColisIds
    },
    mode: 'onChange'
  });

  const handlePackageSelection = (selectedIds: number[], stats: any) => {
    setSelectedColisIds(selectedIds);
    setColisStats(stats);
    setValue('colisAssocies', selectedIds);
  };

  const handleFormSubmit = (data: DepartureFormData) => {
    // Ajouter les totaux calculés aux données du formulaire
    const formDataWithTotals = {
      ...data,
      nbPalettesTotal: colisStats.nbPalettes,
      nbCartonsTotal: colisStats.nbCartons,
      poidsTotal: colisStats.poids,
      volumeTotal: colisStats.volume,
      colisAssocies: selectedColisIds
    };
    onSubmit(formDataWithTotals);
  };

  const statusOptions = [
    'preparation_depart',
    'conteneur_charge',
    'depart_chine',
    'arrivee_toamasina',
    'dedouanement_en_cours',
    'arrivee_antananarivo',
    'decharge_trie'
  ];

  const renderField = (
    name: keyof DepartureFormData,
    label: string,
    type: 'text' | 'date' | 'select' = 'text',
    options?: string[]
  ) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {departureSchema.shape[name]._def.typeName !== 'ZodOptional' && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          if (type === 'select' && options) {
            return (
              <select
                {...field}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[name] ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {name === 'statut' ? getDepartureStatusLabel(option as any) : option}
                  </option>
                ))}
              </select>
            );
          }

          return (
            <input
              {...field}
              type={type}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
          );
        }}
      />
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('numBL', 'Numéro BL')}
          {renderField('numTC', 'Numéro TC')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderField('dateChargement', 'Date de chargement', 'date')}
          {renderField('dateDepartChine', 'Date départ Chine', 'date')}
          {renderField('dateArriveTamatave', 'Date arrivée Tamatave', 'date')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderField('dateArriveTana', 'Date arrivée Tana', 'date')}
          {renderField('dateReceptionColis', 'Date réception colis', 'date')}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {renderField('statut', 'Statut', 'select', statusOptions)}
        </div>

        {/* Section de sélection des colis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Colis Associés</h3>
              <span className="text-sm text-gray-500">({selectedColisIds.length} sélectionné{selectedColisIds.length > 1 ? 's' : ''})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Sélectionner les colis</span>
            </button>
          </div>

          {/* Affichage des totaux */}
          {selectedColisIds.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Totaux calculés</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Palettes</p>
                    <p className="text-lg font-bold text-gray-900">{colisStats.nbPalettes}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Cartons</p>
                    <p className="text-lg font-bold text-gray-900">{colisStats.nbCartons}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Weight className="w-4 h-4 text-cyan-600" />
                  <div>
                    <p className="text-xs text-gray-500">Poids</p>
                    <p className="text-lg font-bold text-gray-900">{colisStats.poids.toFixed(1)} kg</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-500">Volume</p>
                    <p className="text-lg font-bold text-gray-900">{colisStats.volume.toFixed(1)} m³</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des colis sélectionnés (aperçu) */}
          {selectedColisIds.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Colis sélectionnés</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedColisIds.map(colisId => {
                  const colis = inventoryItems.find(item => item.id === colisId);
                  if (!colis) return null;
                  
                  return (
                    <div key={colisId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center space-x-2 mb-1 sm:mb-0">
                        <span className="font-medium text-gray-900">#{colis.id}</span>
                        <span className="text-blue-600">{colis.shippingMark || 'Sans shipping mark'}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 ml-6 sm:ml-0">
                        <span>{colis.nbPalettes} pal.</span>
                        <span>{colis.nbCartons} cart.</span>
                        <span>{colis.poids} kg</span>
                        <span>{colis.volume} m³</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modale de sélection des colis */}
        <PackageSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handlePackageSelection}
          inventoryItems={inventoryItems}
          initialSelectedIds={selectedColisIds}
        />

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Sauvegarde...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}