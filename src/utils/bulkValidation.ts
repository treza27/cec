import { BulkImportRow, BulkImportStats } from '../types/bulkImport';

function convertDateToISO(dateStr: string): string | null {
  // Format dd/mm/yyyy
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(ddmmyyyyRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Validate ranges
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Check valid day for month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return null;

    const isoMonth = String(month).padStart(2, '0');
    const isoDay = String(day).padStart(2, '0');
    return `${year}-${isoMonth}-${isoDay}`;
  }

  // Format YYYY-MM-DD (rétrocompatibilité)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateStr)) {
    return dateStr;
  }

  return null;
}

export function validateRow(
  row: BulkImportRow,
  existingPseudos: string[],
  existingShippingMarks: string[],
  allTrackingNumbers: Set<string>,
  existingTrackingNumbers: Set<string> = new Set()
): BulkImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.dateEntree || !row.dateEntree.trim()) {
    errors.push('Date d\'entrée obligatoire');
  } else {
    const isoDate = convertDateToISO(row.dateEntree);
    if (!isoDate) {
      errors.push('Format de date invalide (attendu: jj/mm/aaaa)');
    } else {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        errors.push('Date invalide');
      }
    }
  }

  if (!row.entrepot || !row.entrepot.trim()) {
    errors.push('Entrepôt obligatoire');
  } else if (!['Guangzhou', 'Yiwu'].includes(row.entrepot)) {
    errors.push('Entrepôt doit être "Guangzhou" ou "Yiwu"');
  }

  if (!row.pseudo || !row.pseudo.trim()) {
    warnings.push('PSEUDO vide - colis sans client assigné');
  } else if (!existingPseudos.includes(row.pseudo)) {
    warnings.push('Nouveau PSEUDO - client sera créé');
  }

  if (row.trackingNumber && row.trackingNumber.trim()) {
    const normalizedTracking = row.trackingNumber.trim().toUpperCase();
    if (allTrackingNumbers.has(normalizedTracking)) {
      errors.push('Numéro de suivi dupliqué dans l\'import');
    } else if (existingTrackingNumbers.has(normalizedTracking)) {
      errors.push('Numéro de suivi existe déjà dans la base de données');
    }
  }

  if (row.shippingMark && row.shippingMark.trim()) {
    if (!existingShippingMarks.includes(row.shippingMark)) {
      warnings.push('Nouvelle Shipping Mark - sera créée automatiquement');
    }
  }

  if (!row.description || !row.description.trim()) {
    errors.push('Description obligatoire');
  }

  if (row.nbPalettes && row.nbPalettes.trim() !== '') {
    const nbPalettes = parseInt(row.nbPalettes);
    if (isNaN(nbPalettes) || nbPalettes < 0) {
      errors.push('Nombre de palettes invalide (minimum 0)');
    }
  }

  if (!row.nbCartons || row.nbCartons.trim() === '') {
    errors.push('Nombre de cartons obligatoire');
  } else {
    const nbCartons = parseInt(row.nbCartons);
    if (isNaN(nbCartons) || nbCartons < 1) {
      errors.push('Nombre de cartons invalide (minimum 1)');
    }
  }

  if (row.poids && row.poids.trim() !== '') {
    const poids = parseFloat(row.poids);
    if (isNaN(poids) || poids < 0) {
      errors.push('Poids invalide (doit être >= 0)');
    }
  }

  if (row.volume && row.volume.trim() !== '') {
    const volume = parseFloat(row.volume);
    if (isNaN(volume) || volume < 0) {
      errors.push('Volume invalide (doit être >= 0)');
    } else if (volume > 0 && volume < 0.00000001) {
      errors.push('Volume trop petit (minimum 0.00000001 m³)');
    }
  }

  return {
    ...row,
    errors,
    warnings,
    isValid: errors.length === 0
  };
}

export function validateAllRows(
  rows: BulkImportRow[],
  existingPseudos: string[],
  existingShippingMarks: string[],
  existingTrackingNumbers: string[] = []
): BulkImportRow[] {
  const trackingNumbers = new Set<string>();
  const existingTrackingSet = new Set(existingTrackingNumbers.map(t => t.toUpperCase()));

  rows.forEach(row => {
    if (row.trackingNumber && row.trackingNumber.trim()) {
      trackingNumbers.add(row.trackingNumber.trim().toUpperCase());
    }
  });

  return rows.map(row => {
    const otherTrackingNumbers = new Set(trackingNumbers);
    if (row.trackingNumber) {
      otherTrackingNumbers.delete(row.trackingNumber.trim().toUpperCase());
    }

    return validateRow(row, existingPseudos, existingShippingMarks, otherTrackingNumbers, existingTrackingSet);
  });
}

export function calculateStats(rows: BulkImportRow[]): BulkImportStats {
  const stats: BulkImportStats = {
    totalRows: rows.length,
    validRows: 0,
    errorRows: 0,
    warningRows: 0,
    totalPalettes: 0,
    totalCartons: 0,
    totalPoids: 0,
    totalVolume: 0,
    guangzhouCount: 0,
    yiwuCount: 0
  };

  rows.forEach(row => {
    if (row.isValid) {
      stats.validRows++;
    } else {
      stats.errorRows++;
    }

    if (row.warnings.length > 0 && row.isValid) {
      stats.warningRows++;
    }

    const palettes = parseInt(row.nbPalettes) || 0;
    const cartons = parseInt(row.nbCartons) || 0;
    const poids = parseFloat(row.poids) || 0;
    const volume = parseFloat(row.volume) || 0;

    if (!isNaN(palettes)) stats.totalPalettes += palettes;
    if (!isNaN(cartons)) stats.totalCartons += cartons;
    if (!isNaN(poids)) stats.totalPoids += poids;
    if (!isNaN(volume)) stats.totalVolume += volume;

    if (row.entrepot === 'Guangzhou') {
      stats.guangzhouCount++;
    } else if (row.entrepot === 'Yiwu') {
      stats.yiwuCount++;
    }
  });

  return stats;
}
