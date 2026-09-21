import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Package, Save, Calculator, Eye, EyeOff, Search, X, Loader2 } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useDepartures } from '../../hooks/useDepartures';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem } from '../../types';
import MeasuredInput from './MeasuredInput';

export default function ContreMesurePage() {
  const { items: inventoryItems, loading: inventoryLoading, updateMeasuredValues, isUpdatingMeasuredValues } = useInventory();
  const { items: departItems, loading: departsLoading } = useDepartures();
  const [editingColis, setEditingColis] = useState<{ [key: string]: boolean }>({});
  const [measuredValues, setMeasuredValues] = useState<{ [key: number]: {
    nbPalettesTana: string;
    nbCartonsTana: string;
    poidsTana: string;
    volumeTana: string;
  } }>({});
  const [expandedDeparts, setExpandedDeparts] = useState<{ [key: number]: boolean }>({});
  const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({});
  const [extraColisByDepart, setExtraColisByDepart] = useState<{ [key: number]: InventoryItem[] }>({});

  const departsArrivedTana = departItems.filter(depart =>
    depart.statut === 'arrivee_antananarivo' || depart.statut === 'decharge_trie'
  );

  const inventoryByColisId = useMemo(() => {
    const map = new Map<number, typeof inventoryItems[number]>();
    for (const item of inventoryItems) {
      map.set(Number(item.id), item);
    }
    return map;
  }, [inventoryItems]);

  useEffect(() => {
    if (departsLoading || inventoryLoading) return;

    departsArrivedTana.forEach(depart => {
      if (!depart.colisAssocies || depart.colisAssocies.length === 0) return;

      const missingIds: number[] = [];
      for (const colisId of depart.colisAssocies) {
        if (!inventoryByColisId.has(Number(colisId))) {
          missingIds.push(Number(colisId));
        }
      }

      if (missingIds.length > 0) {
        inventoryService.getByIds(missingIds).then(fetched => {
          if (fetched.length > 0) {
            setExtraColisByDepart(prev => ({ ...prev, [depart.id]: fetched }));
          }
        }).catch(() => {});
      }
    });
  }, [departsArrivedTana.map(d => d.id).join(','), inventoryByColisId, departsLoading, inventoryLoading]);

  const allColisMap = useMemo(() => {
    const map = new Map<number, InventoryItem>(inventoryByColisId);
    Object.values(extraColisByDepart).flat().forEach(item => {
      map.set(Number(item.id), item);
    });
    return map;
  }, [inventoryByColisId, extraColisByDepart]);

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
    return `${sign}${difference.toFixed(difference % 1 === 0 ? 0 : 3)}${unit}`;
  };

  const handleEditToggle = (colisId: number, departId: number) => {
    const key = `${departId}-${colisId}`;
    setEditingColis(prev => ({ ...prev, [key]: !prev[key] }));

    if (!measuredValues[colisId]) {
      const colis = allColisMap.get(Number(colisId));
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
    if (!depart || !depart.colisAssocies || depart.colisAssocies.length === 0) return [];
    const result: InventoryItem[] = [];
    for (const colisId of depart.colisAssocies) {
      const item = allColisMap.get(Number(colisId));
      if (item) result.push(item);
    }
    return result;
  };

  const getFilteredColisForDepart = (departId: number) => {
    const allColis = getColisForDepart(departId);
    const query = (searchQueries[departId] || '').toLowerCase().trim();
    if (!query) return allColis;
    return allColis.filter(item => {
      const pseudo = (item.pseudo || item.client_nom || '').toLowerCase();
      const tracking = (item.trackingNumber || '').toLowerCase();
      const shippingMark = (item.shippingMark || '').toLowerCase();
      return pseudo.includes(query) || tracking.includes(query) || shippingMark.includes(query);
    });
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

    const totalVolumeTheorique = colis.reduce((sum, item) => {
      return sum + (parseFloat(item.volume) || 0);
    }, 0);

    const totalVolumeMesure = colis.reduce((sum, item) => {
      const measured = measuredValues[item.id]?.volumeTana || item.volumeTana || '';
      return sum + (parseFloat(measured) || 0);
    }, 0);

    return { totalDiffPalettes, totalDiffCartons, totalDiffPoids, totalDiffVolume, totalVolumeTheorique, totalVolumeMesure };
  };

  if (departsLoading || inventoryLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contre mesure</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

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
                {departsArrivedTana.reduce((sum, depart) => sum + (depart.colisAssocies?.length || 0), 0)}
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
                {departsArrivedTana.reduce((sum, depart) => {
                  const colis = getColisForDepart(depart.id);
                  return sum + colis.filter(item =>
                    item.nbCartonsTana && item.poidsTana && item.volumeTana
                  ).length;
                }, 0)}
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
                        {depart.colisAssocies?.length || 0} colis • Arrivé le {depart.dateArriveTana ? new Date(depart.dateArriveTana).toLocaleDateString('fr-FR') : 'N/A'}
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

                {/* Comparaison volumes théorique vs contre-mesure */}
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                  <div className="flex items-center space-x-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Vol. théorique:</span>
                    <span className="font-bold text-blue-700">{stats.totalVolumeTheorique.toFixed(3)} m³</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-green-50 px-3 py-1.5 rounded-lg">
                    <Calculator className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Contre-mesure:</span>
                    <span className="font-bold text-green-700">{stats.totalVolumeMesure.toFixed(3)} m³</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50">
                    <span className="text-gray-600">Écart vol.:</span>
                    <span className={`font-bold ${getDifferenceColor(stats.totalVolumeTheorique > 0 ? stats.totalVolumeMesure - stats.totalVolumeTheorique : 0)}`}>
                      {stats.totalVolumeTheorique > 0
                        ? formatDifference(stats.totalVolumeMesure - stats.totalVolumeTheorique, ' m³')
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tableau des colis */}
              {isExpanded && (
                <div className="p-4 sm:p-6">
                  {/* Barre de recherche */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQueries[depart.id] || ''}
                        onChange={(e) => setSearchQueries(prev => ({ ...prev, [depart.id]: e.target.value }))}
                        placeholder="Rechercher par Pseudo, Tracking ou Shipping Mark..."
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      {searchQueries[depart.id] && (
                        <button
                          onClick={() => setSearchQueries(prev => ({ ...prev, [depart.id]: '' }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {searchQueries[depart.id] && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        {getFilteredColisForDepart(depart.id).length} résultat{getFilteredColisForDepart(depart.id).length !== 1 ? 's' : ''} sur {colisForDepart.length} colis
                      </p>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pseudo</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart. Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vol. Mes.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart. Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vol. Orig.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff. Cart.</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff. Poids</th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diff. Vol.</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredColisForDepart(depart.id).length === 0 ? (
                          <tr>
                            <td colSpan={13} className="px-4 py-8 text-center text-sm text-gray-500">
                              Aucun colis ne correspond a votre recherche.
                            </td>
                          </tr>
                        ) : null}
                        {getFilteredColisForDepart(depart.id).map((colis) => {
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
                                      <span className="sm:hidden">&#x2715;</span>
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

                              {/* Identification */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{colis.shippingMark}</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{colis.trackingNumber || '-'}</td>
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{colis.pseudo || colis.client_nom || '-'}</td>

                              {/* Cartons mesurés */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {isEditing ? (
                                  <MeasuredInput
                                    value={currentValues.nbCartonsTana}
                                    colisId={colis.id}
                                    field="nbCartonsTana"
                                    step="1"
                                    min="0"
                                    placeholder="0"
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    onCommit={handleInputChange}
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.nbCartonsTana || '-'}</span>
                                )}
                              </td>

                              {/* Poids mesuré */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {isEditing ? (
                                  <MeasuredInput
                                    value={currentValues.poidsTana}
                                    colisId={colis.id}
                                    field="poidsTana"
                                    step="0.1"
                                    min="0.001"
                                    placeholder="0.0"
                                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    onCommit={handleInputChange}
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.poidsTana ? `${parseFloat(String(currentValues.poidsTana)).toFixed(3)} kg` : '-'}</span>
                                )}
                              </td>

                              {/* Volume mesuré */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {isEditing ? (
                                  <MeasuredInput
                                    value={currentValues.volumeTana}
                                    colisId={colis.id}
                                    field="volumeTana"
                                    step="0.001"
                                    min="0.001"
                                    placeholder="0.000"
                                    className="w-20 sm:w-24 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-800 font-semibold bg-green-50 border border-green-300 rounded focus:ring-1 focus:ring-green-500"
                                    onCommit={handleInputChange}
                                  />
                                ) : (
                                  <span className="text-green-800 font-semibold bg-green-50 px-2 py-1 rounded">{currentValues.volumeTana ? `${parseFloat(String(currentValues.volumeTana)).toFixed(3)} m³` : '-'}</span>
                                )}
                              </td>

                              {/* Cartons originaux */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50">{colis.nbCartons}</td>

                              {/* Poids original */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50">{parseFloat(String(colis.poids)).toFixed(3)} kg</td>

                              {/* Volume original */}
                              <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-700 font-semibold bg-blue-50">{parseFloat(String(colis.volume)).toFixed(3)} m³</td>

                              {/* Diff. Cartons */}
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffCartons)}`}>
                                {currentValues.nbCartonsTana ? formatDifference(diffCartons) : '-'}
                              </td>

                              {/* Diff. Poids */}
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffPoids)}`}>
                                {currentValues.poidsTana ? formatDifference(diffPoids, ' kg') : '-'}
                              </td>

                              {/* Diff. Volume */}
                              <td className={`px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${getDifferenceColor(diffVolume)}`}>
                                {currentValues.volumeTana ? formatDifference(diffVolume, ' m³') : '-'}
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
