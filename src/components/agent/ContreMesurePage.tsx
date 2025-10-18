import React, { useState } from 'react';
import { AlertTriangle, Package, Weight, Truck, Save, Calculator, Eye, EyeOff } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useDepartures } from '../../hooks/useDepartures';

export default function ContreMesurePage() {
  const { items: inventoryItems, updateMeasuredValues, isUpdatingMeasuredValues } = useInventory();
  const { items: departItems } = useDepartures();
  const [editingColis, setEditingColis] = useState<{ [key: string]: boolean }>({});
  const [measuredValues, setMeasuredValues] = useState<{ [key: number]: {
    nbPalettesTana: string;
    nbCartonsTana: string;
    poidsTana: string;
    volumeTana: string;
  } }>({});
  const [expandedDeparts, setExpandedDeparts] = useState<{ [key: number]: boolean }>({});

  // Filtrer les départs qui sont arrivés à Tana (statut approprié)
  const departsArrivedTana = departItems.filter(depart => 
    depart.statut === 'arrivee_antananarivo' || depart.statut === 'decharge_trie'
  );

  const calculateDifference = (measured: string, original: string): number => {
    const measuredNum = parseFloat(measured) || 0;
    const originalNum = parseFloat(original) || 0;
    return measuredNum - originalNum;
  };

  const getDifferenceColor = (difference: number): string => {
    if (difference === 0) return 'text-gray-600';
    if (difference > 0) return 'text-green-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatDifference = (difference: number, unit: string = ''): string => {
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference.toFixed(difference % 1 === 0 ? 0 : 1)}${unit}`;
  };

  const handleEditToggle = (colisId: number, departId: number) => {
    const key = `${departId}-${colisId}`;
    setEditingColis(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Initialiser les valeurs mesurées si elles n'existent pas
    if (!measuredValues[colisId]) {
      const colis = inventoryItems.find(item => item.id === colisId);
      if (colis) {
        setMeasuredValues(prev => ({
          ...prev,
          [colisId]: {
            nbPalettesTana: colis.nbPalettesTana || '',
            nbCartonsTana: colis.nbCartonsTana || '',
            poidsTana: colis.poidsTana || '',
            volumeTana: colis.volumeTana || ''
          }
        }));
      }
    }
  };

  const handleSave = (colisId: number, departId: number) => {
    const values = measuredValues[colisId];
    if (values) {
      updateMeasuredValues(colisId, values);
      const key = `${departId}-${colisId}`;
      setEditingColis(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleInputChange = (colisId: number, field: string, value: string) => {
    setMeasuredValues(prev => ({
      ...prev,
      [colisId]: {
        ...prev[colisId],
        [field]: value
      }
    }));
  };

  const toggleDepartExpansion = (departId: number) => {
    setExpandedDeparts(prev => ({
      ...prev,
      [departId]: !prev[departId]
    }));
  };

  const getColisForDepart = (departId: number) => {
    const depart = departItems.find(d => d.id === departId);
    if (!depart) return [];
    
    return inventoryItems.filter(item => depart.colisAssocies.includes(item.id));
  };

  const calculateDepartStats = (departId: number) => {
    const colis = getColisForDepart(departId);
    const totalDiffPalettes = colis.reduce((sum, item) => {
      const measured = measuredValues[item.id]?.nbPalettesTana || item.nbPalettesTana || item.nbPalettes;
      return sum + calculateDifference(measured, item.nbPalettes);
    }, 0);
    
    const totalDiffCartons = colis.reduce((sum, item) => {
      const measured = measuredValues[item.id]?.nbCartonsTana || item.nbCartonsTana || item.nbCartons;
      return sum + calculateDifference(measured, item.nbCartons);
    }, 0);
    
    const totalDiffPoids = colis.reduce((sum, item) => {
      const measured = measuredValues[item.id]?.poidsTana || item.poidsTana || item.poids;
      return sum + calculateDifference(measured, item.poids);
    }, 0);
    
    const totalDiffVolume = colis.reduce((sum, item) => {
      const measured = measuredValues[item.id]?.volumeTana || item.volumeTana || item.volume;
      return sum + calculateDifference(measured, item.volume);
    }, 0);

    return { totalDiffPalettes, totalDiffCartons, totalDiffPoids, totalDiffVolume };
  };

  if (departsArrivedTana.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contre mesure</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ disponible</h3>
          <p className="text-gray-600">
            Les départs doivent être arrivés à Antananarivo pour apparaître dans cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contre mesure</h2>
          <p className="text-gray-600">Vérification des colis arrivés au dépôt de Tana</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Package className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Départs à vérifier</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{departsArrivedTana.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Package className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Colis total</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {departsArrivedTana.reduce((sum, depart) => sum + depart.colisAssocies.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <Calculator className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">En cours de vérif.</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {Object.keys(editingColis).filter(key => editingColis[key]).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Save className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Vérifiés</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {inventoryItems.filter(item => 
                  item.nbPalettesTana && item.nbCartonsTana && item.poidsTana && item.volumeTana
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des départs */}
      <div className="space-y-6">
        {departsArrivedTana.map((depart) => {
          const colisForDepart = getColisForDepart(depart.id);
          const isExpanded = expandedDeparts[depart.id];
          const stats = calculateDepartStats(depart.id);
          
          return (
            <div key={depart.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Header du départ */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Départ #{depart.id} - {depart.numBL}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {colisForDepart.length} colis • Arrivé le {depart.dateArriveTana ? new Date(depart.dateArriveTana).toLocaleDateString('fr-FR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row items-end lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
                    {/* Résumé des différences */}
                    <div className="hidden xl:flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Diff. totales:</span>
                        <span className={getDifferenceColor(stats.totalDiffPalettes)}>
                          {formatDifference(stats.totalDiffPalettes)} pal.
                        </span>
                        <span className={getDifferenceColor(stats.totalDiffCartons)}>
                          {formatDifference(stats.totalDiffCartons)} cart.
                        </span>
                        <span className={getDifferenceColor(stats.totalDiffPoids)}>
                          {formatDifference(stats.totalDiffPoids, ' kg')}
                        </span>
                        <span className={getDifferenceColor(stats.totalDiffVolume)}>
                          {formatDifference(stats.totalDiffVolume, ' m³')}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleDepartExpansion(depart.id)}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 text-sm"
                    >
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isExpanded ? 'Masquer' : 'Voir les colis'}</span>
                      <span className="sm:hidden">{isExpanded ? 'Masquer' : 'Voir'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tableau des colis */}
              {isExpanded && (
                <div className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pal. Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pal. Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart. Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart. Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Poids Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Poids Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Diff.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vol. Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vol. Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Diff.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {colisForDepart.map((colis) => {
                          const editKey = `${depart.id}-${colis.id}`;
                          const isEditing = editingColis[editKey];
                          const currentValues = measuredValues[colis.id] || {
                            nbPalettesTana: colis.nbPalettesTana || '',
                            nbCartonsTana: colis.nbCartonsTana || '',
                            poidsTana: colis.poidsTana || '',
                            volumeTana: colis.volumeTana || ''
                          };

                          const diffPalettes = currentValues.nbPalettesTana ? calculateDifference(currentValues.nbPalettesTana, colis.nbPalettes) : 0;
                          const diffCartons = currentValues.nbCartonsTana ? calculateDifference(currentValues.nbCartonsTana, colis.nbCartons) : 0;
                          const diffPoids = currentValues.poidsTana ? calculateDifference(currentValues.poidsTana, colis.poids) : 0;
                          const diffVolume = currentValues.volumeTana ? calculateDifference(currentValues.volumeTana, colis.volume) : 0;

                          return (
                            <tr key={colis.id} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{colis.shippingMark}</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 max-w-32 truncate hidden sm:table-cell">{colis.description}</td>
                              
                              {/* Palettes */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50">{colis.nbPalettes}</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={currentValues.nbPalettesTana}
                                    onChange={(e) => handleInputChange(colis.id, 'nbPalettesTana', e.target.value)}
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    step="1"
                                    min="0"
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.nbPalettesTana || '-'}</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffPalettes)}`}>
                                {currentValues.nbPalettesTana ? formatDifference(diffPalettes) : '-'}
                              </td>

                              {/* Cartons */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50">{colis.nbCartons}</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={currentValues.nbCartonsTana}
                                    onChange={(e) => handleInputChange(colis.id, 'nbCartonsTana', e.target.value)}
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    step="1"
                                    min="0"
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.nbCartonsTana || '-'}</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffCartons)}`}>
                                {currentValues.nbCartonsTana ? formatDifference(diffCartons) : '-'}
                              </td>

                              {/* Poids */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50 hidden md:table-cell">{colis.poids} kg</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={currentValues.poidsTana}
                                    onChange={(e) => handleInputChange(colis.id, 'poidsTana', e.target.value)}
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    step="0.1"
                                    min="0"
                                    placeholder="0.0"
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.poidsTana ? `${currentValues.poidsTana} kg` : '-'}</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffPoids)} hidden md:table-cell`}>
                                {currentValues.poidsTana ? formatDifference(diffPoids, ' kg') : '-'}
                              </td>

                              {/* Volume */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50 hidden lg:table-cell">{colis.volume} m³</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={currentValues.volumeTana}
                                    onChange={(e) => handleInputChange(colis.id, 'volumeTana', e.target.value)}
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    step="0.1"
                                    min="0"
                                    placeholder="0.0"
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.volumeTana ? `${currentValues.volumeTana} m³` : '-'}</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffVolume)} hidden lg:table-cell`}>
                                {currentValues.volumeTana ? formatDifference(diffVolume, ' m³') : '-'}
                              </td>

                              {/* Actions */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                {isEditing ? (
                                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                    <button
                                      onClick={() => handleSave(colis.id, depart.id)}
                                      className="text-green-600 hover:text-green-900 flex items-center justify-center space-x-1 text-xs"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span className="hidden sm:inline">Sauver</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditToggle(colis.id, depart.id)}
                                      className="text-gray-600 hover:text-gray-900 text-xs"
                                    >
                                      <span className="hidden sm:inline">Annuler</span>
                                      <span className="sm:hidden">✕</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditToggle(colis.id, depart.id)}
                                    className="text-blue-600 hover:text-blue-900 text-xs"
                                  >
                                    Vérifier
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}