import React, { useState, memo, useCallback } from 'react';
import { Search, User, Package } from 'lucide-react';
import { InventoryItem } from '../types';
import { inventoryService } from '../services/inventoryService';
import { useDebounce } from '../hooks/useDebounce';

interface TrackingFormProps {
  onTrackingResult: (packages: InventoryItem[] | null, pseudo?: string) => void;
}

const TrackingForm = memo(function TrackingForm({ onTrackingResult }: TrackingFormProps) {
  const [formData, setFormData] = useState({
    pseudo: '',
    phone: '',
    trackingNumber: ''
  });
  const [searchMode, setSearchMode] = useState<'client' | 'tracking'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce pour éviter les recherches trop fréquentes
  const debouncedPseudo = useDebounce(formData.pseudo, 300);
  const debouncedPhone = useDebounce(formData.phone, 300);
  const debouncedTrackingNumber = useDebounce(formData.trackingNumber, 300);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let foundPackages: InventoryItem[];

      if (searchMode === 'tracking') {
        console.log('🔍 TrackingForm - Recherche par numéro de suivi:', formData.trackingNumber);
        foundPackages = await inventoryService.searchByTrackingNumber(formData.trackingNumber);
      } else {
        console.log('🔍 TrackingForm - Recherche avec pseudo et téléphone:', { pseudo: formData.pseudo, phone: formData.phone });
        foundPackages = await inventoryService.searchPackagesByClientInfo({
          pseudo: formData.pseudo,
          phone: formData.phone
        });
      }

      console.log('📦 TrackingForm - Colis trouvés:', foundPackages.length);
      if (foundPackages.length > 0) {
        console.log('📋 TrackingForm - Détails des colis trouvés:', foundPackages.map(p => ({
          id: p.id,
          shipping_mark: p.shippingMark,
          description: p.description,
          statut: p.statut,
          client_pseudo: p.client_pseudo
        })));
      }

      if (foundPackages.length > 0) {
        onTrackingResult(foundPackages, searchMode === 'client' ? formData.pseudo : undefined);
      } else {
        console.log('❌ TrackingForm - Aucun colis trouvé');
        if (searchMode === 'client') {
          setError('Aucun colis trouvé pour ce pseudo et numéro de téléphone. Vérifiez que votre pseudo et téléphone sont corrects.');
        } else {
          setError('Aucun colis trouvé avec ce numéro de suivi. Vérifiez le numéro saisi.');
        }
        onTrackingResult(null, searchMode === 'client' ? formData.pseudo : undefined);
      }
    } catch (error: any) {
      console.error('❌ TrackingForm - Erreur lors de la recherche:', error);
      setError(`Erreur lors de la recherche: ${error.message}`);
      onTrackingResult(null, searchMode === 'client' ? formData.pseudo : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [formData.pseudo, formData.phone, formData.trackingNumber, searchMode, onTrackingResult]);

  const handleInputChange = useCallback((field: 'pseudo' | 'phone' | 'trackingNumber', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 lg:mb-6">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Suivre votre colis
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
            Recherchez vos colis par vos informations client ou par numéro de suivi
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 xl:p-12">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-100">
              <button
                type="button"
                onClick={() => setSearchMode('client')}
                className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  searchMode === 'client'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Par client
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('tracking')}
                className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  searchMode === 'tracking'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Par numéro de suivi
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
              {searchMode === 'client' ? (
                <>
                  <div>
                    <label htmlFor="pseudo-input" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Pseudo du client *
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        id="pseudo-input"
                        type="text"
                        required
                        value={formData.pseudo}
                        onChange={(e) => handleInputChange('pseudo', e.target.value)}
                        placeholder="Entrez votre pseudo client"
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Utilisez le pseudo qui vous a été attribué par CEC
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phone-input" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Numéro de téléphone *
                    </label>
                    <div className="relative">
                      <Package className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        id="phone-input"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Ex: 034 12 345 67"
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="tracking-input" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Numéro de tracking *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      id="tracking-input"
                      type="text"
                      required
                      value={formData.trackingNumber}
                      onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                      placeholder="Ex: TRK123456789"
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <p className="text-red-600 text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mx-auto min-w-[180px] sm:min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Suivre mon colis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
});

export default TrackingForm;