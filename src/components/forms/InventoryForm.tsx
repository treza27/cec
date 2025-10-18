import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { inventorySchema, InventoryFormData } from '../../schemas/inventorySchema';
import { InventoryItem } from '../../types';

interface InventoryFormProps {
  initialData?: Partial<InventoryItem>;
  onSubmit: (data: InventoryFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  shippingMarks?: string[];
}

export default function InventoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Sauvegarder',
  shippingMarks = []
}: InventoryFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      bl: initialData?.bl || '',
      dateEntree: initialData?.dateEntree || new Date().toISOString().split('T')[0],
      numRecu: initialData?.numRecu || '',
      entrepot: initialData?.entrepot as 'Guangzhou' | 'Yiwu' || undefined,
      shippingMark: initialData?.shippingMark || '',
      description: initialData?.description || '',
      nbPalettes: initialData?.nbPalettes || '0',
      nbCartons: initialData?.nbCartons || '1',
      poids: initialData?.poids || '',
      volume: initialData?.volume || '',
      nature: initialData?.nature as 'GG' | 'SG' | 'DG' || undefined,
      msds: initialData?.msds || false,
      statut: initialData?.statut || 'enregistre_chine'
    },
    mode: 'onChange'
  });

  const renderField = (
    name: keyof InventoryFormData,
    label: string,
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' = 'text',
    options?: string[]
  ) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">
        {label}
        {inventorySchema.shape[name]._def.typeName !== 'ZodOptional' && (
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
                className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                  errors[name] ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Sélectionner</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }

          if (type === 'checkbox') {
            return (
              <input
                {...field}
                type="checkbox"
                checked={field.value as boolean}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            );
          }

          return (
            <input
              {...field}
              type={type}
              step={name === 'nbPalettes' || name === 'nbCartons' ? '1' : type === 'number' ? '0.1' : undefined}
              min={type === 'number' ? '0' : undefined}
              className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
          );
        }}
      />
      {errors[name] && (
        <p className="text-xs text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderField('dateEntree', 'Date d\'entrée', 'date')}
        {renderField('numRecu', 'Numéro reçu')}
        {renderField('entrepot', 'Entrepôt', 'select', ['Guangzhou', 'Yiwu'])}
        <div></div> {/* Placeholder pour maintenir la grille */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Shipping Mark
          </label>
          <Controller
            name="shippingMark"
            control={control}
            render={({ field }) => (
              <>
                <input
                  {...field}
                  type="text"
                  list="shipping-marks-list"
                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                    errors.shippingMark ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                  placeholder="Sélectionner ou saisir..."
                />
                <datalist id="shipping-marks-list">
                  {shippingMarks.map((mark) => (
                    <option key={mark} value={mark} />
                  ))}
                </datalist>
              </>
            )}
          />
          {errors.shippingMark && (
            <p className="text-xs text-red-600">{errors.shippingMark?.message}</p>
          )}
        </div>
        {renderField('description', 'Description')}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderField('nbPalettes', 'Nb Palettes', 'number')}
        {renderField('nbCartons', 'Nb Cartons', 'number')}
        {renderField('poids', 'Poids (kg)', 'number')}
        {renderField('volume', 'Volume (m³)', 'number')}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {renderField('nature', 'Nature', 'select', ['GG', 'SG', 'DG'])}
        <div className="flex items-center space-x-2">
          {renderField('msds', 'MSDS', 'checkbox')}
          <span className="text-xs text-gray-600">Fiche de sécurité</span>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <X className="w-4 h-4 inline mr-1" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {isSubmitting ? 'Sauvegarde...' : submitLabel}
        </button>
      </div>
    </form>
  );
}