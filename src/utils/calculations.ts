// Utilitaires de calcul pour l'inventaire

export const calculateWFI = (volume: string, poids: string): string => {
  const vol = parseFloat(volume);
  const weight = parseFloat(poids);
  
  if (!vol || !weight || vol <= 0 || weight <= 0) {
    return '-';
  }
  
  const wfi = (weight / 28000) / (vol / 65);
  return wfi.toFixed(3);
};

export const getWFIColor = (wfiValue: string): string => {
  if (wfiValue === '-') return 'text-gray-500';
  
  const wfi = parseFloat(wfiValue);
  if (isNaN(wfi)) return 'text-gray-500';
  
  if (wfi < 1) {
    const intensity = Math.min(1, (1 - wfi) * 2);
    if (intensity > 0.8) return 'text-green-800';
    if (intensity > 0.6) return 'text-green-700';
    if (intensity > 0.4) return 'text-green-600';
    if (intensity > 0.2) return 'text-green-500';
    return 'text-green-400';
  } else if (wfi > 1) {
    const intensity = Math.min(1, (wfi - 1) * 0.5);
    if (intensity > 0.8) return 'text-red-800';
    if (intensity > 0.6) return 'text-red-700';
    if (intensity > 0.4) return 'text-red-600';
    if (intensity > 0.2) return 'text-red-500';
    return 'text-red-400';
  } else {
    return 'text-gray-900';
  }
};

export const calculateSelectionStats = (selectedColisIds: number[], inventoryItems: any[]) => {
  const idSet = new Set(selectedColisIds.map(Number));
  const selectedColis = inventoryItems.filter(item => idSet.has(Number(item.id)));
  return {
    nbPalettes: selectedColis.reduce((total, colis) => total + (parseInt(colis.nbPalettes) || 0), 0),
    nbCartons: selectedColis.reduce((total, colis) => total + (parseInt(colis.nbCartons) || 0), 0),
    poids: selectedColis.reduce((total, colis) => total + (parseFloat(colis.poids) || 0), 0),
    volume: selectedColis.reduce((total, colis) => total + (parseFloat(colis.volume) || 0), 0)
  };
};